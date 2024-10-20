// src/bot/responseGeneratorForMessages.js

import { deleteMessage, sendMessage } from "../services/telegramServices.js";
import { tagGenerator, summaryGenerator } from "../utils/contentGenerators.js";
import {
  entitiesUrlsExtractor,
  sanitizeText,
} from "../utils/textManipulator.js";
import { fetchUrlContents } from "../utils/urlFetcher.js";
import {
  recordUserActivity,
  deleteUserActivity,
  checkUserRateLimit,
  getUserDetailsByUserId,
} from "../../db/database.js";
import config from "../config/index.js";

export async function responseGeneratorForMessages(message) {
  const chatId = message.from.id;
  const messageId = message.message_id;
  const text = message.text || message.caption;
  const entities = message.entities || message.caption_entities;

  // Record user activity temporarily
  await recordUserActivity(chatId, messageId, 1); // 1 = privateRequest activity type

  const { hasTokensLeft, numUsedTokens, numAllTokens } =
    await checkUserRateLimit(chatId);

  if (!hasTokensLeft) {
    await deleteUserActivity(chatId, messageId);
    await sendMessage(
      message,
      `⚠️ <b>Rate Limit Exceeded</b>\n
You have used all your tokens for now. Please click on <b>/tokens</b> to view your usage and reset time.`
    );
    return;
  }

  // Inform the user that the message is being processed
  const processingMessage = await sendMessage(
    message,
    `⏳ <b>Processing your request...</b>\n\nPlease wait while we process your message and avoid sending the same content again until this request is completed.`
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
    await deleteUserActivity(chatId, messageId);
    await deleteMessage(chatId, processingMessageId);
    await sendMessage(
      message,
      `⚠️ <b>Tag Generation Failed</b>\n\nIt seems that the message consists of only a link, and we couldn't fetch content from the provided URL. Tag generation couldn't proceed. Please try again later or with a different link.`
    );
    return;
  }

  // generating tags array using the selected API (Default: Gemini)
  let tags = await tagGenerator(text, urlContents);

  let summary = "";
  const userDetails = await getUserDetailsByUserId(chatId);
  // 1. First check if the summary_feature is enbaled for the chat by the user
  // 2. Check if there is any text content retrieved at all from the first URL
  // (using youtube caption downloader or primary context extender or secondary context extender)
  // 3. Check if the data is summarizable (retrieved from youtube caption downloader or primary context extender and not secondary context extender)
  if (
    userDetails?.summary_feature &&
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
      summary = `⚠️ <b>Summary Generation Failed</b>\n\nSomething went wrong while Generating the Summary, please send your message again.\n`;
    }
  }

  if (tags && tags?.length) {
    // Limit the number of tags to display and separate them
    tags = tags
      .slice(0, config.botSettings.numberOfTagsToDisplayInPrivate)
      .join(" ");

    await deleteMessage(chatId, processingMessageId);
    const response = await sendMessage(
      message,
      `${tags}\n\n${
        summary ? summary : ""
      }\n<b>Tokens Used</b>: ${numUsedTokens}/${numAllTokens} 📊\n<b>Powered By <a href="${
        config.textPlaceholders.botLink
      }">${config.textPlaceholders.botName}</a></b> 🤖`
    );

    if (!response.data.ok) {
      await deleteUserActivity(chatId, messageId);
      await deleteMessage(chatId, processingMessageId);
      // in case of any failure during sending message, a message will be sent to the user
      await sendMessage(
        message,
        `⚠️ <b>Tag Generation Failed</b>\n\nSomething went wrong while sending the reply, please send your message again.`
      );
    }
    return;
  }

  await deleteUserActivity(chatId, messageId);
  await deleteMessage(chatId, processingMessageId);
  // in case of any general failure, a message will be sent to the user
  await sendMessage(message, failureMessage);

  return;
}

const failureMessage = `
⚠️ <b>Tag Generation Failed</b>\n
We encountered an issue while trying to generate tags. Please check the following possible reasons for the failure: (Click to expand)\n
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
