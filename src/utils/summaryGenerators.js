// src/utils/summaryGenerators.js

// Here are 3 methods to generate a summary for a given text input (Select ONLY 1 based on your preference in config.env)
// DEFAULT METHOD: 1 | googleGeminiSummaryGenerator()

// 1. googleGeminiSummaryGenerator() works by using google gemini's API Endpoint, it is an online method and needs an API key
// As of now (2024/09) google offers free API keys to access its models through aistudio.google.com
// We're using the "gemini-1.5-flash" model by default which is fast, accurate and has a high Rate-limit
// There are however some KEY FACTORS to consider when using this method:
// Price (in case of not using free plan) | Rate Limits | Model-Customization | Security | Provider-Availability

// 2. openAiCompatibleSummaryGenerator() works by out-sourcing the request to another provider through the OpenAI API library
// By using this method, you can generate responses using bigger and more advanced models, in a very short period of time
// You are Also not restricted to using only OpenAI models and services, because almost all providers have Open AI compatible API Endpoints
// Some providers have rate-limited free API endpoints that can be used pretty easily with the current implementation (we're using OpenRouter.ai free models)
// You should consider the factors that were discussed in the last method when using this solution as well

// 3. ollamaSummaryGenerator() works by processing the request through a local-hosted LLM with the help of Ollama
// It is a pretty good method and you can customize it to your specific needs without worrying about API rate-limits and etc.
// But because it is self-hosted, performance may not be optimal and is dependant on your hardware configuration, hence we prefere the 1st and 2nd solutions.

import pLimit from "p-limit"; // limiting the number of concurrent requests for openai and gemini
import randomApiKeySelector from "./randomApiKeySelector.js";

// to use with googleGeminiSummaryGenerator()
import axios from "axios";
import applyRetryMechanism from "./retryMechanism.js";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

// to use with openAiCompatibleSummaryGenerator()
import OpenAI from "openai";
import { retryWithDelay } from "./retryMechanism.js";

// to use with ollamaSummaryGenerator()
import ollama from "ollama";
import os from "os";

import logMetrics from "./LLMLogger.js";
import config from "../config/index.js";
import logger from "./logger.js";

// Set the concurrency limit to 2
const limit = pLimit(2);

// This system prompt is same for all methods.
const baseSystemPrompt = `
- Content: capture the main ideas and any critical statistics or data points.
- Tone: Maintain a neutral and professional tone.
- Audience: Tailor the level of detail and complexity to suit an expert audience familiar with the subject matter.
- Structure: Use a paragraph format without markdown symbols, ensuring the text is clear, cohesive, and logically organized.
Provide the summary only, without any introductory or concluding remarks.`;

// Function to get the final system prompt based on source type (source can be either a regular url or a youtube url) and message type (text or caption)
function getSystemPrompt(src, messageType) {
  const sourceOfContent =
    src === "youtube"
      ? "The text input is a transcript from the subtitles of a YouTube video."
      : "The text input is from a website, it may be a news article, product review/comparison, a blog post, or a more general content.";

  // Message Type can be text (regular channel posts - 4096 char limit) or caption (for channel posts that are photos, videos or documents - 1024 char limit)
  const summaryLengthRule =
    messageType === "caption"
      ? "- Length: Summarize the content in 1 very short paragraph at most."
      : "- Length: Summarize the content in about 2 to 3 paragraphs at most.";

  return `You are an advanced language model specializing in summarization. Your task is to provide a well-structured, concise, and informative summary in english language. ${sourceOfContent}
Guidelines:
${summaryLengthRule} ${baseSystemPrompt}`;
}

// Function to generate a summary using Google Gemini -- v1beta REST API which supports system prompts natively - we can use proxy in this solution
// There is a high chance of "v1beta API ENDPOINT" become deprecated and unusable in the future, in that case,
// This function will probably needs some minor changes to function as before.
// Documentation from google on how to use system instructions in Rest API Endpoint (in case of needing to adapt this function with future API versions):
// https://github.com/google-gemini/cookbook/blob/main/quickstarts/rest/System_instructions_REST.ipynb
export async function googleGeminiSummaryGenerator(prompt, src, messageType) {
  return limit(async () => {
    const systemPrompt = getSystemPrompt(src, messageType);

    try {
      // See the list of available models and their rate limits at https://ai.google.dev/gemini-api/docs/models/gemini

      // Current Rate Limits for gemini-1.5-flash model: (as of 2024/09) --- SPOILER: IT'S PRETTY GOOD
      // 1500 RPD (Requests per day), 15 RPM (Requests per minute) and 1 million TPM (Tokens per minute)

      // Current Rate Limits for gemini-1.5-pro model: (as of 2024/09) --- SPOILER: IT'S VERY LOW
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
          parts: {
            text: `${systemPrompt}`,
          },
        },
        contents: {
          parts: {
            text: `${prompt}`,
          },
        },
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
      };

      const startTime = performance.now(); // Start timer

      // Send a POST request using axios instance
      const response = await geminiInstance.post("", requestData);

      const endTime = performance.now(); // End timer

      console.log(response.data.candidates[0].content.parts[0].text.trim());

      // Extracting the response text
      const fullResponse =
        response.data.candidates[0].content.parts[0].text.trim();

      // Log performance metrics
      logMetrics({
        method: "online",
        model: selectedModel,
        prompt_eval_count: response.data.usageMetadata.promptTokenCount,
        eval_count: response.data.usageMetadata.candidatesTokenCount,
        elapsedTime: ((endTime - startTime) / 1000).toFixed(2),
      });

      return fullResponse;
    } catch (error) {
      logger.error(
        "Error communicating with Google Gemini:",
        error.response?.data || error.message
      );

      return null;
    }
  });
}

// YOU CAN USE THIS FUNCTION IF FOR SOME REASON LAST ONE (REST API v1beta EDNPOINT) HAS FAILED AND YOU DON'T NEED TO ENABLE PROXY FOR GOOGLE GEMINI

// // Function to generate a summary using Google Gemini -- using @google/generative-ai library - it is very good but we can't use proxy with this
// export async function googleGeminiSummaryGenerator(prompt, src, messageType) {
//   return limit(async () => {
//     const systemPrompt = getSystemPrompt(src, messageType);

//     try {
//       // Randomly select one API key from the array of keys
//       const randomApiKey = randomApiKeySelector(config.gemini.tokens);

//       // Initialize the Google Generative AI client
//       const genAI = new GoogleGenerativeAI(randomApiKey);

//       const safetySettings = [
//         {
//           category: HarmCategory.HARM_CATEGORY_HARASSMENT,
//           threshold: HarmBlockThreshold.BLOCK_NONE,
//         },
//         {
//           category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
//           threshold: HarmBlockThreshold.BLOCK_NONE,
//         },
//         {
//           category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
//           threshold: HarmBlockThreshold.BLOCK_NONE,
//         },
//         {
//           category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
//           threshold: HarmBlockThreshold.BLOCK_NONE,
//         },
//         {
//           category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
//           threshold: HarmBlockThreshold.BLOCK_NONE,
//         },
//       ];

//       // see the list of available models and their rate limits at https://ai.google.dev/gemini-api/docs/models/gemini
//       // Current Rate Limits for gemini-1.5-flash model: (as of 2024/09) --- SPOILER: IT'S PRETTY GOOD
//       // 15 RPM (Requests per minute), 1 million TPM (Tokens per minute) and 1500 RPD (Requests per day)
//       // Current Rate Limits for gemini-1.5-pro model: (as of 2024/09) --- SPOILER: IT'S VERY LOW
//       // 2 RPM (Requests per minute), 32,000 TPM (Tokens per minute) and 50 RPD (Requests per day)
//       const selectedModel = "gemini-1.5-flash";
//       const model = genAI.getGenerativeModel({
//         model: selectedModel,
//         systemInstruction: systemPrompt,
//         safetySettings: safetySettings,
//       });

//       const startTime = performance.now(); // Start timer
//       // Generate content based on the prompt
//       const result = await model.generateContent(prompt);
//       const endTime = performance.now(); // End timer

//       // extracting the response
//       const fullResponse = result.response.text().trim();

//       // Log performance metrics
//       logMetrics({
//         method: "online",
//         model: selectedModel,
//         prompt_eval_count: result.response.usageMetadata.promptTokenCount,
//         eval_count: result.response.usageMetadata.candidatesTokenCount,
//         elapsedTime: ((endTime - startTime) / 1000).toFixed(2),
//       });

//       return fullResponse;
//     } catch (error) {
//       logger.error("Error communicating with Google Gemini:", error);
//       return null;
//     }
//   });
// }

// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// Function to generate a response using OpenAI-Compatible API with retry (We're using OpenRouter in here which has a compatible OpenAI API)
export async function openAiCompatibleSummaryGenerator(
  prompt,
  src,
  messageType
) {
  return limit(async () => {
    const systemPrompt = getSystemPrompt(src, messageType);

    // Wrap the API call in retryWithDelay
    return retryWithDelay(async () => {
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

      // Create a completion request for the openRouter through OpenAI Library
      // Current Rate Limit for free models (as of 2024/09): 200 RPD (Requests per day)
      const result = await openai.chat.completions.create({
        // see the list of available models at https://openrouter.ai/models
        // Only select Models that are explicitly stated they are free, otherwise you will be charged

        // model: "meta-llama/llama-3.1-405b-instruct:free",
        // model: "meta-llama/llama-3.1-8b-instruct:free",
        model: "google/gemini-pro-1.5-exp",
        messages: [
          { role: "system", content: systemPrompt }, // Send the system prompt first
          { role: "user", content: prompt }, // User input as the content to summarize
        ],
      });

      const endTime = performance.now(); // End timer
      const fullResponse = result?.choices[0]?.message.content.trim(); // extracting the response

      // Log performance metrics
      logMetrics({
        method: "online",
        model: result.model,
        prompt_eval_count: result.usage?.prompt_tokens,
        eval_count: result.usage?.completion_tokens,
        elapsedTime: ((endTime - startTime) / 1000).toFixed(2),
      });

      return fullResponse;
    });
  });
}

// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// Internally it uses a locally hosted LLM to get the text content as a user prompt and summarize it according to the specified guidelines in the system prompt
// Install and Run Ollama (https://github.com/ollama/ollama) on the server with a model e.g. "Llama3.1 8b instruct", it should be always running in the background
// Make sure to install and use an LLM that fits your server specs, use a server that has a fast CPU (Or better than that, a GPU) and a large memory capacity
// Small Models (e.g. qwen2:0.5b-instruct) are able to generate responses in a couple of seconds and consume very little memory, but their response is not good
// Larger Models (e.g. llama3.1:8b-instruct) are slower and consume more memory in comparison, but their response is much more reliable in our usecase scenario
// You can see the list of popular models from Ollama Models Page (https://ollama.com/library) or alternatively use hugging face models (https://huggingface.co/models)

// Function to get a streamed completion from the LLM using Ollama API
export async function ollamaSummaryGenerator(prompt, src, messageType) {
  const systemPrompt = getSystemPrompt(src, messageType); // Selecting system prompt based on source

  try {
    // Get the number of logical CPU cores
    const totalCores = os.cpus().length;
    const optimalThreads = Math.floor(totalCores / 2); // Use half of the available cores

    return await retryWithDelay(async () => {
      const startTime = performance.now(); // start timer

      // Create a request using the ollama.generate method with streaming
      // see the list of available models at https://ollama.com/library
      const stream = await ollama.generate({
        // model: "qwen2.5:0.5b-instruct-q4_K_M", // not-accurate  | fast
        model: "llama3.2:1b-instruct-q4_K_M", //     semi-accurate | still fast
        // model: "llama3.2:3b-instruct-q4_K_M",  // accurate      | slow-ish
        // model: "llama3.1:8b-instruct-q4_K_M",  // more accurate | slow
        system: systemPrompt, // System message with guidelines
        prompt, // text to summarize
        stream: true, // Enable streaming
        options: {
          temperature: 0.3,
          num_ctx: 4096, // Context length (prompt + response), higher uses more RAM
          num_keep: 1, // Model kept loaded for future requests (in minutes)
          num_thread: optimalThreads, // Dynamically set number of threads
        },
      });

      let fullResponse = "";
      let lastChunk = null;

      // Stream processing with async loop
      for await (const chunk of stream) {
        process.stdout.write(chunk.response); // Output each chunk as it streams
        fullResponse += chunk.response; // Append to the full response
        lastChunk = chunk; // Keep the last chunk for metadata logging
      }
      const endTime = performance.now(); // end timer

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

      return fullResponse;
    });
  } catch (error) {
    logger.error("Error communicating with Ollama:", error);
    return null;
  }
}

// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// deprecated method -- gemini api v1 doesn't support system instructions and doesn't generate high quality summaries because of this, but I think it doesn't hurt to be here
// -----------------------------------------------
// -----------------------------------------------
// Function to generate a summary using Google Gemini -- v1 version that doesn't support system instruction and we will give it system instruction in chat
// export async function googleGeminiSummaryGenerator(prompt, src, messageType) {
//   return limit(async () => {
//     const systemPrompt = getSystemPrompt(src, messageType);

//     try {
//       const selectedModel = "gemini-1.5-flash";

//       // Randomly select one API key from the array of keys
//       const randomApiKey = await randomApiKeySelector(config.gemini);

//       // building the base url of gemini API - THIS IS THE REST API """ v1 """" EDNPOINT
//       const baseUrl = `https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent?key=${randomApiKey}`;

//       // creating an axios instance of gemini base url (proxy url will be added at the start of the base url if the proxy option is enabled for gemini)
//       const geminiInstance = axios.create({
//         baseURL: `${
//           config.proxyOptions.geminiProxy
//             ? `${config.proxyOptions.proxyBaseUrl}`
//             : ``
//         }${baseUrl}`,

//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       applyRetryMechanism(geminiInstance);

//       // Prepare the payload for the request
//       const requestData = {
//         contents: {
//           role: "user",
//           parts: [
//             {
//               text: `${systemPrompt}`,
//             },
//           ],
//           role: "user",
//           parts: [
//             {
//               text: `${prompt}`,
//             },
//           ],
//           safetySettings: [
//             {
//               category: "HARM_CATEGORY_HARASSMENT",
//               threshold: "BLOCK_NONE",
//             },
//             {
//               category: "HARM_CATEGORY_HATE_SPEECH",
//               threshold: "BLOCK_NONE",
//             },
//             {
//               category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
//               threshold: "BLOCK_NONE",
//             },
//             {
//               category: "HARM_CATEGORY_DANGEROUS_CONTENT",
//               threshold: "BLOCK_NONE",
//             },
//             {
//               category: "HARM_CATEGORY_CIVIC_INTEGRITY",
//               threshold: "BLOCK_NONE",
//             },
//           ],
//         },
//       };

//       const startTime = performance.now(); // Start timer

//       // Send a POST request using axios instance
//       const response = await geminiInstance.post("", requestData);

//       const endTime = performance.now(); // End timer

//       console.log(response.data.candidates[0].content.parts[0].text.trim());

//       // Extracting the response text
//       const fullResponse =
//         response.data.candidates[0].content.parts[0].text.trim();

//       // Log performance metrics
//       logMetrics({
//         method: "online",
//         model: selectedModel,
//         prompt_eval_count: response.data.usageMetadata.promptTokenCount,
//         eval_count: response.data.usageMetadata.candidatesTokenCount,
//         elapsedTime: ((endTime - startTime) / 1000).toFixed(2),
//       });

//       return fullResponse;
//     } catch (error) {
//       logger.error(
//         "Error communicating with Google Gemini:",
//         error.response?.data || error.message
//       );

//       return null;
//     }
//   });
// }
