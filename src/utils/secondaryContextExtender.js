// src/utils/secondaryContextExtender.js

import * as cheerio from "cheerio";
import config from "../config/index.js";
import logger from "./logger.js";

export async function processHtmlWithCheerio(html) {
  const startTime = performance.now();
  const $ = cheerio.load(html);

  // Step 1: Remove unwanted elements globally (scripts, styles, etc.)
  $("script, source, style, head, img, svg, form, link, iframe").remove();

  // Step 2: Remove all classes and data-* attributes for a cleaner HTML structure
  $("*").removeClass();
  $("*").each((_, el) => {
    if (el.type === "tag") {
      for (const attr of Object.keys(el.attribs || {})) {
        if (attr.startsWith("data-")) {
          $(el).removeAttr(attr);
        }
      }
    }
  });

  // Step 3: Define main content selectors to prioritize certain areas of the page
  const mainContentSelectors = [
    "article",
    "main",
    "section",
    'div[itemprop="articleBody"]',
    ".content",
    "#content",
    "#main",
    ".post",
    ".article",
    ".entry-content",
    ".post-content",
    ".story-body",
    "#primary",
  ];

  // Step 4: Define unwanted elements for the fallback extraction (nav, footer, etc.)
  const unwantedElements = ["nav", "footer", "header", "aside"];

  // Step 5: Try to find the main content from the prioritized elements
  let mainContent = "";
  let maxTextLength = 0;

  $(mainContentSelectors.join(",")).each((i, el) => {
    const textContent = $(el).text().trim();
    if (textContent.length > maxTextLength) {
      mainContent = textContent;
      maxTextLength = textContent.length;
    }
  });

  // Step 6: Fallback to extracting from the body if no main content was found
  if (!mainContent) {
    $("body").find(unwantedElements.join(",")).remove(); // Remove irrelevant elements
    mainContent = $("body").text().trim();
  }

  // Step 7: Clean up the text (collapse multiple spaces into one)
  mainContent = mainContent.replace(/\s+/g, " ").trim();

  // Step 8: Limit the result to the first N characters (to avoid overly long results)
  mainContent = mainContent.substring(
    0,
    config.botSettings.numberOfCharactersToRetrieve
  );

  const endTime = performance.now();

  if (config.environment === "development") {
    logger.info(
      `SECONDARY CONTEXT (${(endTime - startTime).toFixed(
        2
      )} ms):\n${mainContent}`
    );
  }

  return mainContent;
}
