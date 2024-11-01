// src/utils/retryMechanism.js
import axiosRetry from "axios-retry";
import logger from "./logger.js";

// Helper function to apply retry mechanism with logging to an Axios instance
export default function applyRetryMechanism(instance) {
  axiosRetry(instance, {
    retries: 3, // Number of retries
    retryDelay: axiosRetry.exponentialDelay, // Exponential backoff
    retryCondition: (error) => axiosRetry.isRetryableError(error), // Only retry on specific errors
    onRetry: (retryCount, error, requestConfig) => {
      logger.error(
        `Retry attempt #${retryCount} for ${requestConfig.method.toUpperCase()} request to URL ${
          requestConfig.url
        }`,
        {
          message: error.message,
          stack: error.stack,
          requestData: requestConfig.data, // Optional: logs request data if applicable
          headers: requestConfig.headers, // Optional: logs request headers
        }
      );
    },
  });
}

// Helper function to retry with a delay (for when we fetch using something other than axios)
export async function retryWithDelay(
  fn,
  maxRetries = 3,
  delay = 2000,
  attempt = 1
) {
  try {
    return await fn();
  } catch (error) {
    if (attempt >= maxRetries) {
      logger.error("Max retries reached. Error:", error);
      return null;
    }
    logger.error(`Attempt ${attempt} failed. Retrying in ${delay}ms...`, {
      message: error.message,
    });
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithDelay(fn, maxRetries, delay, attempt + 1);
  }
}
