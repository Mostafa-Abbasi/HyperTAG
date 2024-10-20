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
          ? `🚀 <b>To Use The BOT</b>\n\n1️⃣ Join the sponsor channel: <b>${config.botSettings.sponsorChannelLink}</b>\n2️⃣ Click on /start`
          : `🚀 <b>To Use The BOT</b>\n\n1️⃣ Join the sponsor channel: <b>${config.botSettings.sponsorChannelLink}</b>\n2️⃣ Send your post again in the connected channel`;

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
  const { user_id: userId } = await getUserDetailsByChannelId(post.chat.id);

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
