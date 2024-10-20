// src/bot/responseGeneratorForPosts.js

import {
  deleteMessage,
  editPost,
  editPostCaption,
  sendMessage,
} from "../services/telegramServices.js";
import { tagGenerator, summaryGenerator } from "../utils/contentGenerators.js";
import {
  entitiesUrlsExtractor,
  formatTextWithEntities,
  sanitizeText,
} from "../utils/textManipulator.js";
import { fetchUrlContents } from "../utils/urlFetcher.js";
import {
  recordChannelActivity,
  deleteChannelActivity,
  checkChannelRateLimit,
  getUserDetailsByChannelId,
  getChannelDetailsByChannelId,
} from "../../db/database.js";
import config from "../config/index.js";
import logger from "../utils/logger.js";

export async function responseGeneratorForPosts(post) {
  const channelId = post.chat.id;
  const messageId = post.message_id;
  const text = post.text || post.caption; // Handle both text and caption types
  const entities = post.entities || post.caption_entities;

  const channelName = post.chat.title || "";

  // channel link works for both public (w/ username) and private (w/o username) channels,
  // public format have message preview in telegram, but can't be used for private channels
  // private format can be used for both channel types but doesn't have preview ability regardless of channel type
  // 1. public format: e.g. a channel with the username of "Hardware_Reddit" will be converted to "t.me/hardware_reddit/"
  // 2. private format: e.g. a channel with the Id of "-1001374364132" will be converted to "t.me/c/1374364132/"
  const channelLink = post.chat.username
    ? `t.me/${post.chat.username.toLocaleLowerCase()}/`
    : `t.me/c/${String(channelId).substring(4)}/`;

  // we get info of a user associated to a channel to inform them if the post processing in channel went ok or not
  const {
    user_id: userId,
    user_name: userName,
    user_handle: userHandle,
  } = await getUserDetailsByChannelId(channelId);

  post.from = post.from || {};
  Object.assign(post.from, {
    id: userId,
    first_name: userName,
    username: userHandle,
  });

  // Record channel activity temporarily; if the response is generated successfully, keep it; otherwise, delete it.
  await recordChannelActivity(channelId, messageId, 2); // 2 = channelRequest activity type

  const { hasTokensLeft, numUsedTokens, numAllTokens } =
    await checkChannelRateLimit(channelId);

  if (!hasTokensLeft) {
    await deleteChannelActivity(channelId, messageId);
    await sendMessage(
      post,
      `🚫 <b>Rate Limit Exceeded</b>\n
You have exceeded the rate limit for channel <b>${channelName}</b> [${channelLink}${messageId}].\n
Click on <b>/tokens</b> to get more info.`
    );
    return;
  }

  // checking if the original post length is under a certain character length,
  // if it is not, further actions will be aborted and user will be notified via bot
  const messageType = post.text ? "text" : "caption";
  const maxAllowedPostTextLength = config.botSettings.maxAllowedPostTextLength; // DEFAULT = 3900 chars
  const maxAllowedPostCaptionLength =
    config.botSettings.maxAllowedPostCaptionLength; // DEFAULT = 828 chars
  const maxAllowedMessageLength =
    messageType === "text"
      ? maxAllowedPostTextLength
      : maxAllowedPostCaptionLength;

  if (text.length >= maxAllowedMessageLength) {
    await deleteChannelActivity(channelId, messageId);
    await sendMessage(
      post,
      `🚫 <b>Post Character Limit Exceeded</b>\n
<b>Max Allowed Characters:</b> ${maxAllowedMessageLength} chars
<b>Current Characters:</b> ${text.length} chars\n
Post in channel ${channelName} [${channelLink}${messageId}] is too long. Please make the text shorter by ${
        text.length - maxAllowedMessageLength
      } characters.`
    );
    return;
  }

  // Inform the user that the message is being processed
  const processingMessage = await sendMessage(
    post,
    `⏳ <b>Processing your request...</b>\n\nPlease wait while we process your post in channel ${channelName} [${channelLink}${messageId}] and avoid sending the same content again until this request is completed.`
  );
  const processingMessageId = processingMessage.data.result.message_id;

  // Extract URLs from entities
  const entityUrls = await entitiesUrlsExtractor(text, entities);
  // Fetch content of the extracted URLs
  const urlContents = await fetchUrlContents(entityUrls);

  // Compare text.trim() with the entity URL, normalize if needed
  const isOnlyUrl =
    entityUrls.length === 1 && text.trim() === entityUrls[0].trim();

  // Check if all URL contents are empty or contain invalid data
  const allUrlContentsEmpty = urlContents.every(
    (content) => !content || !content.content || content.content.trim() === ""
  );

  // If it's only a URL and all URL contents are empty, inform the user
  if (isOnlyUrl && allUrlContentsEmpty) {
    await deleteChannelActivity(channelId, messageId);
    await deleteMessage(userId, processingMessageId);
    await sendMessage(
      post,
      `⚠️ <b>Tag Generation Failed</b>\n\nIt seems that the Post [${channelLink}${messageId}] in channel <b>${channelName}</b> consists of only a link, and we couldn't fetch content from the provided URL. Tag generation couldn't proceed. Please try again later or with a different link.`
    );
    return;
  }

  // generating tags array using the selected API (Default: Gemini)
  let tags = await tagGenerator(text, urlContents);

  let summary = "";
  let summaryGenerationStatus = true;
  const summaryGenerationFailureMessage = `⚠️ <b>Summary Generation Failed</b>\n\nSomething went wrong while Generating the Summary, please send your message again.\n\n`;
  const channelDetails = await getChannelDetailsByChannelId(channelId);
  // 1. First check if the summary_feature is enbaled for the channel by the user
  // 2. Check if there is any text content retrieved at all from the first URL
  // (Using youtube caption downloader or primary context extender or secondary context extender)
  // 3. Check if the data is summarizable (retrieved from youtube caption downloader or primary context extender and not secondary context extender)
  if (
    channelDetails?.summary_feature &&
    urlContents[0]?.content &&
    urlContents[0].content.length >= 100 && // Check if the content is at least 100 characters long
    urlContents[0]?.summarizable === true
  ) {
    summary = await summaryGenerator(
      urlContents[0].content,
      urlContents[0].src
    );

    // Format the summary if it's generated
    if (summary !== null) {
      // sanitizing the summary text
      summary = sanitizeText(summary);

      // creating the summary structure with a better formatting for presentation
      summary = `<blockquote expandable>📝 ${summary}\n\n✨ <b>AI-Generated Summary</b> <i>(Check important info)</i></blockquote>\n`;
    } else {
      summaryGenerationStatus = false;
    }
  }

  if (tags && tags?.length) {
    // Limit the number of tags to display and separate them
    tags = tags
      .slice(0, config.botSettings.numberOfTagsToDisplayInChannel)
      .join(" ");

    // Convert the current text and entities to an HTML formatted string
    const formattedText = await formatTextWithEntities(text, entities);

    // Prepare the updated text or caption
    let updatedText = `${formattedText}\n${
      summary ? summary : ""
    }${tags}\n<b>Powered By <a href="${config.textPlaceholders.botLink}">${
      config.textPlaceholders.botName
    }</a></b> 🤖`;

    let ok;
    if (
      (post.caption && updatedText.length <= 1024) ||
      (post.text && updatedText.length <= 4096)
    ) {
      if (post.caption) {
        ok = await editPostCaption(post, updatedText); // Edit caption if it's a media post
      } else {
        ok = await editPost(post, updatedText); // Edit text if it's a regular text post
      }

      if (ok) {
        await deleteMessage(userId, processingMessageId);
        await sendMessage(
          post,
          `✅ <b>Post Edited Successfully</b>\n\nPost [${channelLink}${messageId}] was edited successfully in channel <b>${channelName}</b>.\n\n${
            summaryGenerationStatus ? "" : summaryGenerationFailureMessage
          } <b>Tokens Used:</b> ${numUsedTokens}/${numAllTokens}\n<b>Remaining Tokens for Today:</b> ${
            numAllTokens - numUsedTokens
          }`
        );
      } else {
        await deleteChannelActivity(channelId, messageId);
        await deleteMessage(userId, processingMessageId);
        // in case of any failure during sending message, a message will be sent to the user
        await sendMessage(
          post,
          `⚠️ <b>Tag Generation Failed</b>\n\nSomething went wrong while editing the post [${channelLink}${messageId}] in channel <b>${channelName}</b>, please send your post again.`
        );
      }

      return;
    } else if (
      // telegram supports up to 1024 characters for media posts with captions and 4096 characters for regular text posts
      (post.caption && updatedText.length > 1024) ||
      (post.text && updatedText.length > 4096)
    ) {
      // removing the generated summary (if it was generated at all) from the updated text to avoid hitting the message character limit
      updatedText = `${formattedText}\n${tags}\n<b>Powered By <a href="${config.textPlaceholders.botLink}">${config.textPlaceholders.botName}</a></b> 🤖`;

      if (post.caption) {
        ok = await editPostCaption(post, updatedText); // Editing caption without summary
      } else {
        ok = await editPost(post, updatedText); // Editing text without summary
      }

      if (ok) {
        await deleteMessage(userId, processingMessageId);
        // instead of including the generated summary (if available) in the edited post like before, we send it to user's chat with bot
        await sendMessage(
          post,
          `✅ <b>Post Edited Successfully</b>\n\n${
            summary
              ? `📝 <b>The summary was too long to include in this post, but you can view it separately below.</b>\n\n`
              : ``
          }Post [${channelLink}${messageId}] was edited successfully in channel <b>${channelName}</b>.\n\n${
            summary ? `${summary}\n` : ``
          }<b>Tokens Used:</b> ${numUsedTokens}/${numAllTokens}\n<b>Remaining Tokens for Today:</b> ${
            numAllTokens - numUsedTokens
          }`
        );
      } else {
        await deleteChannelActivity(channelId, messageId);
        await deleteMessage(userId, processingMessageId);
        // in case of any failure during sending message, a message will be sent to the user
        await sendMessage(
          post,
          `⚠️ <b>Tag Generation Failed</b>\n\nSomething went wrong while editing the post [${channelLink}${messageId}] in channel <b>${channelName}</b>, please send your post again.`
        );
      }

      return;
    }
  }

  await deleteChannelActivity(channelId, messageId);
  await deleteMessage(userId, processingMessageId);
  // in case of any general failure, a message will be sent to the user
  await sendMessage(post, failureMessage(channelLink, messageId, channelName));

  return;
}

function failureMessage(channelLink, messageId, channelName) {
  return `
⚠️ <b>Tag Generation Failed</b>\n
We encountered an issue while trying to generate tags for post [${channelLink}${messageId}] in channel <b>${channelName}</b>. Please check the following possible reasons for the failure: (Click to expand)\n
<blockquote expandable>
1. 📝 <b>Incorrect Input</b>: The bot needs text to generate tags. You can send a plain text message, a photo, video, or document with a caption, or a URL with text content. If the text is retrievable, the bot should generate tags.\n
2. 📏 <b>Text Too Short</b>: If the text is very brief, the bot may not generate tags. Please provide more detailed text.\n
3. 🔍 <b>Lack of Detail</b>: Make sure your input is detailed enough to generate meaningful tags.\n
4. 🌐 <b>Unsupported Link</b>: The bot tries to extract context from URLs, but some sites like YouTube lack enough text, and others like Reddit may be difficult. Try using a different URL.\n
5. 🌍 <b>Unsupported Language</b>: The bot supports specific languages only. Use the <b>/languages</b> command to view the list of supported languages.\n
6. ⏳ <b>Global Token Limit</b>: The bot uses an API with a daily request limit. If the number of users is very high, we might hit this limit, preventing tag generation until it resets.\n
7. 🛠️ <b>Internal Error</b>: There could be a bug affecting this input. If you suspect this is the issue, please send the input to <b>@mostafa_abbac</b> for further investigation.\n
</blockquote>
Thank you for your understanding and patience. 🙏
`;
}
