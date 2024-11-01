// src/services/textRazorServices.js

import pLimit from "p-limit";
import axios from "axios";
import applyRetryMechanism from "./retryMechanism.js";
import randomApiKeySelector from "./randomApiKeySelector.js";
import logMetrics from "./LLMLogger.js";
import config from "../config/index.js";
import logger from "./logger.js";

// Define a limit of 2 concurrent operations for Google Gemini
const googleGeminiLimit = pLimit(2);

// Function to generate tags using Google Gemini -- v1beta REST API which supports system prompts natively - we can use proxy in this solution
// There is a high chance of "v1beta API ENDPOINT" become deprecated and unusable in the future, in that case,
// This function will probably need some minor changes to function as before
// Documentation from google on how to use system instructions in Rest API Endpoint (in case of needing to adapt this function with future API versions):
// https://github.com/google-gemini/cookbook/blob/main/quickstarts/rest/JSON_mode_REST.ipynbs
export async function googleGeminiTagGenerator(prompt) {
  return googleGeminiLimit(async () => {
    const systemPrompt = `
    You are a helpful assistant that generates hashtags based on the context of the provided text.
    Your output should always be in JSON format.
    Generate a list of the most relevant, trending and popular hashtags related to the topic, keywords, and overall meaning of the provided text.
    Ensure the hashtags follow this JSON schema: {"type": "object", "properties": {"hashtags": {"type": "array", "items": {"type": "string"}}}}.
    Generate 15 hashtags and Return only the hashtags as JSON.`;

    try {
      // See the list of available models and their rate limits at https://ai.google.dev/gemini-api/docs/models/gemini

      // Current Rate Limits for gemini-1.5-flash model: (as of 2024/09) --- TL;DR: IT'S PRETTY GOOD
      // 1500 RPD (Requests per day), 15 RPM (Requests per minute) and 1 million TPM (Tokens per minute)

      // Current Rate Limits for gemini-1.5-pro model: (as of 2024/09) --- TL;DR: IT'S VERY LOW
      // 50 RPD (Requests per day), 2 RPM (Requests per minute) and 32,000 TPM (Tokens per minute)
      const selectedModel = "gemini-1.5-flash";

      // Randomly select one API key from the array of keys
      const randomApiKey = await randomApiKeySelector(config.gemini);

      // building the base url of gemini API
      const baseUrl = `${config.gemini.apiUrl}/${selectedModel}:generateContent?key=${randomApiKey}`;

      // creating an axios instance of gemini base url (proxy url will be added at the start of the base url if the proxy option is enabled for gemini)
      const geminiInstance = axios.create({
        baseURL: `${
          config.proxyOptions.geminiProxy
            ? `${config.proxyOptions.proxyBaseUrl}`
            : ``
        }${baseUrl}`,

        headers: {
          "Content-Type": "application/json",
        },
      });

      applyRetryMechanism(geminiInstance);

      // Prepare the payload for the request
      const requestData = {
        system_instruction: {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },
        contents: [
          {
            parts: [
              {
                text: `${prompt}`,
              },
            ],
          },
        ],
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_CIVIC_INTEGRITY",
            threshold: "BLOCK_NONE",
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
        },
      };

      const startTime = performance.now(); // Start timer

      // Send a POST request using axios instance
      const response = await geminiInstance.post("", requestData);

      const endTime = performance.now(); // End timer

      console.log(response.data.candidates[0].content.parts[0].text);

      // Extracting the response text (assumed to be a valid JSON string)
      const fullResponse = response.data.candidates[0].content.parts[0].text;

      // Remove any extra whitespace and parse the JSON string
      const parsedResponse = JSON.parse(fullResponse.trim());

      // Extract the array of hashtags
      let hashtagsArray = parsedResponse.hashtags;

      // Clean and filter the generated hashtags
      const cleanedTags = cleanAndFilterTags(hashtagsArray);

      console.log(cleanedTags);

      // Log performance metrics
      logMetrics({
        method: "online",
        model: selectedModel,
        prompt_eval_count: response.data.usageMetadata.promptTokenCount,
        eval_count: response.data.usageMetadata.candidatesTokenCount,
        elapsedTime: ((endTime - startTime) / 1000).toFixed(2),
      });

      return cleanedTags;
    } catch (error) {
      logger.error(
        "Error communicating with Google Gemini:",
        error.response?.data || error.message
      );

      return null;
    }
  });
}

// Define a limit of 2 concurrent operations to respect the TextRazor API's rate limits.
// TextRazor's free API plan allows only 2 concurrent requests, so to avoid hitting this limit,
// the bot can send only a maximum of 2 API calls to TextRazor concurrently at any given moment.
const textRazorLimit = pLimit(2);

// Analyzing text to extract topics
export async function textRazorTagGenerator(text) {
  return textRazorLimit(async () => {
    try {
      // Randomly select one API key from the array of keys
      const randomApiKey = await randomApiKeySelector(config.textRazor);

      const textRazorInstance = axios.create({
        baseURL: `${
          config.proxyOptions.textRazorProxy
            ? `${config.proxyOptions.proxyBaseUrl}`
            : ``
        }${config.textRazor.apiUrl}`,
        headers: {
          "x-textrazor-key": randomApiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      applyRetryMechanism(textRazorInstance);

      const startTime = performance.now();
      const response = await textRazorInstance.post(
        "/",
        `text=${encodeURIComponent(text)}&extractors=topics`
      );
      const endTime = performance.now();

      if (config.environment === "development")
        logger.info(
          `TextRazor response (${(endTime - startTime).toFixed(2)} ms)`,
          response.data
        );

      const topics = response.data?.response?.topics;

      // if (config.environment === "development")
      //   console.log("Topics:", response.data?.response);

      if (!topics) {
        if (config.environment === "development")
          logger.error(
            `No topics found in TextRazor response for text: \n\n ${text} \n\n`,
            response.data
          );

        return [];
      }

      // Extract the topic labels
      const topicTags = topics.map((topic) => topic.label);

      // Clean and filter the generated topic tags
      const cleanedTags = cleanAndFilterTags(topicTags);

      return cleanedTags;
    } catch (error) {
      logger.error("Error analyzing text with TextRazor:", error);
      throw error;
    }
  });
}

// Function to clean and filter tags (used for both Google and TextRazor-generated tags)
function cleanAndFilterTags(tags) {
  // Helper function to clean individual tags
  function cleanTags(tag) {
    // If there's a parenthesis, only take the part before it
    let cleanedTag = tag.split("(")[0];

    // Remove any remaining special characters and replace spaces with underscores
    cleanedTag = cleanedTag.replace(/[^\w\s]/g, "").replace(/\s+/g, "");

    return cleanedTag;
  }

  // Clean the tags and filter out tags longer than 30 characters
  const cleanedTags = tags
    .map((tag) => `#${cleanTags(tag)}`) // Add # if not present and clean the tags
    .filter((tag) => tag.length <= 30); // Filter out any tags longer than 30 characters

  return cleanedTags;
}
