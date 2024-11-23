// src/utils/tagGenerator.js

import {
  googleGeminiTagGenerator,
  openAiCompatibleTagGenerator,
  ollamaTagGenerator,
  textRazorTagGenerator,
} from "./tagGenerators.js";
import {
  googleGeminiSummaryGenerator,
  openAiCompatibleSummaryGenerator,
  ollamaSummaryGenerator,
} from "./summaryGenerators.js";
import { translator } from "./translator.js";
import config from "../config/index.js";
import logger from "./logger.js";

// generating an array of tags using gemini and text razor APIs from the combination of meesage's text and the first 2* URLs of the message.
// *default is 2 but can be changed using NUMBER_OF_URLS_TO_ANALYZE_FROM_EACH_REQUEST variable in config.env
export async function tagGenerator(text, urlContents) {
  // Extract the content field from each URL's content object
  const combinedContents = urlContents
    .map((urlContentObj) => urlContentObj.content) // Extract content from each URL object
    .filter((content) => content !== ""); // Filter out empty content
  // Merge URL contents with the original text to have a bigger context
  let combinedText = [text, ...combinedContents].join("\n\n");

  // Check if the combinedText needs translation or not, and if it does, translate it to english
  combinedText = await translator(combinedText);
  // if something went wrong in translation (e.g. language not supported) return null immediately
  if (combinedText === null) return null;

  let tags = null;
  switch (config.tagGenerationSettings.tagGenerationMethod) {
    case 1:
      // generating tags from the whole message context using gemini API
      tags = await googleGeminiTagGenerator(combinedText);
      break;
    case 2:
      // generating tags from the whole message context using using an online provider (openRouter.ai) with OpenAI-Compatible API
      tags = await openAiCompatibleTagGenerator(combinedText);
      break;
    case 3:
      // Generating tags from the whole message context using a local-hosted LLM with ollama API
      tags = await ollamaTagGenerator(combinedText);
      break;
    case 4:
      // generating tags from the whole message context using textRazor API
      tags = await textRazorTagGenerator(combinedText);
      break;
    default:
      logger.error("Please choose a tag generation method in config.env");
      return tags;
  }

  // return the generated tags as an array
  return tags;
}

// generating a summary using LLM for the text retrieved from FIRST URL in the message
export async function summaryGenerator(inputText, src, messageType) {
  // Check if the text needs translation or not, and if it does, translate it to english
  let translatedText = await translator(inputText);
  // if something went wrong in translation (e.g. language not supported or translation was off), re-assign the input text to translatedText
  if (translatedText === null) translatedText = inputText;

  let summary = null;

  // summarization feature can be completely turned on/off in config.env
  if (config.summarizationSettings.summarization) {
    switch (config.summarizationSettings.summarizationMethod) {
      case 1:
        // Generating a summary using Google Gemini API
        summary = await googleGeminiSummaryGenerator(
          translatedText,
          src,
          messageType
        );
        break;
      case 2:
        // Generating a summary using an online provider (openRouter.ai) with OpenAI-Compatible API
        summary = await openAiCompatibleSummaryGenerator(
          translatedText,
          src,
          messageType
        );
        break;
      case 3:
        // Generating a summary using a local-hosted LLM with ollama API
        summary = await ollamaSummaryGenerator(
          translatedText,
          src,
          messageType
        );
        break;
      default:
        logger.error("Please choose a summarization method in config.env");
        return summary;
    }
  } else {
    logger.info(
      `Summarization is set to "false" in config.env. No summary will be generated.`
    );
  }

  return summary;
}
