// src/utils/statsUtils.js

import {
  activeChannelsCountWithinDateRange,
  activeUsersCountWithinDateRange,
  registeredUsersCountWithinDateRange,
  registeredChannelsCountWithinDateRange,
  newUsersCountWithinDateRange,
  newChannelsCountWithinDateRange,
  directRequestsCountWithingDateRange,
  channelRequestsCountWithinDateRange,
  getMetricsDisplayState,
  getBotStartDate,
  apiCallsCountWithinDateRange,
  inactiveUsersCount,
  inactiveChannelsCount,
} from "../../db/database.js";
import { sendMessage } from "../services/telegramServices.js";
import { createCanvas } from "canvas";
import Chart from "chart.js/auto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "./logger.js";

// Generates a formatted stats message
export function createStatsSummaryMessage(counts, period, startDate) {
  let label = "";

  if (period === "daily") {
    // 2024/08/24
    label = startDate.toISOString().slice(0, 10);
  } else if (period === "weekly") {
    // Week of 2024/08/22
    label = `Week of ${startDate.toISOString().slice(0, 10)}`;
  } else if (period === "monthly") {
    // 2024/08
    label = startDate.toISOString().slice(0, 7);
  } else if (period === "yearly") {
    // 2024
    label = startDate.toISOString().slice(0, 4);
  } else if (period === "allTime") {
    // From Bot Start Time (2024/08/24)
    label = `From Bot Start Time (${startDate.toISOString().slice(0, 10)})`;
  }

  const stats = `<b>📅 Period: ${label}</b>

1. Registered Users: ${counts[0]} (Reachable ${
    counts[0] - counts[1]
  } | Unreachable ${counts[1]})
2. Active Users: ${counts[2]}
3. New Users: ${counts[3]}

4. Registered Channels: ${counts[4]} (Reachable ${
    counts[4] - counts[5]
  } | Unreachable ${counts[5]})
5. Active Channels: ${counts[6]}
6. New Channels: ${counts[7]}

7. Chat Requests: ${counts[8]}
8. Channel Requests: ${counts[9]}

9. Gemini API Calls: ${counts[10]}
10. TextRazor API Calls: ${counts[11]}
11. OpenRouter API Calls: ${counts[12]}`;
  return stats;
}

export async function processGraphStatsRequest(
  message,
  command,
  period,
  startTime = null,
  endTime = null
) {
  try {
    // Convert startTime and endTime to UTC Date objects
    const startDate = startTime
      ? new Date(startTime)
      : new Date(getStartOfDay());
    const endDate = endTime ? new Date(endTime) : new Date(getEndOfDay());

    let labels = [];
    const dataPoints = {
      registeredUsers: [],
      activeUsers: [],
      newUsers: [],
      registeredChannels: [],
      activeChannels: [],
      newChannels: [],
      chatRequests: [],
      channelRequests: [],
      geminiApiCalls: [],
      textRazorApiCalls: [],
      openRouterApiCalls: [],
    };

    let timeText;

    // Set up labels and interval counts based on the period
    let intervalCount = 0;
    switch (period) {
      case "daily":
        intervalCount = 96; // 96 intervals of 15 minutes in 24 hours
        labels = Array.from({ length: intervalCount }, (_, i) => {
          const date = new Date(startDate);
          date.setUTCHours(
            startDate.getUTCHours(),
            startDate.getUTCMinutes() + i * 15
          );
          return `${date.getUTCHours()}:${String(date.getUTCMinutes()).padStart(
            2,
            "0"
          )}`; // Format as H:mm in UTC
        });
        timeText = "daily - every 15 minutes";
        break;

      case "weekly":
        intervalCount = 7; // 7 days
        labels = Array.from({ length: intervalCount }, (_, i) => {
          const date = new Date(startDate);
          date.setUTCDate(startDate.getUTCDate() + i);
          return date.toISOString().split("T")[0]; // YYYY-MM-DD in UTC
        });
        timeText = "weekly - each day";
        break;

      case "monthly":
        const daysInMonth = new Date(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth() + 1,
          0
        ).getUTCDate();
        intervalCount = daysInMonth; // Number of days in the month
        labels = Array.from({ length: intervalCount }, (_, i) => {
          const date = new Date(startDate);
          date.setUTCDate(startDate.getUTCDate() + i);
          return date.toISOString().split("T")[0]; // YYYY-MM-DD in UTC
        });
        timeText = "monthly - each day";
        break;

      case "yearly":
        intervalCount = 12; // 12 months
        labels = Array.from({ length: intervalCount }, (_, i) => {
          const date = new Date(startDate);
          date.setUTCMonth(startDate.getUTCMonth() + i);
          return date.toISOString().split("T")[0].substring(0, 7); // YYYY-MM in UTC
        });
        timeText = "yearly - every month";
        break;

      case "allTime":
        const daysSinceCreation = Math.floor(
          (endDate - startDate) / (1000 * 60 * 60 * 24)
        ); // Total days
        intervalCount = daysSinceCreation;
        labels = Array.from({ length: intervalCount }, (_, i) => {
          const date = new Date(startDate);
          date.setUTCDate(startDate.getUTCDate() + i);
          return date.toISOString().split("T")[0]; // YYYY-MM-DD in UTC
        });
        timeText = "All-Time - each day";
        break;

      default:
        throw new Error("Invalid period specified for graph stats.");
    }

    // Helper function to calculate the start and end of intervals dynamically in UTC
    const getIntervalDates = (index) => {
      const intervalStart = new Date(startDate);
      const intervalEnd = new Date(intervalStart);

      switch (period) {
        case "daily":
          // For daily, split by 15-minute intervals in UTC
          intervalStart.setUTCHours(
            startDate.getUTCHours(),
            startDate.getUTCMinutes() + index * 15
          );
          intervalEnd.setUTCHours(
            intervalStart.getUTCHours(),
            intervalStart.getUTCMinutes() + 15
          );
          break;

        case "weekly":
        case "monthly":
          // For weekly and monthly, split by 24-hour days in UTC
          intervalStart.setUTCDate(startDate.getUTCDate() + index);
          intervalStart.setUTCHours(0, 0, 0, 0); // Beginning of the day
          intervalEnd.setUTCDate(intervalStart.getUTCDate() + 1); // End is the next day
          intervalEnd.setUTCHours(0, 0, 0, 0); // Beginning of the next day
          break;

        case "allTime":
          // Split by 24-hour days in UTC
          // Improved allTime case to handle multi-year ranges (BUT NOT TESTED)
          // If anything is wrong with allTime stats (e.g. for a scenario that starts from 2023 to 2024), is because of this code lol
          const msPerDay = 24 * 60 * 60 * 1000;
          const totalDays = Math.floor((endDate - startDate) / msPerDay);

          if (index > totalDays) {
            // If we've exceeded the total number of days, return the last valid interval
            intervalStart.setTime(endDate.getTime() - msPerDay);
            intervalEnd.setTime(endDate.getTime());
          } else {
            // Calculate the correct date by adding milliseconds
            intervalStart.setTime(startDate.getTime() + index * msPerDay);
            intervalEnd.setTime(intervalStart.getTime() + msPerDay);
          }

          // Ensure we don't exceed the end date
          if (intervalEnd > endDate) {
            intervalEnd.setTime(endDate.getTime());
          }

          // Set times to midnight UTC
          intervalStart.setUTCHours(0, 0, 0, 0);
          intervalEnd.setUTCHours(0, 0, 0, 0);
          break;

        case "yearly":
          // For yearly, split by months in UTC
          intervalStart.setUTCMonth(startDate.getUTCMonth() + index);
          intervalStart.setUTCDate(1); // First day of the month
          intervalStart.setUTCHours(0, 0, 0, 0); // Beginning of the day

          intervalEnd.setUTCMonth(intervalStart.getUTCMonth() + 1, 1); // First day of next month
          intervalEnd.setUTCHours(0, 0, 0, 0); // Beginning of the day
          break;

        default:
          throw new Error("Invalid period specified for graph stats.");
      }

      return { intervalStart, intervalEnd };
    };

    // Fetch data for each interval
    for (let i = 0; i < intervalCount; i++) {
      const { intervalStart, intervalEnd } = getIntervalDates(i);

      const [
        registeredUsersCount,
        inactiveUsersCount, // it won't be used for graph, just for maintaining the oder of variables
        activeUsersCount,
        newUsersCount,

        registeredChannelsCount,
        inactiveChannelsCount, // it won't be used for graph, just for maintaining the oder of variables
        activeChannelsCount,
        newChannelsCount,

        directRequestsCount,
        channelRequestsCount,

        geminiApiCallsCount,
        textRazorApiCallsCount,
        openRouterApiCallsCount,
      ] = await retrieveMetricsCountsInRange(intervalStart, intervalEnd);

      // Push all data into their corresponding arrays
      dataPoints.registeredUsers.push(registeredUsersCount);
      dataPoints.activeUsers.push(activeUsersCount);
      dataPoints.newUsers.push(newUsersCount);
      dataPoints.registeredChannels.push(registeredChannelsCount);
      dataPoints.activeChannels.push(activeChannelsCount);
      dataPoints.newChannels.push(newChannelsCount);
      dataPoints.chatRequests.push(directRequestsCount);
      dataPoints.channelRequests.push(channelRequestsCount);
      dataPoints.geminiApiCalls.push(geminiApiCallsCount);
      dataPoints.textRazorApiCalls.push(textRazorApiCallsCount);
      dataPoints.openRouterApiCalls.push(openRouterApiCallsCount);
    }

    // Prepare the data for the chart
    const stats = {
      labels,
      dataPoints,
    };

    // Generate the graph image
    const imagePath = await createStatsGraphImage(stats, timeText);

    // returning the path to the image
    return imagePath;
  } catch (error) {
    logger.error(`Error handling graph stats callback:`, error);
    await sendMessage(message, `⚠️ <b>Error</b>\n\nFailed to generate graph.`);
  }
}

// Function to generate the graph image
export async function createStatsGraphImage(stats, timeText) {
  const canvas = createCanvas(1280, 720); // Canvas dimensions
  const ctx = canvas.getContext("2d");

  // Fetch metric display states from DB (true for display, false for hide)
  const metricsDisplayStates = await getMetricsDisplayStates();

  const datasets = [];

  // Array of metrics and their corresponding display states, data, and colors
  const metrics = [
    {
      displayState: metricsDisplayStates.showRegisteredUsers,
      label: "Registered Users",
      data: stats.dataPoints.registeredUsers,
      color: "#e6194b", // Bright Red
    },
    {
      displayState: metricsDisplayStates.showActiveUsers,
      label: "Active Users",
      data: stats.dataPoints.activeUsers,
      color: "#3cb44b", // Bright Green
    },
    {
      displayState: metricsDisplayStates.showNewUsers,
      label: "New Users",
      data: stats.dataPoints.newUsers,
      color: "#ffe119", // Bright Yellow
    },
    {
      displayState: metricsDisplayStates.showRegisteredChannels,
      label: "Registered Channels",
      data: stats.dataPoints.registeredChannels,
      color: "#4363d8", // Bright Blue
    },
    {
      displayState: metricsDisplayStates.showActiveChannels,
      label: "Active Channels",
      data: stats.dataPoints.activeChannels,
      color: "#f58231", // Bright Orange
    },
    {
      displayState: metricsDisplayStates.showNewChannels,
      label: "New Channels",
      data: stats.dataPoints.newChannels,
      color: "#911eb4", // Bright Purple
    },
    {
      displayState: metricsDisplayStates.showChatRequests,
      label: "Chat Requests",
      data: stats.dataPoints.chatRequests,
      color: "#42d4f4", // Bright Cyan
    },
    {
      displayState: metricsDisplayStates.showChannelRequests,
      label: "Channel Requests",
      data: stats.dataPoints.channelRequests,
      color: "#f032e6", // Bright Pink
    },
    {
      displayState: metricsDisplayStates.showGeminiApiCalls,
      label: "Gemini Calls",
      data: stats.dataPoints.geminiApiCalls,
      color: "#bfef45", // Lime Green
    },
    {
      displayState: metricsDisplayStates.showTextrazorApiCalls,
      label: "TextRazor Calls",
      data: stats.dataPoints.textrazorApiCalls,
      color: "#fabebe", // Light Pink
    },
    {
      displayState: metricsDisplayStates.showOpenrouterApiCalls,
      label: "OpenRouter Calls",
      data: stats.dataPoints.openrouterApiCalls,
      color: "#469990", // Teal
    },
  ];

  // Helper function to generate the dataset for a specific metric
  function generateDataset(label, data, borderColor) {
    return {
      label,
      data,
      borderColor,
      borderWidth: 2,
      tension: 0.2,
      pointRadius: 0,
      fill: false,
    };
  }

  // Iterate over the metrics and add the datasets if the metric should be displayed
  metrics.forEach((metric) => {
    if (metric.displayState) {
      datasets.push(generateDataset(metric.label, metric.data, metric.color));
    }
  });

  // Create the chart
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: stats.labels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
        x: {
          title: {
            display: true,
            text: `Time (${timeText})`,
          },
        },
      },
    },
  });

  // Render the chart and save as image
  chart.update();

  // Define __dirname in ES module
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Define the temporary directory
  const tempDir = path.join(__dirname, "..", "temp");

  // Check if the temp directory exists, if not create it
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const imagePath = path.join(tempDir, `stats_graph_${Date.now()}.png`);
  const out = fs.createWriteStream(imagePath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  return new Promise((resolve, reject) => {
    out.on("finish", () => resolve(imagePath));
    out.on("error", reject);
  });
}

// Refactored into a utility function to reduce repetition
async function getMetricsDisplayStates() {
  const [
    showRegisteredUsers,
    showActiveUsers,
    showNewUsers,
    showRegisteredChannels,
    showActiveChannels,
    showNewChannels,
    showChatRequests,
    showChannelRequests,
    showGeminiApiCalls,
    showTextrazorApiCalls,
    showOpenrouterApiCalls,
  ] = await getMetricsDisplayState();

  return {
    showRegisteredUsers,
    showActiveUsers,
    showNewUsers,
    showRegisteredChannels,
    showActiveChannels,
    showNewChannels,
    showChatRequests,
    showChannelRequests,
    showGeminiApiCalls,
    showTextrazorApiCalls,
    showOpenrouterApiCalls,
  };
}

// Fetches counts within a specified date range based on the period
export async function retrieveMetricsCountsInRange(start, end) {
  return await Promise.all([
    registeredUsersCountWithinDateRange(end),
    inactiveUsersCount(),
    activeUsersCountWithinDateRange(start, end),
    newUsersCountWithinDateRange(start, end),

    registeredChannelsCountWithinDateRange(end),
    inactiveChannelsCount(),
    activeChannelsCountWithinDateRange(start, end),
    newChannelsCountWithinDateRange(start, end),

    directRequestsCountWithingDateRange(start, end),
    channelRequestsCountWithinDateRange(start, end),

    apiCallsCountWithinDateRange("gemini", start, end),
    apiCallsCountWithinDateRange("textrazor", start, end),
    apiCallsCountWithinDateRange("openrouter", start, end),
  ]);
}

// Function to build inline keyboard
export async function createPeriodStatsKeyboard() {
  const botStartDateISO = await getBotStartDate();

  return [
    [
      {
        text: "Yesterday's Stats",
        callback_data: `/stats daily ${getStartOfDay(-1)} ${getEndOfDay(-1)}`,
      },
    ],
    [
      {
        text: "Weekly",
        callback_data: `/stats weekly ${getStartOfWeek()} ${getEndOfWeek()}`,
      },
      {
        text: "Monthly",
        callback_data: `/stats monthly ${getStartOfMonth()} ${getEndOfMonth()}`,
      },
      {
        text: "Yearly",
        callback_data: `/stats yearly ${getStartOfYear()} ${getEndOfYear()}`,
      },
      {
        text: "All-Time",
        callback_data: `/stats allTime ${botStartDateISO} ${getEndOfDay()}`,
      },
    ],
  ];
}

// Create navigation buttons for time periods (non-allTime)
export function createPeriodNavigationButtons(
  command,
  period,
  startDate,
  endDate
) {
  const inlineKeyboard = [];
  const buttonTemplate = `${command} ${period}`;
  let today = new Date(); // Current date

  const prevDates = adjustDates(startDate, endDate, period, false);
  const nextDates = adjustDates(startDate, endDate, period, true);

  // Capitalize first letter of the period and remove last two characters
  // Should return "Day", "Week", "Month", or "Year"
  const periodText =
    period === "daily" ? "Day" : capitalizeFirstLetter(period.slice(0, -2));

  inlineKeyboard.push({
    text: `Previous ${periodText}`,
    callback_data: `${buttonTemplate} ${prevDates.newStart} ${prevDates.newEnd}`,
  });

  if (new Date(nextDates.newStart) <= today) {
    inlineKeyboard.push({
      text: `Next ${periodText}`,
      callback_data: `${buttonTemplate} ${nextDates.newStart} ${nextDates.newEnd}`,
    });
  }

  return [inlineKeyboard];
}

function generateToggleButton(
  index,
  isShown,
  buttonTemplate,
  unixStartTime,
  unixEndTime
) {
  return {
    text: `${index} ${isShown ? "✅" : "❌"}`,
    callback_data: `/toggle ${index} ${buttonTemplate} ${unixStartTime} ${unixEndTime}`,
  };
}

export async function createMetricsToggleKeyboard(
  startTime,
  endTime,
  buttonTemplate
) {
  // Fetch metric display states from DB (true for display, false for hide)
  const metricsDisplayStates = await getMetricsDisplayStates();
  const metrics = [
    metricsDisplayStates.showRegisteredUsers,
    metricsDisplayStates.showActiveUsers,
    metricsDisplayStates.showNewUsers,
    metricsDisplayStates.showRegisteredChannels,
    metricsDisplayStates.showActiveChannels,
    metricsDisplayStates.showNewChannels,
    metricsDisplayStates.showChatRequests,
    metricsDisplayStates.showChannelRequests,
    metricsDisplayStates.showGeminiApiCalls,
    metricsDisplayStates.showTextrazorApiCalls,
    metricsDisplayStates.showOpenrouterApiCalls,
  ];

  // Convert ISO timestamp to Unix timestamp for callback data
  const unixStartTime = Math.floor(new Date(startTime).getTime() / 1000); // Convert to Unix timestamp
  const unixEndTime = Math.floor(new Date(endTime).getTime() / 1000); // Convert to Unix timestamp

  // Grouping each 4 buttons in a row, resulting in 2 rows
  // 3rd row is for the "Go Back" button
  const inlineKeyboard = [
    [1, 2, 3, 4, 5].map((index) =>
      generateToggleButton(
        index,
        metrics[index - 1], // Adjusting index since array is 0-based
        buttonTemplate,
        unixStartTime,
        unixEndTime
      )
    ),
    [6, 7, 8, 9, 10, 11].map((index) =>
      generateToggleButton(
        index,
        metrics[index - 1], // Adjusting index since array is 0-based
        buttonTemplate,
        unixStartTime,
        unixEndTime
      )
    ),
    [{ text: "Go Back", callback_data: "/stats" }],
  ];

  return inlineKeyboard;
}

// Helper function to get the formatted date
export function formatCurrentDate() {
  const today = new Date();
  return `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}/${String(today.getDate()).padStart(2, "0")}`;
}

// Helper function to capitalize first letter
export function capitalizeFirstLetter(string) {
  return string ? string.charAt(0).toUpperCase() + string.slice(1) : string;
}

// Adjust dates based on the specified period
export function adjustDates(currentStart, currentEnd, period, isNext) {
  const adjustedStart = new Date(currentStart);
  const adjustedEnd = new Date(currentEnd);
  const adjustAmount = isNext ? 1 : -1;

  if (period === "daily") {
    adjustedStart.setUTCDate(adjustedStart.getUTCDate() + adjustAmount);
    adjustedEnd.setUTCDate(adjustedEnd.getUTCDate() + adjustAmount);
  } else if (period === "weekly") {
    adjustedStart.setUTCDate(adjustedStart.getUTCDate() + adjustAmount * 7);
    adjustedEnd.setUTCDate(adjustedEnd.getUTCDate() + adjustAmount * 7);
  } else if (period === "monthly") {
    adjustedStart.setUTCMonth(adjustedStart.getUTCMonth() + adjustAmount);
    adjustedEnd.setUTCMonth(adjustedEnd.getUTCMonth() + adjustAmount);
  } else if (period === "yearly") {
    adjustedStart.setUTCFullYear(adjustedStart.getUTCFullYear() + adjustAmount);
    adjustedEnd.setUTCFullYear(adjustedEnd.getUTCFullYear() + adjustAmount);
  }

  return {
    newStart: adjustedStart.toISOString(),
    newEnd: adjustedEnd.toISOString(),
  };
}

// Helper function to get start and end times for days, months, and years
function getStartOfDay(offset = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  date.setUTCHours(0, 0, 0, 0); // Set to start of the day (UTC 00:00)
  return date.toISOString();
}

function getEndOfDay(offset = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  date.setUTCHours(23, 59, 59, 999); // Set to end of the day (UTC 23:59)
  return date.toISOString();
}

// Helper function to get the start of the current week (starting from Sunday)
function getStartOfWeek(offset = 0) {
  const date = new Date();
  const day = date.getUTCDay(); // Get the current day of the week (0 = Sunday, 6 = Saturday)
  const diff = day + offset * 7; // Adjust by offset and current day to get to Sunday
  date.setUTCDate(date.getUTCDate() - diff); // Move to the previous Sunday
  date.setUTCHours(0, 0, 0, 0); // Set time to the start of the day
  return date.toISOString();
}

// Helper function to get the end of the current week (Saturday night)
function getEndOfWeek(offset = 0) {
  const date = new Date();
  const day = date.getUTCDay(); // Get the current day of the week
  const diff = 6 - day + offset * 7; // Adjust to move to Saturday
  date.setUTCDate(date.getUTCDate() + diff); // Move to the next Saturday
  date.setUTCHours(23, 59, 59, 999); // Set time to the end of the day
  return date.toISOString();
}

function getStartOfMonth(offset = 0) {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() + offset);
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0); // Set to start of the month (UTC 00:00)
  return date.toISOString();
}

function getEndOfMonth(offset = 0) {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() + offset + 1);
  date.setUTCDate(0); // Go to the last day of the previous month
  date.setUTCHours(23, 59, 59, 999); // Set to end of the day (UTC 23:59)
  return date.toISOString();
}

function getStartOfYear(offset = 0) {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() + offset);
  date.setUTCMonth(0, 1); // Set to January 1st
  date.setUTCHours(0, 0, 0, 0); // Set to start of the year (UTC 00:00)
  return date.toISOString();
}

function getEndOfYear(offset = 0) {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() + offset + 1);
  date.setUTCMonth(0, 1); // Go to the first day of the next year
  date.setUTCDate(0); // Go to the last day of the previous year
  date.setUTCHours(23, 59, 59, 999); // Set to end of the year (UTC 23:59)
  return date.toISOString();
}
