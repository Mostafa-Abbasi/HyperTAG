// src/config/index.js
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../config.env") });

const environment = process.env.NODE_ENV || "development"; // Define environment before config

const config = {
  //[🔴 REQUIRED] Interacting with bot through Telegram API
  telegram: {
    token: process.env.TELEGRAM_API_KEY,
    apiUrl: process.env.TELEGRAM_BASE_URL,
  },

  //[🔴 REQUIRED] Tag & Summary generation using Google Gemini API
  gemini: {
    apiName: "gemini",
    // Parse the GEMINI_API_KEYS into an array
    tokens: process.env.GEMINI_API_KEYS
      ? JSON.parse(process.env.GEMINI_API_KEYS)
      : [],
    apiUrl: process.env.GEMINI_BASE_URL,
  },

  //[🟢 OPTIONAL] Tag generation using Text Razor API - instead of Gemini API
  textRazor: {
    apiName: "textrazor",
    // Parse the TEXTRAZOR_API_KEYS into an array
    tokens: process.env.TEXTRAZOR_API_KEYS
      ? JSON.parse(process.env.TEXTRAZOR_API_KEYS)
      : [],
    apiUrl: process.env.TEXTRAZOR_BASE_URL,
  },

  //[🟢 OPTIONAL] Summary generation using OpenRouter API (OpenAi-Compatible) - instead of Gemini API or ollama local-hosted LLM
  openRouter: {
    apiName: "openrouter",
    // Parse the OPENROUTER_API_KEYS into an array
    tokens: process.env.OPENROUTER_API_KEYS
      ? JSON.parse(process.env.OPENROUTER_API_KEYS)
      : [],
    apiUrl: process.env.OPENROUTER_BASE_URL,
  },

  // NODE_ENV Variable
  environment,

  tagGenerationSettings: {
    // Google Gemini API, will be used in case of (tagGenerationMethod === 1)
    // Text Razor API, will be used in case of (tagGenerationMethod === 2)
    tagGenerationMethod: parseInt(process.env.TAG_GENERATION_METHOD),
  },

  summarizationSettings: {
    // (summarization === "true") means summarization feature is enabled
    summarization: process.env.ENABLE_SUMMARIZATION === "true",

    // Google Gemini API, will be used in case of (summarization === true && summarizationMethod === 1)
    // open Router API, will be used in case of (summarization === true && summarizationMethod === 2)
    // Ollama hosted LLM, will be used in case of (summarization === true && summarizationMethod === 3)
    summarizationMethod: parseInt(process.env.SUMMARIZATION_METHOD),
  },

  proxyOptions: {
    proxyBaseUrl: process.env.PROXY_BASE_URL || "",

    fetchWithProxy: process.env.ENABLE_URL_PROXY === "true",
    telegramProxy: process.env.ENABLE_TELEGRAM_PROXY === "true",
    geminiProxy: process.env.ENABLE_GEMINI_PROXY === "true",
    textRazorProxy: process.env.ENABLE_TEXTRAZOR_PROXY === "true",
    openRouterProxy: process.env.ENABLE_OPENROUTER_PROXY === "true",
  },

  adminId: parseInt(process.env.BOT_ADMIN_USER_ID),

  // transforming the VIP_USER_IDS variable in config.env into an array
  vipUserIds:
    process.env.VIP_USER_IDS != "your-vip-users-ids-here"
      ? JSON.parse(process.env.VIP_USER_IDS).map((id) => parseInt(id, 10))
      : [],

  pollingInterval:
    environment === "development"
      ? parseInt(process.env.POLLING_INTERVAL)
      : 3000, // Default polling interval in milliseconds

  textPlaceholders: {
    supportAccountHandle: process.env.SUPPORT_ACCOUNT_HANDLE,
    botName: process.env.BOT_NAME,
    botHandle: process.env.BOT_HANDLE,
    botLink: process.env.BOT_LINK,
    botSignature: process.env.BOT_SIGNATURE,
    botSupportChannel: process.env.BOT_SUPPORT_CHANNEL,
    botGitHubLink: process.env.BOT_GITHUB_LINK,
  },

  rateLimitingOptions: {
    maxConnectedChannels: parseInt(process.env.MAX_CONNECTED_CHANNELS),
    maxConnectedChannelsVip: parseInt(process.env.MAX_CONNECTED_CHANNELS_VIP),

    privateRateLimit:
      environment === "development"
        ? parseInt(process.env.RATE_LIMIT_PRIVATE_DEV)
        : parseInt(process.env.RATE_LIMIT_PRIVATE_PROD),
    privateVipRateLimit:
      environment === "development"
        ? parseInt(process.env.RATE_LIMIT_PRIVATE_VIP_DEV)
        : parseInt(process.env.RATE_LIMIT_PRIVATE_VIP_PROD),

    channelRateLimit:
      environment === "development"
        ? parseInt(process.env.RATE_LIMIT_CHANNEL_DEV)
        : parseInt(process.env.RATE_LIMIT_CHANNEL_PROD),
    channelVipRateLimit:
      environment === "development"
        ? parseInt(process.env.RATE_LIMIT_CHANNEL_VIP_DEV)
        : parseInt(process.env.RATE_LIMIT_CHANNEL_VIP_PROD),
  },

  botSettings: {
    // Translation settings
    translation: process.env.ENABLE_TRANSLATION === "true",

    // Tag number settings
    numberOfTagsToDisplayInPrivate: parseInt(
      process.env.NUMBER_OF_TAGS_TO_DISPLAY_IN_PRIVATE_CHAT
    ),
    numberOfTagsToDisplayInChannel: parseInt(
      process.env.NUMBER_OF_TAGS_TO_DISPLAY_IN_CHANNEL
    ),

    // Context extension settings
    numberOfUrlsToAnalyze: parseInt(
      process.env.NUMBER_OF_URLS_TO_ANALYZE_FROM_EACH_REQUEST
    ),
    numberOfCharactersToRetrieve: parseInt(
      process.env.NUMBER_OF_CHARACTERS_TO_RETRIEVE_FROM_EACH_URL
    ),
    maxUrlSize: parseInt(process.env.MAX_URL_SIZE),
    secondaryContextExtension:
      process.env.ENABLE_SECONDARY_CONTEXT_EXTENSION === "true",

    // Sponsor channel settings
    sponsorChannel: process.env.ENABLE_SPONSOR_CHANNEL === "true",
    sponsorChannelId: process.env.SPONSOR_CHANNEL_ID,
    sponsorChannelLink: process.env.SPONSOR_CHANNEL_LINK,

    // Max allowed post text length
    maxAllowedPostTextLength: parseInt(
      process.env.MAX_ALLOWED_POST_TEXT_LENGTH
    ),
    // Max allowed post caption length
    maxAllowedPostCaptionLength: parseInt(
      process.env.MAX_ALLOWED_POST_CAPTION_LENGTH
    ),
  },
};

export default config;
