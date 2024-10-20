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

// to use with googleGeminiSummaryGenerator()
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

// to use with openAiCompatibleSummaryGenerator()
import OpenAI from "openai";

// to use with ollamaSummaryGenerator()
import ollama from "ollama";

import config from "../config/index.js";
import logger from "./logger.js";
import { randomApiKeySelector } from "./randomApiKeySelector.js";

// Set the concurrency limit to 2
const limit = pLimit(2);

// This system prompt is same for all methods.
const baseSystemPrompt = `Your task is to provide a well-structured, concise, and informative summary in english language. 
Guidelines:
- Length: Summarize the content in about 2 to 3 paragraphs at most.
- Content: capture the main ideas and any critical statistics or data points.
- Tone: Maintain a neutral and professional tone.
- Audience: Tailor the level of detail and complexity to suit an expert audience familiar with the subject matter.
- Structure: Use a paragraph format without markdown symbols, ensuring the text is clear, cohesive, and logically organized.
Provide the summary only, without any introductory or concluding remarks.`;

// Function to get the final system prompt based on source type (source can be either a regular url or a youtube url)
function getSystemPrompt(src) {
  const specificInstruction =
    src === "youtube"
      ? "The text input is a transcript from the subtitles of a YouTube video."
      : "The text input is from a website, it may be a news article, product review/comparison, a blog post, or a more general content.";

  return `You are an advanced language model specializing in summarization. ${specificInstruction} ${baseSystemPrompt}`;
}

// Function to generate a summary using Google Gemini -- v1beta REST API which supports system prompts natively - we can use proxy in this solution
// There is a high chance of "v1beta API ENDPOINT" become deprecated and unusable in the future, in that case,
// This function will probably needs some minor changes to function as before.
// Documentation from google on how to use system instructions in Rest API Endpoint (in case of needing to adapt this function with future API versions):
// https://github.com/google-gemini/cookbook/blob/main/quickstarts/rest/System_instructions_REST.ipynb
export async function googleGeminiSummaryGenerator(prompt, src) {
  return limit(async () => {
    const systemPrompt = getSystemPrompt(src);

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
// export async function googleGeminiSummaryGenerator(prompt, src) {
//   return limit(async () => {
//     const systemPrompt = getSystemPrompt(src);

//     try {
//       // Randomly select one API key from the array of keys
//       const randomApiKey = randomApiKeySelector(config.gemini.tokens);

//       // Initialize the Google Generative AI client
//       const genAI = new GoogleGenerativeAI(randomApiKey);

//       // see the list of available models and their rate limits at https://ai.google.dev/gemini-api/docs/models/gemini
//       // Current Rate Limits for gemini-1.5-flash model: (as of 2024/09) --- SPOILER: IT'S PRETTY GOOD
//       // 15 RPM (Requests per minute), 1 million TPM (Tokens per minute) and 1500 RPD (Requests per day)
//       // Current Rate Limits for gemini-1.5-pro model: (as of 2024/09) --- SPOILER: IT'S VERY LOW
//       // 2 RPM (Requests per minute), 32,000 TPM (Tokens per minute) and 50 RPD (Requests per day)
//       const selectedModel = "gemini-1.5-flash";
//       const model = genAI.getGenerativeModel({
//         model: selectedModel,
//         systemInstruction: systemPrompt,
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

// Function to generate a response using OpenAI-Compatible API (We're using OpenRouter in here which has a compatible OpenAI API)
export async function openAiCompatibleSummaryGenerator(prompt, src) {
  return limit(async () => {
    const systemPrompt = getSystemPrompt(src);

    try {
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
      // Only select Models that are explicitly said they are free, otherwise you will be charged
      const result = await openai.chat.completions.create({
        // see the list of available models at https://openrouter.ai/models
        // Only select Models that are explicitly stated they are free, otherwise you will be charged

        // model: "meta-llama/llama-3.1-8b-instruct:free",
        model: "meta-llama/llama-3.1-405b-instruct:free",
        // model: "google/gemini-pro-1.5-exp",
        messages: [
          { role: "system", content: systemPrompt }, // Send the system prompt first
          { role: "user", content: prompt }, // User input as the content to summarize
        ],
      });

      const endTime = performance.now(); // End timer

      // extracting the response
      const fullResponse = result?.choices[0]?.message.content.trim();

      // Log performance metrics
      logMetrics({
        method: "online",
        model: result.model,
        prompt_eval_count: result.usage?.prompt_tokens,
        eval_count: result.usage?.completion_tokens,
        elapsedTime: ((endTime - startTime) / 1000).toFixed(2),
      });

      return fullResponse;
    } catch (error) {
      logger.error("Error communicating with OpenAI-Compatible API:", error);
      return null;
    }
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
export async function ollamaSummaryGenerator(prompt, src) {
  const systemPrompt = getSystemPrompt(src); // Selecting system prompt based on source

  try {
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
        seed: 42,
        temperature: 0.3,
        // num_predict: 400, // Cap the number of response tokens
        num_ctx: 4096, // Context length (prompt + response), higher uses more RAM
        num_keep: 1, // Model kept loaded for future requests (in minutes)
        num_thread: 7, // (Number of all threades / 2) is the optimum, e.g. for an 8 thread cpu, set this to 4
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
  } catch (error) {
    logger.error("Error communicating with Ollama:", error);
    return null;
  }
}

// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// Function to log the metrics in a table format - It is used for all 3 generators,
// Note that ollama has more metrics to show - these metrics are "N/A" in other 2 generators
export function logMetrics({
  method,
  model,
  load_duration = null,
  prompt_eval_count,
  prompt_eval_duration = null,
  eval_count,
  eval_duration = null,
  elapsedTime,
}) {
  // calculating some ollama generator specific metrics - these are not available for other generators and will be replaced with "-"
  const modelLoadDuration = load_duration
    ? `${(load_duration / 1e9).toFixed(2)}s`
    : "-";

  const promptEvaluationTime = prompt_eval_duration
    ? `${(prompt_eval_duration / 1e9).toFixed(2)}s`
    : "-";

  const promptEvaluationSpeed = prompt_eval_duration
    ? `${(prompt_eval_count / (prompt_eval_duration / 1e9)).toFixed(
        2
      )} tokens/s`
    : "-"; // in case of very high values, it is cached from before

  const responseGenerationTime = eval_duration
    ? `${(eval_duration / 1e9).toFixed(2)}s`
    : "-";

  const inferenceSpeed = eval_duration
    ? `${(eval_count / (eval_duration / 1e9)).toFixed(2)} tokens/s`
    : "-";

  // Estimated processing speed for openAI-Compatible and google generators, it is not accurate and it's here only for insight
  // It is an average of token/s for both prompt evaluation and token generation + added network latency
  const commulativeSpeed =
    method !== "offline"
      ? `${((prompt_eval_count + eval_count) / elapsedTime).toFixed(
          2
        )} tokens/s`
      : "-";

  // Table-like format for metrics
  const tableFormat = `
+--------------------------+-------------------------+
|          Metric          |           Value         |
+--------------------------+-------------------------+
Model Name                 | ${model}                
Model Load Duration        | ${modelLoadDuration}          
Total Tokens               | ${prompt_eval_count + eval_count}             
Prompt Tokens              | ${prompt_eval_count}             
Prompt Evaluation Time     | ${promptEvaluationTime}
Prompt Evaluation Speed    | ${promptEvaluationSpeed} 
Response Tokens            | ${eval_count}             
Response Generation Time   | ${responseGenerationTime}
Inference Speed            | ${inferenceSpeed}         
Commulative Speed (Online) | ${commulativeSpeed}         
Total Inference Duration   | ${elapsedTime}s          
`;

  logger.info(tableFormat);
}

// // deprecated method -- gemini api v1 doesn't support system instructions and doesn't generate high quality summaries because of this, but I think it doesn't hurt to be here
// // -----------------------------------------------
// // -----------------------------------------------
// // Function to generate a summary using Google Gemini -- v1 version that doesn't support system instruction and we will give it system instruction in chat
// export async function googleGeminiSummaryGenerator(prompt, src) {
//   return limit(async () => {
//     const systemPrompt = getSystemPrompt(src);

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
