// src/bot/callbackController.js

import {
  sendMessage,
  editMessage,
  answerCallbackQuery,
  editImage,
} from "../services/telegramServices.js";
import {
  getUserDetailsByUserId,
  getUserChannels,
  toggleSummaryFeatureForUser,
  toggleSummaryFeatureForChannel,
  toggleBotSignatureForChannel,
  getBotStartDate,
  toggleMetricDisplayById,
} from "../../db/database.js";
import {
  createPeriodStatsKeyboard,
  createMetricsToggleKeyboard,
  capitalizeFirstLetter,
  retrieveMetricsCountsInRange,
  createStatsSummaryMessage,
  formatCurrentDate,
  processGraphStatsRequest,
  createPeriodNavigationButtons,
} from "../utils/statsUtils.js";
import fs from "fs";
import config from "../config/index.js";
import logger from "../utils/logger.js";

// Handling callback queries sent to the bot from users
export async function handleCallbackQuery(callbackQuery) {
  const { data, message, from } = callbackQuery;

  if (!data) return;

  try {
    const command = data.split(" ")[0]; // Extract command from callback data

    switch (command) {
      case "/summary":
        await handleSummaryCallback(message, data);
        break;

      case "/signature":
        await handleSignatureCallback(message, data);
        break;

      case "/stats":
        await handleStatsCallback(message, data);
        break;

      // for toggling stats metrics
      case "/toggle":
        await handleStatsToggleCallback(message, data);
        break;

      default:
        await sendMessage(
          message,
          `⚠️ <b>Unknown Action</b>\n\nThe action <b>${command}</b> is not recognized.`
        );
        break;
    }

    // Acknowledge callback query to remove the loading spinner in the chat
    await answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    logger.error(
      `Error handling callback query from user ${from.first_name || ""} ${
        from.username || ""
      } for data ${data}:`,
      error
    );
  }
}

// Handles callback for toggling summary feature on/off
async function handleSummaryCallback(message, data) {
  const entityId = data.split(" ")[1]; // Extract entity ID (could be user or channel)

  try {
    // Check if the callback is for a user or a channel
    const isUser = entityId == message.chat.id;
    isUser
      ? await toggleSummaryFeatureForUser(entityId)
      : await toggleSummaryFeatureForChannel(entityId);

    const userDetails = await getUserDetailsByUserId(message.chat.id);
    const userChannels = await getUserChannels(message.chat.id);

    // Variable to store user-specific summary info
    let userSummaryInfo = "";
    // Variable to store channel-specific summary info
    let channelsSummaryInfo = "";
    // Variable to store inline keyboard buttons
    const inlineKeyboard = [];

    const { user_id, summary_feature } = userDetails;
    const currentState = summary_feature == true ? "✅" : "❌";
    const nextState = summary_feature == true ? "❌ Disable" : "✅ Enable";

    userSummaryInfo = `
🤖 <b>Chat with Bot</b>
📝 <b>- Summary Status</b>: ${currentState}\n`;
    inlineKeyboard.push([
      {
        text: `${nextState} for 🤖 Chat with Bot`,
        callback_data: `/summary ${user_id}`,
      },
    ]);

    // Loop through each channel to build the channel(s) text and buttons
    for (const channel of userChannels) {
      const { channel_id, channel_name, summary_feature } = channel;

      const currentState = summary_feature == true ? "✅" : "❌";
      const nextState = summary_feature == true ? "❌ Disable" : "✅ Enable";

      // Add the channel summary info to the string with styling
      channelsSummaryInfo += `
📢 <b>Channel</b>: ${channel_name}
📝 <b>- Summary Status</b>: ${currentState}\n`;

      // Add button for each channel to enable/disable summary
      inlineKeyboard.push([
        {
          text: `${nextState} for 📢 ${channel_name}`,
          callback_data: `/summary ${channel_id}`,
        },
      ]);
    }

    await editMessage(
      message,
      `🛠️ <b>Summary Feature Configuration</b>\n\n<b>Notes:</b>\n- Generating Summary Takes Additional Time.\n- Generated Summaries Are <b>Not</b> Always Correct.\n\n${userSummaryInfo}${channelsSummaryInfo}`,
      {
        reply_markup: { inline_keyboard: inlineKeyboard },
      }
    );
  } catch (error) {
    logger.error(`Error updating summary status for ID ${entityId}:`, error);
    await sendMessage(
      message,
      `⚠️ <b>Error</b>\n\nFailed to update summary status.`
    );
  }
}

// Handles callback for toggling Bot Signature on/off
async function handleSignatureCallback(message, data) {
  const channelId = data.split(" ")[1]; // Extracting the Channel ID

  try {
    await toggleBotSignatureForChannel(channelId);

    const userChannels = await getUserChannels(message.chat.id);

    const userId = message.chat.id;
    // Only allow vip users to use the signature command
    if (!config.vipUserIds.includes(userId)) {
      await sendMessage(
        message,
        `⛔️ <b>Access Denied</b>\n\nYou are not authorized to use this command.`
      );
      return;
    }

    // Variable to store channel-specific signature info
    let channelsSignatureInfo = "";
    // Variable to store inline keyboard buttons for enabling/disabling singature
    const inlineKeyboard = [];

    // Loop through each channel to build the channel(s) text and buttons
    for (const channel of userChannels) {
      const { channel_id, channel_name, bot_signature } = channel;

      const currentState = bot_signature == true ? "✅" : "❌";
      const nextState = bot_signature == true ? "❌ Disable" : "✅ Enable";

      // Add the channel bot_signature info to the string with styling
      channelsSignatureInfo += `
  📢 <b>Channel</b>: ${channel_name}
  📝 <b>- Signature Status</b>: ${currentState}\n`;

      // Add button for each channel to enable/disable signature
      inlineKeyboard.push([
        {
          text: `${nextState} for 📢 ${channel_name}`,
          callback_data: `/signature ${channel_id}`,
        },
      ]);
    }

    await editMessage(
      message,
      `🛠️ <b>Bot Signature Configuration</b>\n\n${channelsSignatureInfo}`,
      {
        reply_markup: { inline_keyboard: inlineKeyboard },
      }
    );
  } catch (error) {
    logger.error(
      `Error updating signature status for Channel ID ${channelId}:`,
      error
    );
    await sendMessage(
      message,
      `⚠️ <b>Error</b>\n\nFailed to update signature status.`
    );
  }
}

// Handles callback for stats
async function handleStatsCallback(message, data) {
  const [command, period, startTime, endTime] = data.split(" ");

  try {
    if (command === "/stats" && !period) {
      // If 'Go Back' is clicked, handle it by sending the content of handleStats() again.

      const [
        registeredUsersCount,
        inactiveUsersCount,
        activeUsersCount,
        newUsersCount,

        registeredChannelsCount,
        inactiveChannelsCount,
        activeChannelsCount,
        newChannelsCount,

        directRequestsCount,
        channelRequestsCount,

        geminiApiCalls,
        textRazorApiCalls,
        openRouterApiCalls,
      ] = await retrieveMetricsCountsInRange();

      const imagePath = await processGraphStatsRequest(
        message,
        "/stats",
        "daily"
      );

      // Prepare the inline keyboard for different time periods
      const inlineKeyboard = await createPeriodStatsKeyboard();

      const formattedDate = formatCurrentDate();

      await editImage(
        message,
        imagePath,
        `
<b>📊 ${config.textPlaceholders.botName} Usage Stats</b>
<b>📅 Period: ${formattedDate}\n</b>
<b>Today's Usage Stats</b>

1. Registered Users: ${registeredUsersCount} (Reachable ${
          registeredUsersCount - inactiveUsersCount
        } | Unreachable ${inactiveUsersCount})
2. Active Users: ${activeUsersCount}
3. New Users: ${newUsersCount}

4. Registered Channels: ${registeredChannelsCount} (Reachable ${
          registeredChannelsCount - inactiveChannelsCount
        } | Unreachable ${inactiveChannelsCount})
5. Active Channels: ${activeChannelsCount}
6. New Channels: ${newChannelsCount}

7. Chat Requests: ${directRequestsCount}
8. Channel Requests: ${channelRequestsCount}

9. Gemini API Calls: ${geminiApiCalls}
10. TextRazor API Calls: ${textRazorApiCalls}
11. OpenRouter API Calls: ${openRouterApiCalls}
`,
        {
          reply_markup: { inline_keyboard: inlineKeyboard },
        }
      );

      // Clean up: delete the image file after sending it
      fs.unlinkSync(imagePath);
      return;
    }

    let startDate = new Date(startTime);
    let endDate = new Date(endTime);

    // Handle "allTime" period separately
    if (period === "allTime") {
      const botStartDateISO = await getBotStartDate();
      startDate = new Date(botStartDateISO);
    }

    // Retrieve metrics and create stats message
    const counts = await retrieveMetricsCountsInRange(startDate, endDate);
    const statsMessage = createStatsSummaryMessage(counts, period, startDate);

    // Create inline keyboard
    const inlineKeyboard =
      period !== "allTime"
        ? createPeriodNavigationButtons(command, period, startDate, endDate)
        : [];

    // Add metrics toggle buttons for all periods
    inlineKeyboard.push(
      ...(await createMetricsToggleKeyboard(
        startTime,
        endTime,
        `${command} ${period}`
      ))
    );

    // Render and send the graph image
    const imagePath = await processGraphStatsRequest(
      message,
      command,
      period,
      startDate,
      endDate
    );

    const timePeriod =
      period === "allTime" ? "All-Time" : capitalizeFirstLetter(period);

    await editImage(
      message,
      imagePath,
      `<b>📊 ${config.textPlaceholders.botName} ${timePeriod} Usage Stats</b>\n${statsMessage}`,
      {
        reply_markup: { inline_keyboard: inlineKeyboard },
      }
    );

    // Clean up: delete the image file after sending it
    fs.unlinkSync(imagePath);
  } catch (error) {
    logger.error(`Error handling stats callback for ${period}:`, error);
    await sendMessage(message, `⚠️ <b>Error</b>\n\nFailed to fetch stats.`);
  }
}

async function handleStatsToggleCallback(message, data) {
  const [, metricId, mainCommand, period, unixStartTime, unixEndTime] =
    data.split(" ");

  // Helper Function to decompress Unix timestamp to ISO date
  function decompressUnixTimestamp(unixTimestamp) {
    // Convert the Unix timestamp back into a Date object
    const date = new Date(unixTimestamp * 1000); // Multiply by 1000 to convert seconds to milliseconds
    return date.toISOString(); // Convert to ISO string format
  }

  const decompressedStartTime = decompressUnixTimestamp(unixStartTime);
  const decompressedEndTime = decompressUnixTimestamp(unixEndTime);
  const reconstructedSourceCommand = `${mainCommand} ${period} ${decompressedStartTime} ${decompressedEndTime}`;

  await toggleMetricDisplayById(metricId);

  await handleStatsCallback(message, reconstructedSourceCommand);
}
