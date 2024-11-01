// src/utils/primaryContextExtender.js

import logger from "../utils/logger.js";
import config from "../config/index.js";
import { JSDOM } from "jsdom";
import { Readability, isProbablyReaderable } from "@mozilla/readability";

export async function processHtmlWithReadability(html, url) {
  const startTime = performance.now();
  // Preprocess HTML to remove <style> tags and mitigate errors that might be rise due to parsing css with jsdom
  const preprocessedHtml = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // Load the preprocessed HTML into jsdom
  const dom = new JSDOM(preprocessedHtml, { url: url });
  const document = dom.window.document;

  // Check if the document is probably readerable
  if (isProbablyReaderable(document)) {
    // Create a document clone to avoid modifying the original DOM
    const documentClone = document.cloneNode(true);

    // Set up Readability options
    const options = {
      debug: false,
      maxElemsToParse: 5000,
      nbTopCandidates: 5,
      charThreshold: 500,
      keepClasses: false,
      disableJSONLD: true,
    };

    // Initialize Readability with the cloned document and options
    const reader = new Readability(documentClone, options);
    const article = reader.parse();

    // Extract the main content
    let content = article ? article.textContent : "";

    // Normalize whitespaces
    content = content.replace(/\s+/g, " ").trim(); // Replace multiple spaces with a single space

    // Limiting to first 10000 characters for practicality (change value in config.env)
    content = content.substring(
      0,
      config.botSettings.numberOfCharactersToRetrieve
    );
    const endTime = performance.now();

    if (config.environment === "development")
      logger.info(
        `PRIMARY CONTEXT (${(endTime - startTime).toFixed(2)} ms):\n${content}`
      );

    return content;
  } else {
    logger.error(
      `The content at URL ${url} is not readerable. ${
        config.botSettings.secondaryContextExtension
          ? "trying with secondary context extender next"
          : "using secondary context extender is deactivated, enable it in config.env"
      }`
    );
    return "";
  }
}
