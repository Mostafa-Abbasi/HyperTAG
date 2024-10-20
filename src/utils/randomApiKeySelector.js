// src/utils/randomApiKeySelector.js
import { recordApiUsage } from "../../db/database.js";
import logger from "./logger.js";

// Utility function to select a random API key from an array of available keys.
//
// Why do we need this function?
//
// Many APIs impose rate limits on how frequently their services can be accessed using a single API key.
// Exceeding these limits can result in errors, temporary bans, or even permanent restrictions on the usage of an API.
//
// By using multiple API keys and randomly selecting one for each request, we can distribute the API requests across
// multiple keys. This approach helps to "load-balance" the usage and reduce the likelihood of hitting rate limits
// on any single key, thereby prolonging the effective usage of all API keys combined.
//
// This function is designed to be reusable, allowing for key rotation in any API-related function where rate limits are
// a concern, ensuring smoother operations, and maximizing the efficiency of available resources.

export async function randomApiKeySelector(apiConfig) {
  if (!Array.isArray(apiConfig.tokens) || apiConfig.tokens.length === 0) {
    logger.error("API keys array is empty or not provided.");
    return;
  }

  // Select a random API key from the array
  const randomIndex = Math.floor(Math.random() * apiConfig.tokens.length);

  // record the API usage in the database
  await recordApiUsage(apiConfig.apiName);

  // return the randomly selected API key
  return apiConfig.tokens[randomIndex];
}
