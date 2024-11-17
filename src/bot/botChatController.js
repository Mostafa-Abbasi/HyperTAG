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
    // Text message to welcome the user
    const welcomeMessage = `
Welcome to <b>${config.textPlaceholders.botName}</b> 🤖\n
Want to learn how to use the bot? Click an example button below, send the message, and see the bot in action.\n
This is just the beginning! Use <b>/help</b> to explore more features.`;

    // Inline keyboard with multiple buttons for different features
    const inlineKeyboard = [
      [
        {
          text: "Summary of a YouTube Video",
          switch_inline_query_current_chat:
            "Example of a YouTube Link:\n\nhttps://www.youtube.com/watch?v=kHFVZV-lj8g",
        },
      ],
      [
        {
          text: "Summary of a Link's Content",
          switch_inline_query_current_chat:
            "Example of a Link:\n\nhttps://www.theverge.com/2024/5/14/24155321/google-search-ai-results-page-gemini-overview",
        },
      ],
      [
        {
          text: "Hashtags Based On a Text",
          switch_inline_query_current_chat: `Example of a Text:\n\n"Smart home technology has become a major trend in recent years, making everyday tasks easier and more convenient. With devices like smart lights, thermostats, security cameras, and voice-activated assistants, people can control nearly every aspect of their home with just a few taps on their smartphone or a simple voice command. Imagine being able to dim the lights, lock the doors, or play your favorite music without even having to get up – that’s the reality of smart homes today.\n
One of the biggest benefits of smart home devices is energy efficiency. For example, smart thermostats learn your daily routines and automatically adjust temperatures to save energy, while smart lights can turn off when no one is in the room. Security has also improved with these technologies, allowing homeowners to monitor their property in real-time through smart cameras and receive alerts if any unusual activity is detected.\n
These technologies are also helping people stay connected, even when they're not at home. Parents can keep an eye on their children, pet owners can check on their pets, and even everyday tasks like watering the garden or adjusting the window blinds can be managed remotely. As more people embrace this technology, homes are becoming more connected, secure, and eco-friendly. The future of smart homes promises even more innovations, such as better integration between devices, enhanced privacy features, and more affordable options for everyone."`,
        },
      ],
    ];

    // Send the welcome message with the inline keyboard
    await sendMessage(message, welcomeMessage, {
      reply_markup: { inline_keyboard: inlineKeyboard },
    });
  }
}

// Handles the /help command
async function handleHelp(message) {
  const helpMessage = `
<b>Welcome to ${config.textPlaceholders.botName} 🤖</b>\n
This bot analyzes text and links in your messages (including captions for photos, videos, or documents) to generate relevant tags and quick summaries. Discover how it works by watching the demos. Key features include:\n
🎥 <b>YouTube Video Link Analysis (<a href="t.me/Falken_Devlog/11">Demo</a>)</b>
Analyzes YouTube links by extracting captions for tag recommendations and summarizing the video's content.\n
🔗 <b>Link Analysis (<a href="t.me/Falken_Devlog/10">Demo</a> & <a href="t.me/Falken_Devlog/12">Demo</a>)</b>
Extracts content from links in your messages (up to ${config.botSettings.numberOfUrlsToAnalyze} URLs) to suggest relevant tags and generate a brief summary from the <b>First</b> link's content.\n
📖 <b>Text Analysis (<a href="t.me/Falken_Devlog/9">Demo</a>)</b>
Generates tags based on your message's text.\n
📢 <b>Channel Integration (<a href="t.me/Falken_Devlog/14">Demo</a> & <a href="t.me/Falken_Devlog/13">Demo</a>)</b>
Add the bot to your channel to automatically generate tags and summaries for your posts, use <b>/faq</b> or <b>/commands</b> to learn how to connect your channels.\n
📌 HyperTAG is an open-source project, check out its <b><a href="${config.textPlaceholders.botGitHubLink}">GitHub repository</a></b> and consider giving it a star!\n
📌 Have questions or feedbacks? Head over to the <b><a href="${config.textPlaceholders.botSupportChannel}">Support Channel</a></b>.
`;

  await sendMessage(message, helpMessage);
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
<b>🔍 Frequently Asked Questions (FAQs)</b> (Click on Answers to See the Whole Text)\n
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
<b>🔄 My channel was connected before but ${config.textPlaceholders.botName} doesn't generate tags for posts anymore. What should I do?*</b>
<blockquote expandable>- Try reconnecting the bot to your channel. Use <b>/connect</b> in the channel to re-establish the connection.</blockquote>\n
<b>📊 What if I run out of tokens?</b>
<blockquote expandable>- Wait for the daily reset at 00:00 UTC, use <b>/tokens</b> to check used/remaining tokens and remaining time until reset.</blockquote>\n
<b>📈 Why do I need to subscribe to the sponsor channel?</b>
<blockquote expandable>- The bot is free to use, but maintaining it requires resources. Subscribing to the sponsor channel helps support its ongoing development and operation.</blockquote>\n
<b>🛠️ Is there a way to use the bot without restrictions?</b>
<blockquote expandable>- Yes! The bot is open-source (<b><a href="${config.textPlaceholders.botGitHubLink}">GitHub repository link</a></b>), so you can fork the project on GitHub and host it yourself. This allows you to remove restrictions and customize the bot’s settings in the config.env file as needed.</blockquote>\n
<b>[IMPORTANT]</b>
<b>*</b>Remember to always enable <b>Sign messages</b> and <b>Show authors' profiles</b> in the channel's settings when using channel-related commands such as <b>/connect</b>, <b>/disconnect</b>, and <b>/claim</b>. These options can be turned-off afterward.\n
📌 Have questions or feedbacks? Head over to the <b><a href="${config.textPlaceholders.botSupportChannel}">Support Channel</a></b> or check out the <b>/help</b> and <b>/commands</b> sections.
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
📌 Have questions or feedbacks? Head over to the <b><a href="${config.textPlaceholders.botSupportChannel}">Support Channel</a></b> or check out the <b>/help</b> and <b>/faq</b> sections.
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
