// src/bot/postController.js

import { sendMessage, sendPost } from "../services/telegramServices.js";
import { responseGeneratorForPosts } from "./responseGeneratorForPosts.js";
import { verifySponsorChannelMembershipForPosting } from "../utils/sponsorChannel.js";
import {
  connectUserToChannel,
  disconnectUserFromChannel,
  isChannelConnectedToAnotherUser,
  isChannelConnectedToCurrentUser,
  isUserAllowedToConnectMoreChannels,
  checkAndInsertChannel,
} from "../../db/database.js";
import config from "../config/index.js";
import logger from "../utils/logger.js";

// handling messages sent to the bot from channels
export async function handlePost(post) {
  const { message_id: messageId, text, caption, chat } = post;
  const channelName = chat.title;
  const channelUserName = `@${chat.username}`;
  const postText = text || caption;

  if (!postText) return;

  try {
    // Check if the channel exists in the database, if not, insert it
    await checkAndInsertChannel(post);

    // Extract command from the post (if any)
    const command = postText.split(" ")[0];

    switch (command) {
      case "/connect":
        await handleConnect(post);
        break;

      case "/disconnect":
        await handleDisconnect(post);
        break;

      case "/claim":
        await handleClaim(post);
        break;

      default:
        // Process the post as usual if it's not a command and also if the user who connected the channel to the bot, is joined to the sponsor channel
        if (await verifySponsorChannelMembershipForPosting(post))
          await responseGeneratorForPosts(post);
        break;
    }
  } catch (error) {
    logger.error(
      `Error processing post in channel ${channelName} ${channelUserName} for message ${messageId}:`,
      error
    );
  }
}

// Handles the /connect command
async function handleConnect(post) {
  const { from, chat } = post;
  if (from?.id === undefined) {
    await sendPost(
      post,
      `⚙️ <b>Enable Required Settings</b>\n\nPlease enable "Sign messages" and "Show authors' profiles" in the channel's settings before using this command. You can disable them afterward.\n\nMessage sent from <b>${config.textPlaceholders.botHandle}</b>`
    );
    return;
  }

  const userId = from.id;
  const channelId = chat.id;
  const isConnectedByAnotherUser = await isChannelConnectedToAnotherUser(
    userId,
    channelId
  );

  if (isConnectedByAnotherUser) {
    await sendMessage(
      post,
      `🔗 <b>Channel Already Connected</b>\n\nChannel ${chat.title} is already connected to another account. Use /claim in the channel to transfer ownership to your account.`
    );
  } else {
    const isConnectedByCurrentUser = await isChannelConnectedToCurrentUser(
      userId,
      channelId
    );
    if (isConnectedByCurrentUser) {
      await sendMessage(
        post,
        `🔗 <b>Channel Connected</b>\n\nChannel ${chat.title} is already connected to your account.`
      );
    } else {
      const { isAllowed, maxAllowedChannelsToConnect } =
        await isUserAllowedToConnectMoreChannels(userId);

      if (isAllowed) {
        connectUserToChannel(userId, channelId);

        await sendMessage(
          post,
          `🔗 <b>Channel Connected</b>\n\nChannel ${chat.title} has been successfully connected to your account.\n\nYou can Enable summary feature for this channel using <b>/summary</b> command.`
        );
      } else {
        await sendMessage(
          post,
          `🚫 <b>Connection Limit Reached</b>\n\nYou have reached the maximum number of channels (${maxAllowedChannelsToConnect}) that can be connected to your account. Please disconnect a channel before connecting a new one.`
        );
      }
    }
  }
}

// Handles the /disconnect command
async function handleDisconnect(post) {
  const { from, chat } = post;
  if (from?.id === undefined) {
    await sendPost(
      post,
      `⚙️ <b>Enable Required Settings</b>\n\nPlease enable "Sign messages" and "Show authors' profiles" in the channel's settings before using this command. You can disable them afterward.\n\nMessage sent from <b>${config.textPlaceholders.botHandle}</b>`
    );
    return;
  }

  const userId = from.id;
  const channelId = chat.id;
  const isConnectedByAnotherUser = await isChannelConnectedToAnotherUser(
    userId,
    channelId
  );

  if (isConnectedByAnotherUser) {
    await sendMessage(
      post,
      `🚫 <b>Cannot Disconnect</b>\n\nChannel ${chat.title} is connected to another account. You cannot disconnect it. Use /claim in the channel to transfer ownership to your account.`
    );
  } else {
    const isNotConnectedByCurrentUser = !(await isChannelConnectedToCurrentUser(
      userId,
      channelId
    ));
    if (isNotConnectedByCurrentUser) {
      await sendMessage(
        post,
        `🔌 <b>Channel Disconnected</b>\n\nChannel ${chat.title} is already disconnected from your account.`
      );
    } else {
      await disconnectUserFromChannel(userId, channelId);
      await sendMessage(
        post,
        `🔌 <b>Channel Disconnected</b>\n\nChannel ${chat.title} has been successfully disconnected from your account.`
      );
    }
  }
}

// Handles the /claim command
async function handleClaim(post) {
  const { from, chat } = post;
  if (from?.id === undefined) {
    await sendPost(
      post,
      `⚙️ <b>Enable Required Settings</b>\n\nPlease enable "Sign messages" and "Show authors' profiles" in the channel's settings before using this command. You can disable them afterward.\n\nMessage sent from <b>${config.textPlaceholders.botHandle}</b>`
    );
    return;
  }

  const userId = from.id;
  const channelId = chat.id;

  // Check if the channel is connected to another user
  const isChannelConnected = await isChannelConnectedToAnotherUser(
    userId,
    channelId
  );

  if (isChannelConnected) {
    const { isAllowed, maxAllowedChannelsToConnect } =
      await isUserAllowedToConnectMoreChannels(userId);

    if (isAllowed) {
      // The channel is connected to another user
      await disconnectUserFromChannel(null, channelId); // Disconnect existing user
      await connectUserToChannel(userId, channelId); // Connect new user
      await sendMessage(
        post,
        `✅ <b>Channel Claimed</b>\n\nYou have successfully claimed ownership of the channel ${chat.title}, It is now connected to your account.\n\nYou can Enable summary feature for this channel using <b>/summary</b> command.`
      );
    } else {
      await sendMessage(
        post,
        `🚫 <b>Connection Limit Reached</b>\n\nYou have reached the maximum number of channels (${maxAllowedChannelsToConnect}) that can be connected to your account. Please disconnect a channel before connecting a new one.`
      );
    }
  } else {
    // Check if the channel is already connected to the current user
    const isConnectedByCurrentUser = await isChannelConnectedToCurrentUser(
      userId,
      channelId
    );

    if (isConnectedByCurrentUser) {
      // The channel is already connected to the current user
      await sendMessage(
        post,
        `🔗 <b>Channel Already Connected</b>\n\nChannel ${chat.title} is already connected to your account.`
      );
    } else {
      // The channel is not connected to any user
      await sendMessage(
        post,
        `❌ <b>Channel Not Connected</b>\n\nChannel ${chat.title} is not connected to any other account. Please use /connect to link it to your account.`
      );
    }
  }
}
