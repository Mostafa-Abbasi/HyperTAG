// src/utils/timeUtils.js

// calculates the time that it takes from now to reset the daily token limit (in UTC)
export function calculateTimeToReset() {
  // Get the current UTC time
  const now = new Date();

  // Get the next day's midnight in UTC (00:00 AM UTC | Time to reset the rate limit usage)
  const nextMidnightUTC = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0
    )
  );

  // Calculate the difference in milliseconds
  const timeToReset = nextMidnightUTC - now;

  // Convert milliseconds to hours and minutes
  const hours = Math.floor(timeToReset / (1000 * 60 * 60));
  const minutes = Math.floor((timeToReset % (1000 * 60 * 60)) / (1000 * 60));

  // Format the time to reset as HH:MM
  return `${hours}h ${minutes}m`;
}
