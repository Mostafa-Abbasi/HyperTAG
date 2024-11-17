// src/bot/polling.js

import { getUpdates } from "../services/telegramServices.js";
import { handleMessage } from "./botChatController.js";
import { handlePost } from "./postController.js";
import { handleCallbackQuery } from "./callbackController.js";
import config from "../config/index.js";
import logger from "../utils/logger.js";

const processUpdate = async (update) => {
  if (config.environment === "development") console.log("[INFO]", update);

  // if (config.environment === "development")
  //   console.log("\n\n[INFO]", JSON.stringify(update));

  switch (true) {
    // Handle messages sent directly to bot from chat
    case !!update.message: {
      const message = update.message;
      if (message.chat.type === "private") {
        const startTime = performance.now();
        await handleMessage(message);
        const endTime = performance.now();

        if (config.environment === "development") {
          logger.info(
            `Total Time for handling message: ${(endTime - startTime).toFixed(
              2
            )} ms \n\n\n\n`
          );
        }
      }
      break;
    }

    // Handle channel posts
    case !!update.channel_post: {
      const channelPost = update.channel_post;
      const startTime = performance.now();
      await handlePost(channelPost);
      const endTime = performance.now();

      if (config.environment === "development") {
        logger.info(
          `Total Time for handling post: ${(endTime - startTime).toFixed(
            2
          )} ms \n\n\n\n`
        );
      }
      break;
    }

    // Handle callback queries (added case)
    case !!update.callback_query: {
      const callbackQuery = update.callback_query;
      const startTime = performance.now();
      await handleCallbackQuery(callbackQuery); // Handle callback query for summary settings
      const endTime = performance.now();

      if (config.environment === "development") {
        logger.info(
          `Total Time for handling callback query: ${(
            endTime - startTime
          ).toFixed(2)} ms \n\n\n\n`
        );
      }
      break;
    }
    default:
      if (config.environment === "development") {
        logger.error(`Unknown update type: ${JSON.stringify(update)}`);
      }
      break;
  }
};

// ----------------------------------------------------------------

const pollForUpdates = async () => {
  // console.log("Polling for updates...", new Date().toLocaleTimeString());

  let updates;
  try {
    updates = await getUpdates();
  } catch (error) {
    logger.error("Error fetching updates:", error);

    // Continue polling even if there's an error fetching updates
    return setTimeout(pollForUpdates, config.pollingInterval);
  }

  if (updates && updates.length > 0) {
    // Process updates asynchronously
    updates.forEach(async (update) => {
      try {
        await processUpdate(update);
      } catch (error) {
        logger.error("Error processing update:", error);
      }
    });
  }

  // Poll again after a delay (e.g., every 3 second)
  setTimeout(pollForUpdates, config.pollingInterval);
};

export default pollForUpdates;
