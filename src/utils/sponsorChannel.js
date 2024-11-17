// src/utils/sponsorChannel.js

import { sendMessage } from "../services/telegramServices.js";
import { getChatMember } from "../services/telegramServices.js";
import { getUserDetailsByChannelId } from "../../db/database.js";
import config from "../config/index.js";
import logger from "./logger.js";

// Common function to verify user membership in the sponsor channel
async function verifyMembership(userId, chatId, messageType) {
  if (config.botSettings.sponsorChannel) {
    const sponsorChannelId = config.botSettings.sponsorChannelId;
    const userHasJoined = await checkUserJoinedChannel(
      userId,
      sponsorChannelId
    );

    if (!userHasJoined) {
      const messageText =
        messageType === "bot"
          ? `🚀 <b>To Use ${config.textPlaceholders.botName}</b>\n\n1️⃣ First Join The Sponsor Channel:\n<b><a href="${config.botSettings.sponsorChannelLink}">Click Here To Join The Sponsor Channel</a></b>\n\n2️⃣ Then, Click on <b>/start</b>`
          : `🚀 <b>To Use ${config.textPlaceholders.botName}</b>\n\n1️⃣ First Join The Sponsor Channel:\n<b><a href="${config.botSettings.sponsorChannelLink}">Click Here To Join The Sponsor Channel</a></b>\n\n2️⃣ Then, Send Your Post Again in The Connected Channel`;

      await sendMessage(chatId, messageText);
      return false;
    }
  }
  return true;
}

// Reusable function to ensure the user has joined the sponsor channel and can use the bot from chat
export async function verifySponsorChannelMembershipForBot(message) {
  const userId = message.from.id;
  return await verifyMembership(userId, message, "bot");
}

// Reusable function to ensure the user has joined the sponsor channel and can use the bot in channels
export async function verifySponsorChannelMembershipForPosting(post) {
  const userDetails = await getUserDetailsByChannelId(post.chat.id);
  if (!userDetails) {
    return; // Return early if user details are not found
  }

  const { user_id: userId } = userDetails;

  return await verifyMembership(userId, post, "posting");
}

// Function to check the user's membership status in the sponsor channel
async function checkUserJoinedChannel(userId, channelId) {
  try {
    const chatMember = await getChatMember(userId, channelId);
    return ["member", "administrator", "creator"].includes(chatMember.status);
  } catch (error) {
    logger.error("Error checking user membership status:", error.message);
    return false;
  }
}
