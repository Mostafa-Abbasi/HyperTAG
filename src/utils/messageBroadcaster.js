// src/utils/messageBroadcaster.js

import { sendMessage } from "../services/telegramServices.js";
import { formatTextWithEntities } from "./textManipulator.js";
import { getDatabaseInstance } from "../../db/database.js";
import logger from "./logger.js";

// Helper function to sleep for a given duration (in milliseconds)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to broadcast a message to all users
async function broadcastMessage(message) {
  const db = getDatabaseInstance();
  const RATE_LIMIT = 30; // Telegram's rate limit: 30 messages per second

  // Prepare the broadcast message
  const formattedText = await prepareBroadcastMessage(
    message.text,
    message.entities
  );

  try {
    // Fetch all users from the database
    const users = await db.allAsync(
      "SELECT user_id, user_name, user_handle FROM Users"
    );

    if (!users || users.length === 0) {
      logger.info("No users to broadcast to.");
      return;
    }

    for (let i = 0; i < users.length; i += RATE_LIMIT) {
      const batch = users.slice(i, i + RATE_LIMIT);

      // Send message to each user in the batch
      const sendPromises = batch.map((user) => {
        const mockMessage = {
          from: {
            id: user.user_id,
            first_name: user.user_name,
            username: user.user_handle,
          },
        };
        return sendMessage(mockMessage, formattedText).catch((err) =>
          logger.error(
            `Failed to send message to ${user.user_name} @${user.user_handle} ID:${user.user_id}:`,
            err
          )
        );
      });

      // Wait for all the messages in the current batch to be sent
      await Promise.all(sendPromises);

      // Sleep to avoid hitting the rate limit
      if (i + RATE_LIMIT < users.length) {
        await sleep(1000); // Sleep for 1 second before sending the next batch
      }
    }

    logger.info("Broadcast completed successfully.");
  } catch (err) {
    logger.error("Error during broadcast:", err);
  }
}

// Function to prepare the broadcast message by adjusting entities and formatting the text
async function prepareBroadcastMessage(text, entities) {
  // Extract command length including the space after it
  const commandLength = text.indexOf(" ") + 1;

  // Extract the message to broadcast
  const messageToBroadcast = text.slice(commandLength);

  // Adjust the entities
  const shiftedMessageEntities = (entities || [])
    .map((entity) => {
      // Ensure that the entity offset is valid after shifting
      if (entity.offset >= commandLength) {
        return {
          ...entity,
          offset: entity.offset - commandLength,
        };
      }
      // If the entity's offset is before the command length, skip it as it's part of the command
      return null;
    })
    .filter(Boolean); // Remove any null entities

  // Convert the current text and entities to an HTML formatted string
  const formattedText = await formatTextWithEntities(
    messageToBroadcast,
    shiftedMessageEntities
  );

  return formattedText;
}

export { broadcastMessage };
