// src/services/telegramServices.js

import axios from "axios";
import applyRetryMechanism from "../utils/retryMechanism.js";
import pLimit from "p-limit";
import FormData from "form-data";
import fs from "fs";
import config from "../config/index.js";
import logger from "../utils/logger.js";

// Defining p-limit for controlling concurrency
const limit = pLimit(20); // 20 concurrent requests

// Define the base configuration for the Axios instances
const telegramApiBaseConfig = {
  baseURL: `${
    config.proxyOptions.telegramProxy
      ? `${config.proxyOptions.proxyBaseUrl}`
      : ""
  }${config.telegram.apiUrl}/bot${config.telegram.token}`,
  headers: {
    "Content-Type": "application/json",
  },
};

// Create a regular instance without rateLimiting/retrying
const instance = axios.create(telegramApiBaseConfig);

// Create a separate instance for rateLimiting/retrying
const rateLimitedInstance = axios.create(telegramApiBaseConfig);
// Apply p-limit to this instance to enable rate limiting
rateLimitedInstance.interceptors.request.use(async function (config) {
  await limit(() => Promise.resolve());
  return config;
});
// Apply retry mechanism to this instance to enable retrying on failed requests
applyRetryMechanism(rateLimitedInstance);

// sending message in a private chat (communicating to user with bot)
export async function sendMessage(
  message,
  responseMessage,
  additionalOptions = {}
) {
  const chatId = message.from.id;
  const userName = `${message.from.first_name || ""} ${
    message.from.last_name || ""
  }`.trim();
  const userHandle = `${
    message.from.username ? `@${message.from.username}` : ""
  }`;
  const messageId = message.message_id; // get the message ID to reply to

  try {
    const startTime = performance.now();

    const messagePayload = {
      chat_id: chatId,
      text: responseMessage,
      parse_mode: "HTML",
    };

    messagePayload.reply_markup = additionalOptions?.reply_markup || "";
    messagePayload.link_preview_options =
      additionalOptions?.link_preview_options || "";

    // Only set reply_to_message_id if it's a private chat and a valid message ID exists
    if (message.chat?.type === "private" && messageId) {
      messagePayload.reply_to_message_id = messageId;
    }

    const response = await rateLimitedInstance.post(
      `/sendMessage`,
      messagePayload
    );

    const endTime = performance.now();

    logger.info(
      `Message sent Successfully to ${userName} ${userHandle} (id ${chatId}) \n${responseMessage} (${(
        endTime - startTime
      ).toFixed(2)} ms)`
    );

    return response;
  } catch (error) {
    logger.error(
      `Error sending message to ${userName} ${userHandle} (id ${chatId})`,
      error
    );

    // return false so the "ok" in the response will be false
    return (response.data.ok = false);
  }
}

// editing message in a private chat (communicating to user with bot)
export async function editMessage(
  message,
  updatedText,
  additionalOptions = {}
) {
  const chatId = message.chat.id;
  const userName = `${message.from.first_name || ""} ${
    message.from.last_name || ""
  }`.trim();
  const userHandle = `${
    message.from.username ? `@${message.from.username}` : ""
  }`;
  const messageId = message.message_id;

  try {
    const startTime = performance.now();

    const messagePayload = {
      chat_id: chatId,
      message_id: messageId,
      text: updatedText,
      parse_mode: "HTML",
    };

    messagePayload.reply_markup = additionalOptions?.reply_markup || "";

    const response = await rateLimitedInstance.post(
      `/editMessageText`,
      messagePayload
    );

    const endTime = performance.now();

    logger.info(
      `Message ${messageId} edited successfully in chat ${userName} ${userHandle} (${(
        endTime - startTime
      ).toFixed(2)} ms)`
    );

    return response.data.ok;
  } catch (error) {
    logger.error(
      `Error editing message ${messageId} in chat ${userName} ${userHandle}:`,
      error
    );

    // return false so the "ok" in the response will be false
    return false;
  }
}

// Function to delete a message in a private chat or channel
export async function deleteMessage(chatId, messageId) {
  try {
    const startTime = performance.now();
    const response = await rateLimitedInstance.post("/deleteMessage", {
      chat_id: chatId,
      message_id: messageId,
    });
    const endTime = performance.now();

    if (response.data.ok) {
      logger.info(
        `Message ${messageId} deleted successfully in chat ${chatId} (${(
          endTime - startTime
        ).toFixed(2)} ms)`
      );
      return response.data.ok;
    } else {
      logger.error(
        `Error deleting message ${messageId} in chat ${chatId}:`,
        response.data.description
      );
      return false;
    }
  } catch (error) {
    logger.error(
      `Error deleting message ${messageId} in chat ${chatId}:`,
      error
    );
    return false;
  }
}

// Function to send a post to a channel
export async function sendPost(post, text) {
  const channelId = post.chat.id;
  const channelName = post.chat.title || "";
  const channelHandle = post.chat.username ? `@${post.chat.username}` : "";
  const messageId = post.message_id; // Get the message ID to reply to, if present

  try {
    const startTime = performance.now();

    // Create the payload for sending the message
    const messagePayload = {
      chat_id: channelId,
      text: text,
      parse_mode: "HTML",
    };

    // If the post has a message_id, set reply_to_message_id
    if (messageId) {
      messagePayload.reply_to_message_id = messageId;
    }

    const response = await rateLimitedInstance.post(
      "/sendMessage",
      messagePayload
    );

    const endTime = performance.now();

    logger.info(
      `Post sent successfully to channel ${channelName} ${channelHandle}: \n${text} (${(
        endTime - startTime
      ).toFixed(2)} ms)`
    );

    return response.data.ok;
  } catch (error) {
    logger.error(
      `Error sending post to channel ${channelName} ${channelHandle}`,
      error
    );

    // return false so the "ok" in the response will be false
    return false;
  }
}

// Function to edit a message in a channel
export async function editPost(post, updatedText) {
  const channelId = post.chat.id;
  const messageId = post.message_id;
  const channelName = post.chat.title || "";
  const channelHandle = `${post.chat.username ? `@${post.chat.username}` : ""}`;

  try {
    const startTime = performance.now();
    const response = await rateLimitedInstance.post(`/editMessageText`, {
      chat_id: channelId,
      message_id: messageId,
      text: updatedText,
      parse_mode: "HTML",
    });
    const endTime = performance.now();

    logger.info(
      `Post ${messageId} edited successfully in channel ${channelName} ${channelHandle} (${(
        endTime - startTime
      ).toFixed(2)} ms)`
    );

    return response.data.ok;
  } catch (error) {
    logger.error(
      `Error editing post ${messageId} in channel ${channelName} ${channelHandle}`,
      error
    );

    // return false so the "ok" in the response will be false
    return false;
  }
}

// Function to edit the caption of a media message in a channel
export async function editPostCaption(post, updatedCaption) {
  const channelId = post.chat.id;
  const messageId = post.message_id;
  const channelName = post.chat.title || "";
  const channelHandle = `${post.chat.username ? `@${post.chat.username}` : ""}`;

  try {
    const startTime = performance.now();
    const response = await rateLimitedInstance.post(`/editMessageCaption`, {
      chat_id: channelId,
      message_id: messageId,
      caption: updatedCaption,
      parse_mode: "HTML",
    });
    const endTime = performance.now();

    logger.info(
      `Caption ${messageId} edited successfully in channel ${channelName} ${channelHandle} (${(
        endTime - startTime
      ).toFixed(2)} ms)`
    );

    return response.data.ok;
  } catch (error) {
    logger.error(
      `Error editing caption ${messageId} in channel ${channelName} ${channelHandle}`,
      error
    );

    // return false so the "ok" in the response will be false
    return false;
  }
}

// Function to send an image in a private chat or channel (it is currently used for sending stats graph image in chat with bot)
export async function sendImage(
  message,
  imagePath, // Local image path
  caption,
  additionalOptions = {}
) {
  const chatId = message.chat.id;
  const userName = `${message.from.first_name || ""} ${
    message.from.last_name || ""
  }`.trim();
  const userHandle = `${
    message.from.username ? `@${message.from.username}` : ""
  }`;
  const messageId = message.message_id; // get the message ID to reply to

  try {
    const startTime = performance.now();

    // Create a FormData instance for multipart form data
    const formData = new FormData();

    // Append the image file
    formData.append("photo", fs.createReadStream(imagePath)); // Reading the local file

    // Add other fields to the form data
    formData.append("chat_id", chatId);
    formData.append("caption", caption || ""); // Optional caption
    formData.append("parse_mode", "HTML");
    formData.append("reply_to_message_id", messageId);

    // Add additional options such as reply_markup if provided
    if (additionalOptions.reply_markup) {
      formData.append(
        "reply_markup",
        JSON.stringify(additionalOptions.reply_markup)
      );
    }

    // Send the POST request using form-data
    const response = await rateLimitedInstance.post(`/sendPhoto`, formData, {
      headers: formData.getHeaders(), // Set correct headers for form data
    });

    const endTime = performance.now();

    logger.info(
      `Image sent successfully to ${userName} ${userHandle} (id ${chatId}) (${(
        endTime - startTime
      ).toFixed(2)} ms)`
    );

    return response.data.ok;
  } catch (error) {
    logger.error(
      `Error sending image to ${userName} ${userHandle} (id ${chatId}):`,
      error
    );

    return false;
  }
}

// Function to edit an already sent photo message in a private chat or channel
export async function editImage(
  message,
  newImagePath, // Path to the new image
  newCaption,
  additionalOptions = {}
) {
  const chatId = message.chat.id;
  const userName = `${message.from.first_name || ""} ${
    message.from.last_name || ""
  }`.trim();
  const userHandle = `${
    message.from.username ? `@${message.from.username}` : ""
  }`;
  const messageId = message.message_id; // get the message ID of the sent message

  try {
    const startTime = performance.now();

    // Create a FormData instance for multipart form data
    const formData = new FormData();

    // Append the new image as media
    formData.append(
      "media",
      JSON.stringify({
        type: "photo",
        media: "attach://photo", // Attach new photo
        caption: newCaption || "", // Optional new caption
        parse_mode: "HTML",
      })
    );

    // Append the new image file
    formData.append("photo", fs.createReadStream(newImagePath)); // Reading the new image file

    // Add other fields
    formData.append("chat_id", chatId);
    formData.append("message_id", messageId);

    // Add additional options such as reply_markup if provided
    if (additionalOptions.reply_markup) {
      formData.append(
        "reply_markup",
        JSON.stringify(additionalOptions.reply_markup)
      );
    }

    // Send the POST request to edit the image using form-data
    const response = await rateLimitedInstance.post(
      `/editMessageMedia`,
      formData,
      {
        headers: formData.getHeaders(), // Set correct headers for form data
      }
    );

    const endTime = performance.now();

    logger.info(
      `Image message ${messageId} edited successfully for ${userName} ${userHandle} (id ${chatId}) (${(
        endTime - startTime
      ).toFixed(2)} ms)`
    );

    return response.data.ok;
  } catch (error) {
    logger.error(
      `Error editing image message ${messageId} for ${userName} ${userHandle} (id ${chatId})`,
      error
    );

    return false;
  }
}

/////////////////////////////////////////////////////////////////////////////////

// Send chat action to check if the user or channel is still accessible (for broadcasting and metrics purposes)
export async function sendChatAction(entity, action = "typing") {
  const chatId = entity.user_id || entity.channel_id;
  const name = entity.user_name || entity.channel_name;
  const handle = entity.user_handle || entity.channel_handle;

  try {
    const response = await rateLimitedInstance.post(`/sendChatAction`, {
      chat_id: chatId,
      action: action,
    });
    return response.data.ok; // if successful, returns true
  } catch (error) {
    if (error.response && error.response.data.error_code === 403) {
      logger.info(
        `${
          entity.user_id ? "User" : "Channel"
        } ${name} ${handle} (id ${chatId}) has blocked or deleted the bot.`
      );
      return false; // entity has blocked the bot
    }
    logger.error(
      `Error sending chat action to ${
        entity.user_id ? "user" : "channel"
      } ${name} ${handle} (id ${chatId})`,
      error
    );
    return null; // some other error occurred
  }
}

/////////////////////////////////////////////////////////////////////////////////

// Function to answer a callback query
export async function answerCallbackQuery(
  callbackQueryId,
  text = "",
  showAlert = false
) {
  try {
    const response = await rateLimitedInstance.post("/answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      text: text, // Optional message to display
      show_alert: showAlert, // If true, a pop-up alert will be shown instead of a tooltip
    });

    if (response.data.ok) {
      logger.info(`Callback query ${callbackQueryId} answered successfully.`);
      return response.data.ok;
    } else {
      logger.error(
        `Error answering callback query:`,
        response.data.description
      );
      return false;
    }
  } catch (error) {
    logger.error(`Error answering callback query: `, error);
    return false;
  }
}

/////////////////////////////////////////////////////////////////////////////////

// getting the info of a user in a channel to verify if user has joined sponsor channel
export async function getChatMember(userId, chatId) {
  try {
    const response = await rateLimitedInstance.get("/getChatMember", {
      params: { user_id: userId, chat_id: chatId },
    });
    if (response.data.ok) {
      return response.data.result;
    } else {
      logger.error(`Error fetching chat member:`, response.data.description);
    }
  } catch (error) {
    logger.error(`Error fetching chat member: `, error);
  }
}

/////////////////////////////////////////////////////////////////////////////////
let offset = 0;

// getting latest update id, runs only once which is called when the bot server starts
// we use this so we don't get the entire update history at once,
// and only get the updates after the latest update id
export async function getLatestUpdateId() {
  try {
    const response = await instance.get("/getUpdates", {
      params: { limit: 1, timeout: 0 },
    });
    const updates = response.data.result;
    if (updates.length > 0) {
      offset = updates[0].update_id;
    }
  } catch (error) {
    logger.error("Error fetching latest update ID:", error);
  }
}

// getting latest updates from telegram API
export async function getUpdates() {
  // increase or decrease this timeout based on your network conditions
  const requestTimeout = 6000; // 6 seconds timeout

  try {
    const response = await instance.get("/getUpdates", {
      params: { offset },
      timeout: requestTimeout,
    });
    const updates = response.data.result;
    if (updates.length > 0) {
      offset = updates[updates.length - 1].update_id + 1;
    }
    return updates;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      logger.error(
        `Requesting for Telegram updates timed out. (timeout: ${requestTimeout}ms)`
      );
    } else {
      logger.error("Error fetching updates:", error);
    }
  }
}
