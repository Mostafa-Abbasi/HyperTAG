// src/services/textRazorServices.js

import pLimit from "p-limit";
import randomApiKeySelector from "./randomApiKeySelector.js";

// to use with googleGeminiTagGenerator()
import axios from "axios";
import applyRetryMechanism from "./retryMechanism.js";

// to use with openAiCompatibleTagGenerator()
import { retryWithDelay } from "./retryMechanism.js";
import OpenAI from "openai";

// to use with ollamaTagGenerator()
import ollama from "ollama";

import logMetrics from "./LLMLogger.js";
import config from "../config/index.js";
import logger from "./logger.js";

const baseSystemPrompt = `You are a hashtag generation assistant. Based on the provided text, generate a list of exactly 15 relevant, trending, and popular hashtags. 
Your output must strictly conform to JSON format.
Follow this schema:
{
  "hashtags": ["#Example1", "#Example2", "#Example3", "..."]
}
Rules:
1. Always respond in JSON format, strictly following the schema above.
2. Include exactly 15 hashtags in the "hashtags" array.
3. Do not include any additional text, explanations, or formatting, only provide the JSON object.`;

// Function to get the final system prompt
function getSystemPrompt() {
  return baseSystemPrompt;
}

// Define a limit of 2 concurrent operations for Google Gemini & OpenAi-Compatible APIs
const limit = pLimit(2);

// Function to generate tags using Google Gemini -- v1beta REST API which supports system prompts natively - we can use proxy in this solution
// There is a high chance of "v1beta API ENDPOINT" become deprecated and unusable in the future, in that case,
// This function will probably need some minor changes to function as before
// Documentation from google on how to use system instructions in Rest API Endpoint (in case of needing to adapt this function with future API versions):
// https://github.com/google-gemini/cookbook/blob/main/quickstarts/rest/JSON_mode_REST.ipynbs
export async function googleGeminiTagGenerator(prompt) {
  return limit(async () => {
    const systemPrompt = getSystemPrompt();

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

      // Retry logic for JSON parsing
      let parsedResponse, cleanedTags;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          // Send a POST request using axios instance
          const response = await geminiInstance.post("", requestData);

          const endTime = performance.now(); // End timer
          console.log(response.data.candidates[0].content.parts[0].text);

          // Extracting the response text (assumed to be a valid JSON string)
          const fullResponse =
            response.data.candidates[0].content.parts[0].text;

          // Remove any extra whitespace and parse the JSON string
          parsedResponse = JSON.parse(fullResponse.trim());

          // Check if the parsed response contains a valid hashtags array
          if (!Array.isArray(parsedResponse.hashtags)) {
            throw new Error(
              "Parsed response does not contain a valid hashtags array."
            );
          }

          // Extract the array of hashtags and clean/filter them
          const hashtagsArray = parsedResponse.hashtags;
          cleanedTags = cleanAndFilterTags(hashtagsArray);

          logMetrics({
            method: "online",
            model: selectedModel,
            prompt_eval_count: response.data.usageMetadata.promptTokenCount,
            eval_count: response.data.usageMetadata.candidatesTokenCount,
            elapsedTime: ((endTime - startTime) / 1000).toFixed(2),
          });

          break; // Exit loop if parsing was successful
        } catch (parseError) {
          logger.error(
            `Attempt ${attempt + 1}: Error parsing JSON response, retrying...`
          );
          if (attempt === 2) {
            throw new Error(
              "Failed to parse JSON response after multiple attempts."
            );
          }
        }
      }

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

export async function openAiCompatibleTagGenerator(prompt) {
  return limit(async () => {
    const systemPrompt = getSystemPrompt();

    try {
      // Use retryWithDelay for the API request and parsing logic
      return await retryWithDelay(async () => {
        // Randomly select one API key from the array of keys
        const randomApiKey = await randomApiKeySelector(config.openRouter);

        // Initialize OpenAI client using OpenRouter credentials
        const openai = new OpenAI({
          apiKey: randomApiKey, // stored in config.env
          baseURL: `${
            config.proxyOptions.openRouterProxy
              ? `${config.proxyOptions.proxyBaseUrl}`
              : ``
          }${config.openRouter.apiUrl}`,
        });

        const startTime = performance.now(); // Start timer

        // Retry logic for JSON parsing
        let parsedResponse, cleanedTags;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            // Create a completion request for the openRouter through OpenAI Library
            const result = await openai.chat.completions.create({
              // model: "meta-llama/llama-3.1-405b-instruct:free",
              // model: "meta-llama/llama-3.1-8b-instruct:free",
              model: "google/gemini-pro-1.5-exp",
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: systemPrompt }, // Send the system prompt first
                { role: "user", content: prompt }, // User input to analyze for hashtags
              ],
            });

            const endTime = performance.now(); // End timer

            const fullResponse = result?.choices[0]?.message.content.trim(); // Extract the response
            console.log(result?.choices[0]?.message.content.trim());

            // Parse JSON response and validate structure
            parsedResponse = JSON.parse(fullResponse);
            if (!Array.isArray(parsedResponse.hashtags)) {
              throw new Error(
                "Parsed response does not contain a valid hashtags array."
              );
            }

            // Extract and clean the hashtags
            const hashtagsArray = parsedResponse.hashtags;
            cleanedTags = cleanAndFilterTags(hashtagsArray);

            logMetrics({
              method: "online",
              model: result.model,
              prompt_eval_count: result.usage?.prompt_tokens,
              eval_count: result.usage?.completion_tokens,
              elapsedTime: ((endTime - startTime) / 1000).toFixed(2),
            });

            break; // Exit loop if parsing was successful
          } catch (parseError) {
            logger.error(
              `Attempt ${attempt + 1}: Error parsing JSON response, retrying...`
            );
            if (attempt === 2) {
              throw new Error(
                "Failed to parse JSON response after multiple attempts."
              );
            }
          }
        }

        return cleanedTags;
      });
    } catch (error) {
      logger.error(
        "Error communicating with OpenAI-Compatible API:",
        error.response?.data || error.message
      );

      return null;
    }
  });
}

// Function to generate tags using Ollama API with retry logic
export async function ollamaTagGenerator(prompt) {
  const systemPrompt = getSystemPrompt();

  try {
    return await retryWithDelay(async () => {
      const startTime = performance.now(); // Start timer

      // Create a request using the ollama.generate method with streaming
      const stream = await ollama.generate({
        // model: "qwen2.5:0.5b-instruct-q4_K_M", // not-accurate | fast
        model: "llama3.2:1b-instruct-q4_K_M", // semi-accurate | still fast
        // model: "llama3.2:3b-instruct-q4_K_M", // accurate | slow-ish
        // model: "llama3.1:8b-instruct-q4_K_M", // more accurate | slow
        format: "json",
        system: systemPrompt, // System message with guidelines
        prompt, // Text to analyze for hashtags
        stream: true, // Enable streaming
        options: {
          temperature: 0.3,
          num_ctx: 4096, // Context length (prompt + response)
          num_keep: 1, // Keep model loaded for future requests
          num_thread: 7, // Optimize for available CPU threads
        },
      });

      let fullResponse = "";
      let lastChunk = null;

      // Process stream and build response
      for await (const chunk of stream) {
        process.stdout.write(chunk.response); // Output each chunk
        fullResponse += chunk.response; // Append to full response
        lastChunk = chunk; // Keep the last chunk for metadata logging
      }

      const endTime = performance.now(); // End timer

      // Ensure the last chunk contains the necessary metadata
      if (lastChunk) {
        const {
          model,
          load_duration,
          prompt_eval_count,
          prompt_eval_duration,
          eval_count,
          eval_duration,
        } = lastChunk; // Extract metrics from the last chunk

        // Log the metrics
        logMetrics({
          method: "offline",
          model,
          load_duration,
          prompt_eval_count,
          prompt_eval_duration,
          eval_count,
          eval_duration,
          elapsedTime: ((endTime - startTime) / 1000).toFixed(2),
        });
      }

      let parsedResponse, cleanedTags;

      // Parse JSON response
      parsedResponse = JSON.parse(fullResponse);
      if (!Array.isArray(parsedResponse.hashtags)) {
        throw new Error(
          "Parsed response does not contain a valid hashtags array."
        );
      }

      // Extract and clean hashtags
      const hashtagsArray = parsedResponse.hashtags;
      cleanedTags = cleanAndFilterTags(hashtagsArray);

      return cleanedTags;
    });
  } catch (error) {
    logger.error("Error communicating with Ollama:", error);
    return null;
  }
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

  // Clean the tags and filter out (tags longer than 30 characters && numeric-only hashtags)
  const cleanedTags = tags
    .map((tag) => `#${cleanTags(tag)}`) // Add # if not present and clean the tags
    .filter((tag) => tag.length <= 30 && !/^#\d+$/.test(tag)); // Filter out numeric-only hashtags

  return cleanedTags;
}
