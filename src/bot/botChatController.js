// src/bot/botChatController.js

import {
  sendChatAction,
  sendImage,
  sendMessage,
} from "../services/telegramServices.js";
import { responseGeneratorForMessages } from "./responseGeneratorForMessages.js";
import {
  getUserDetailsByUserId,
  getUserChannels,
  checkAndInsertUser,
  checkUserRateLimit,
  checkChannelRateLimit,
  getAllUsers,
  updateUserStatus,
  getAllChannels,
  updateChannelStatus,
} from "../../db/database.js";
import { verifySponsorChannelMembershipForBot } from "../utils/sponsorChannel.js";
import { languages } from "../utils/languageList.js";
import { broadcastMessage } from "../utils/messageBroadcaster.js";
import { calculateTimeToReset } from "../utils/timeUtils.js";
import {
  createPeriodStatsKeyboard,
  formatCurrentDate,
  processGraphStatsRequest,
  retrieveMetricsCountsInRange,
} from "../utils/statsUtils.js";
import fs from "fs";
import config from "../config/index.js";
import logger from "../utils/logger.js";

// List of valid commands
const validCommands = [
  "/start",
  "/help",
  "/tokens",
  "/channels",
  "/summary",
  "/signature",
  "/faq",
  "/commands",
  "/languages",
  "/reachability",
  "/broadcast",
  "/stats",
  "/connect",
  "/disconnect",
  "/claim",
];

// handling messages sent to the bot from users
export async function handleMessage(message) {
  const { text, caption, from } = message;
  const messageText = text || caption;

  if (!messageText) return;

  try {
    // Check if the user exists in the database, if not, insert it
    await checkAndInsertUser(message);

    const command = messageText.split(" ")[0]; // Extract command from the message

    if (command.startsWith("/") && !validCommands.includes(command)) {
      // Unknown command
      await sendMessage(
        message,
        `⚠️ <b>Unknown Command</b>\n\nThe command <b>${command}</b> is not recognized. Please use <b>/commands</b> to see the list of available commands.`
      );
      return;
    }

    switch (command) {
      case "/start":
        await handleStart(message);
        break;

      case "/help":
        await handleHelp(message);
        break;

      case "/tokens":
        await handleTokens(message);
        break;

      case "/channels":
        await handleChannels(message);
        break;

      case "/summary":
        await handleSummary(message, messageText);
        break;

      case "/signature":
        await handleSignature(message);
        break;

      case "/faq":
        await handleFaq(message);
        break;

      case "/commands":
        await handleCommands(message);
        break;

      case "/languages":
        await handleLanguages(message);
        break;

      case "/reachability":
        await handleReachability(message);
        break;

      case "/broadcast":
        await handleBroadcast(message, messageText);
        break;

      case "/stats":
        await handleStats(message);
        break;

      case "/connect":
      case "/disconnect":
      case "/claim":
        await handleChannelCommands(message, command);
        break;

      default:
        if (await verifySponsorChannelMembershipForBot(message)) {
          await responseGeneratorForMessages(message);
        }
        break;
    }
  } catch (error) {
    logger.error(
      `Error replying to user ${from.first_name || ""} ${
        from.username || ""
      } for message ${messageText}:`,
      error
    );
  }
}

// Handles the /start command
async function handleStart(message) {
  if (await verifySponsorChannelMembershipForBot(message)) {
    await sendMessage(
      message,
      `Welcome to <b>${config.textPlaceholders.botName}</b> 🤖\n\nUse <b>/help</b> to learn how to use the bot, and check out <b>/faq</b> to see frequently asked questions.`
    );
  }
}

// Handles the /help command
async function handleHelp(message) {
  const helpMessage = `
<b>Welcome to ${config.textPlaceholders.botName} 🤖</b>\n
This bot analyzes text in messages (including captions of photos and videos), to suggest relevant tags and much more!\n
Key Features:\n
📖 <b>Text Analysis</b>
${config.textPlaceholders.botName} analyzes the text content of your messages to recommend tags.\n
🔗 <b>Link Analysis</b>
If your message contains Links, the bot extracts their main content (up to the first ${config.botSettings.numberOfUrlsToAnalyze} URLs) and considers it into the tag recommendation.\n
🎥 <b>Youtube Analysis</b>
${config.textPlaceholders.botName} retrieves captions from YouTube videos Links' (up to the first ${config.botSettings.numberOfUrlsToAnalyze} URLs) and also consider it for tag recommendation.\n
📝 <b>Summarization*</b>
${config.textPlaceholders.botName} can summarize the <b>First Link</b> in a message (Regular Link or Youtube Link), providing a concise version of the content in the form of Expandable Summaries.\n
📢 <b>Channel Integration</b>
You can add the bot to your channels, allowing it to generate tags and summaries for your posts automatically.\n\n
Be sure to check the <b>/faq</b> and <b>/commands</b> sections for more details on how to use the bot.\n
<b>*</b>Summarization Feature is turned off by default <b>for connected channels</b> but can be enabled using <b>/summary</b> command.\n
If you have any questions or suggestions, feel free to reach out to the bot's creator at <b>${config.textPlaceholders.supportAccountHandle}</b>. 🙋‍♂️📞
`;

  // User inputs were analyzed by google gemini api (model: gemini-1.5-flash) for tag generation and summary generation
  const exampleMessage = `
<b>Below are some examples of how to interact with ${config.textPlaceholders.botName}:</b> ⁉️
In each example, the first block shows the user's message, and the second block displays the bot's response, click on bot's block to expand it and see the full response.
<blockquote><b>User Message</b></blockquote>
<blockquote expandable><b>${config.textPlaceholders.botName}'s Response</b></blockquote>

1. <b>Plain Text Message Analysis</b> 📖
<blockquote>Apple officially launched the iPhone 16 series during its "Glowtime" event on Monday.
The iPhone 16 and iPhone 16 Pro models are available to preorder now ahead of a September 20 release date. 
The iPhone 16 series has Apple's new AI suite, Apple Intelligence, as a headlining feature, alongside new-generation processors and some hardware upgrades, including new larger displays for the Pro models.</blockquote>
<blockquote expandable>#iPhone16 #AppleEvent #Glowtime #iPhone16Pro #AppleIntelligence #NewiPhone #TechNews #Apple #iPhoneRelease #TechUpdates\n
Tokens Used: 1/10 📊
Powered By ${config.textPlaceholders.botName} 🤖</blockquote>

2. <b>Regular Link Analysis</b> 🔗
<blockquote>techradar.com/news/iphone-16</blockquote>
<blockquote expandable>#iPhone16 #Apple #AppleEvent #TechRadar #iPhone16Review #NewiPhone #iPhone16Release #iPhone16Specs #iPhone16Price #AppleIntelligence\n
Tokens Used: 2/10 📊
Powered By ${config.textPlaceholders.botName} 🤖</blockquote>

3. <b>Youtube Link Analysis</b> 🎥
<blockquote>youtube.com/watch?v=9lx11dy9J30</blockquote>
<blockquote expandable>#AppleEvent #iPhone16 #iPhone16Pro #AppleWatchSeries10 #AppleWatchUltra2 #AirPods4 #AirPodsPro2 #AirPodsMax #iOS18 #AppleIntelligence\n
Tokens Used: 3/10 📊
Powered By ${config.textPlaceholders.botName} 🤖</blockquote>

4. <b>Compound Analysis with Summarization Enabled (Plain Text + Youtube Link + Regular Link)</b> 📖🎥🔗📝
<blockquote>Apple officially launched the iPhone 16 series during its "Glowtime" event on Monday.
Here's a Youtube Link of iPhone 16 series first impressions from MKBHD: youtube.com/watch?v=9lx11dy9J30
And here is a written article's Link from techradar: techradar.com/news/iphone-16</blockquote>
<blockquote expandable>#iPhone16 #iPhone16Pro #AppleEvent #Apple #TechReview #MKBHD #FirstImpressions #NewiPhone #AppleWatchSeries10 #AppleWatchUltra2\n
<b>"""</b>
📝 Apple's iPhone 16 and 16 Pro series showcase iterative updates, including new camera layouts, the A18 bionic chip, and larger batteries without disclosed capacities. Notably, the iPhone 16 features the Action button and a new pressure-sensitive "Camera Control" button enabling diverse camera functionalities and third-party app integration. The Pro models boast larger displays (6.3 inches and 6.9 inches), the A18 Pro chip, upgraded cameras (48MP main and ultrawide, 5x telephoto on the Pro), faster wireless charging, and 4K 120 FPS slow-motion video. 

However, the highly touted AI features, like Gen-moji and Image Playground, won't be available at launch and will be rolled out via future iOS 18 updates. This separation of hardware and software upgrades marks a significant shift in Apple's approach. The Apple Watch Series 10 offers a minor redesign with a thinner, lighter body, a larger display, and a new S10 chip. While the Apple Watch Ultra 2 mainly introduces a satin black finish, the Airpods 4 receive a redesigned shape and an optional noise-canceling version with a wireless charging case. Disappointingly, Airpods Max receives only new color options and a USB-C port, retaining the older H1 chip and its controversial case, despite its high price point.

Overall, the announcements reveal a trend of incremental hardware improvements coupled with a delayed introduction of significant software features, particularly in AI. The new "Camera Control" button's utility and adoption remain to be seen, while the underwhelming Airpods Max update might disappoint consumers hoping for more substantial changes. Notably, the lack of specific battery life improvement metrics from Apple raises questions regarding the actual extent of the battery enhancements in the new iPhone models.

✨ AI-Generated Summary (Check important info)
<b>"""</b>\n
Tokens Used: 4/10 📊
Powered By ${config.textPlaceholders.botName} 🤖</blockquote>
`;

  await sendMessage(message, helpMessage);
  await sendMessage(message, exampleMessage, {
    link_preview_options: {
      is_disabled: true,
    },
  });
}

// Handles the /tokens command
async function handleTokens(message) {
  if (await verifySponsorChannelMembershipForBot(message)) {
    const userId = message.chat.id;

    // Retrieve the user's token usage statistics
    const { numUsedTokens, numAllTokens } = await checkUserRateLimit(userId);
    const remainingTokens = numAllTokens - numUsedTokens;

    // Fetch channels connected to the user
    const userChannels = await getUserChannels(userId);

    // Variable to store channel-specific token info
    let channelTokensInfo = "";

    // Loop through each channel and get token usage
    for (const channel of userChannels) {
      const { channel_id, channel_name } = channel;
      const {
        numUsedTokens: channelUsedTokens,
        numAllTokens: channelAllTokens,
      } = await checkChannelRateLimit(channel_id);
      const remainingChannelTokens = channelAllTokens - channelUsedTokens;

      // Add the channel token info to the string with styling
      channelTokensInfo += `
📢 <b>Channel</b>: ${channel_name}
📊 <b>- Tokens Used</b>: ${channelUsedTokens}/${channelAllTokens}
💰 <b>- Remaining</b>: ${remainingChannelTokens}\n`;
    }

    // Calculate the time to reset the token limit
    const timeToResetFormatted = calculateTimeToReset();

    // Construct the message with user and channel token info
    const messageText = `
⏰ <b>Reset Schedule (Daily)</b>: 00:00 UTC
⏳ <b>Time Until Next Reset:</b> ${timeToResetFormatted}\n\n
🤖 <b>Chat With Bot</b>
📊 <b>- Tokens Used</b>: ${numUsedTokens}/${numAllTokens}
💰 <b>- Remaining</b>: ${remainingTokens}
${channelTokensInfo}`;

    // Send the message to the user using the existing sendMessage function
    await sendMessage(message, messageText);
  }
}

// Handles the /channels command
async function handleChannels(message) {
  if (await verifySponsorChannelMembershipForBot(message)) {
    const channels = await getUserChannels(message.chat.id);

    const channelFormatted = channels.length <= 1 ? "Channel" : "Channels";

    if (channels.length === 0) {
      await sendMessage(
        message,
        `🔗 <b>No Connected ${channelFormatted}</b>\n\nClick on /faq to learn how to connect your first channel.`
      );
    } else {
      const channelList = channels
        .map(
          (ch) => `
📢 <b>Channel Name</b>: ${ch.channel_name}
📌 <b>- Channel Link</b>: ${
            ch.channel_handle
              ? `@${ch.channel_handle}`
              : `t.me/c/${String(ch.channel_id).substring(4)}`
          }
🆔 <b>- Channel ID</b>: ${ch.channel_id}
📅 <b>- Added On</b>: ${new Date(ch.created_at).toLocaleDateString()}`
        )
        .join("\n");

      await sendMessage(
        message,
        `🔗 <b>Connected ${channelFormatted} List</b>\n\n${channelList}`
      );
    }
  }
}

// Handles the /summary command
async function handleSummary(message) {
  if (await verifySponsorChannelMembershipForBot(message)) {
    const userDetails = await getUserDetailsByUserId(message.chat.id);
    const userChannels = await getUserChannels(message.chat.id);

    // Variable to store user-specific summary info
    let userSummaryInfo = "";
    // Variable to store channel-specific summary info
    let channelsSummaryInfo = "";
    // Variable to store inline keyboard buttons for enabling/disabling summary
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

    await sendMessage(
      message,
      `🛠️ <b>Summary Feature Configuration</b>\n\n<b>Notes:</b>\n- Summary is <b>Off</b> by default for Connected channels.\n- Generating Summary Takes Additional Time.\n- Generated Summaries Are <b>Not</b> Always Correct.\n\n${userSummaryInfo}${channelsSummaryInfo}`,
      {
        reply_markup: { inline_keyboard: inlineKeyboard },
      }
    );
  }
}

// Handles the /signature command
async function handleSignature(message) {
  if (await verifySponsorChannelMembershipForBot(message)) {
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

    await sendMessage(
      message,
      `🛠️ <b>Bot Signature Configuration</b>\n\n${channelsSignatureInfo}`,
      {
        reply_markup: { inline_keyboard: inlineKeyboard },
      }
    );
  }
}

// Handles the /faq command
async function handleFaq(message) {
  const faqMessage = `
<b>🔍 Frequently Asked Questions (FAQs)</b> (Click on Answers to See the Whole Text)\n\n
<b>❓What does ${config.textPlaceholders.botName} do?</b>
<blockquote expandable>- This bot analyzes the text content of normal messages or messages that have caption such as photos and videos to generate relevant <b>English</b> tags.
It also extracts text from the first <b>${config.botSettings.numberOfUrlsToAnalyze}</b> URLs (even youtube links) in each message and incorporates it into the final tag recommendations.</blockquote>\n
<b>📝 What else can be done?</b>
<blockquote expandable>- ${config.textPlaceholders.botName} can also summarize the <b>first</b> link of your messages. Links may belong to youtube videos or anything else like a blog post.
In case of a non-youtube link, ${config.textPlaceholders.botName} tries to get the main content of it and generate a short summary, Othewise if it's a youtube link, captions (if available) will be downloaded and a summary will be generated based of them.
Don't forget that the main purpose of this bot is to generate tags, so the retrieved text from links will also be used in generating more precise tags, no matter if the summary feature is enabled or not.</blockquote>\n
<b>🌎 What languages are supported by ${config.textPlaceholders.botName}?</b>
<blockquote expandable>Use <b>/languages</b> to see the full list, 61 languages are supported in total. Note that the generated tags and summary will be always in english.
This is because we first identify and then translate any non-english retrieved text (whether from message, links, etc.) to english and then generate the tags and summary from the translated text.</blockquote>\n
<b>📢 Can I use it in my channel to generate automated tags (and summaries) for posts?</b>
<blockquote expandable>- Yes! You can add the bot to your channel to manage your posts and automatically append relevant tags at the end.</blockquote>\n
<b>🔗 How do I connect a channel?*</b> 
<blockquote expandable>- Add the bot as an admin in your channel, then use the <b>/connect</b> command in the channel.</blockquote>\n
<b>🔗🔗 Can I connect more than one channel?*</b>
<blockquote expandable>- Only one channel can be connected at a time by a non-vip user. To connect a new one, first use <b>/disconnect</b> to remove the currently connected channel.</blockquote>\n
<b>🔑 I lost access to my account but I’m still an admin of a connected channel with a different account. What can I do?*</b>
<blockquote expandable>- Use the <b>/claim</b> command in the channel to transfer ownership to your new account.</blockquote>\n
<b>🔄 My channel was connected before but HyperTag doesn't generate tags for posts anymore. What should I do?*</b>
<blockquote expandable>- Try reconnecting the bot to your channel. Use <b>/connect</b> in the channel to re-establish the connection.</blockquote>\n
<b>📊 What if I run out of tokens?</b>
<blockquote expandable>- Wait for the daily reset at 00:00 UTC, use <b>/tokens</b> to check used/remaining tokens and remaining time until reset.</blockquote>\n
<b>📈 Why do I need to subscribe to the sponsor channel?</b>
<blockquote expandable>- The bot is free to use, but maintaining it requires resources. Subscribing to the sponsor channel helps support its ongoing development and operation.</blockquote>\n
<b>🛠️ Is there a way to use the bot without restrictions?</b>
<blockquote expandable>- Yes! The bot is open-source, so you can fork the project on GitHub and host it yourself. This allows you to remove restrictions and customize the bot’s settings in the config.env file as needed.</blockquote>\n
<b>[IMPORTANT]</b>
<b>*</b>Remember to always enable <b>Sign messages</b> and <b>Show authors' profiles</b> in the channel's settings when using channel-related commands such as <b>/connect</b>, <b>/disconnect</b>, and <b>/claim</b>. These options can be turned-off afterward.\n
If you need more help, feel free to reach out to bot's creator (<b>${config.textPlaceholders.supportAccountHandle}</b>) or refer to the <b>/help</b> and <b>/commands</b> sections. 🙋‍♂️📞
`;
  await sendMessage(message, faqMessage);
}

// Handles the /commands command
async function handleCommands(message) {
  const commandsMessage = `
ℹ️ <b>Available Commands</b>\n
<b>General Commands:</b>
- <b>/start</b>: Start interacting with the bot 🚀
- <b>/help</b>: Instructions on how to use the bot ℹ️
- <b>/tokens</b>: View token usage and reset time 📊
- <b>/channels</b>: List connected channels 🔗
- <b>/summary</b>: Toggle summary feature on/off 📝
- <b>/faq</b>: Frequently Asked Questions ❓
- <b>/commands</b>: See available commands 🛠️
- <b>/languages</b>: View Supported Languages 🌎\n
<b>Channel Commands:*</b>
- <b>/connect</b>: Connect the bot to a channel 🚀
- <b>/disconnect</b>: Disconnect the bot from a channel 🔌
- <b>/claim</b>: Transfer channel ownership to your account 👑\n
<b>*</b>To use these commands in a channel, follow these steps first:
<b>1.</b> Add the bot as an admin in your channel.
<b>2.</b> Enable <b>Sign messages</b> and <b>Show authors' profiles</b> in the channel settings. (You only need these options enabled while using the above commands in a channel, so you can disable them after e.g. adding the bot to the channel by /connect command)\n
<b>VIP Command:</b>
- <b>/signature</b>: Toggle signature* on/off in channel posts 🛠️
<b>*</b>Current signature: <i>"${config.textPlaceholders.botSignature}"</i>\n
<b>Admin Commands:</b>
- <b>/reachability</b>: Checks which Users/Channels is still reachable by ${config.textPlaceholders.botName} 🔎 (didn't stopped/blocked/removed the bot)
- <b>/broadcast</b>: Send a message to all users 📡
Example: <i>/broadcast Hello users!</i>
- <b>/stats</b>: Graph representation of bot statistics 📉\n
<b>Additional Information:</b>
- <b>Sponsor Channel Membership</b>: Access to the bot's features requires membership in the sponsor channel. The bot will verify your membership before processing any requests.
- <b>Token Limits</b>: The bot uses a token system to manage usage. Use <b>/tokens</b> to monitor your usage and see when your tokens will reset.\n
If you need more help, feel free to reach out to bot's creator (<b>${config.textPlaceholders.supportAccountHandle}</b>) or refer to the <b>/help</b> and <b>/faq</b> sections. 🙋‍♂️📞
`;
  await sendMessage(message, commandsMessage);
}

// Handles the /languages command
async function handleLanguages(message) {
  // Create an array of language entries sorted alphabetically by name
  const languageList = Object.keys(languages)
    .map((langCode) => {
      const { name, flag } = languages[langCode];
      return { code: langCode, name, flag };
    })
    .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically by name
    .map(({ name, flag }) => `<b>${name}</b> ${flag}`)
    .join("\n");

  await sendMessage(
    message,
    `<b>🌎 Supported Languages by ${config.textPlaceholders.botName} 🤖</b>\n\n${languageList}`
  );
}

// Handles channel-related commands (/connect, /disconnect, /claim) used incorrectly
async function handleChannelCommands(message, command) {
  await sendMessage(
    message,
    `⚠️ <b>Invalid Command Usage</b>\n\nThe command <b>${command}</b> is intended to be used in a channel, not in a private chat. Please follow these steps to use it correctly:\n\n1. Add the bot as an admin in your channel.\n2. Enable "Sign messages" and "Show authors' profiles" in the channel settings. (You can disable these options after using the command.)\n\nExample Usage:\n\n<b>/connect</b> - To connect the bot to a channel (used in the channel)\n<b>/disconnect</b> - To disconnect the bot from a channel (used in the channel)\n<b>/claim</b> - To transfer channel ownership to your account (used in the channel)\n\nFor more information, please refer to the /faq section.`
  );
}

// Handles the /reachability command
async function handleReachability(message) {
  if (await verifySponsorChannelMembershipForBot(message)) {
    const userId = message.chat.id;

    // Only allow admin to use the Reachability command
    if (userId !== config.adminId) {
      await sendMessage(
        message,
        `⛔️ <b>Access Denied</b>\n\nYou are not authorized to use this command.`
      );
      return;
    }

    // Retrieve lists of all users and channels to check who has stopped/blocked the bot
    const users = await getAllUsers();
    const channels = await getAllChannels();

    // Check users' Reachability
    for (const user of users) {
      const isAccessible = await sendChatAction(user);
      await updateUserStatus(
        user.user_id,
        isAccessible ? "active" : "not-active"
      );
    }

    // Check channels' Reachability
    for (const channel of channels) {
      const isAccessible = await sendChatAction(channel);
      await updateChannelStatus(
        channel.channel_id,
        isAccessible ? "active" : "not-active"
      );
    }

    await sendMessage(message, `🔍 <b>Reachability Check Complete</b>`);
  }
}

// Handles the /broadcast command
async function handleBroadcast(message, messageText) {
  if (await verifySponsorChannelMembershipForBot(message)) {
    const userId = message.chat.id;

    // Only allow admin to use the broadcast command
    if (userId !== config.adminId) {
      await sendMessage(
        message,
        `⛔️ <b>Access Denied</b>\n\nYou are not authorized to use this command.`
      );
      return;
    }

    // Remove "/broadcast " from the message to see if anything remains
    const messageToBroadcast = messageText.split(" ").slice(1).join(" ");

    if (!messageToBroadcast) {
      await sendMessage(
        message,
        `⚠️ <b>Invalid Command Usage</b>\n\nPlease provide a message to broadcast after the command.\n\nExample:\n/broadcast Hello users!`
      );
    } else {
      await broadcastMessage(message);
      await sendMessage(
        message,
        `📣 <b>Broadcast Sent</b>\n\nYour message has been sent to all users.`
      );
    }
  }
}

// Handles the /stats command
export async function handleStats(message) {
  if (await verifySponsorChannelMembershipForBot(message)) {
    const userId = message.chat.id;

    // Only allow admin to use the stats command
    if (userId !== config.adminId) {
      await sendMessage(
        message,
        `⛔️ <b>Access Denied</b>\n\nYou are not authorized to use this command.`
      );
      return;
    }

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

    await sendImage(
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
  }
}
