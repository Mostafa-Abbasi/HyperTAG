// src/index.js
import startBot from "./src/bot/index.js";
import logger from "./src/utils/logger.js";

// Start the bot
startBot();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled promise rejection:", err);
});
