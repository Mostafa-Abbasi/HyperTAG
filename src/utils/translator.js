// src/utils/translator.js

import { translate } from "@vitalets/google-translate-api";
import { detectLanguage, checkLanguageStatus } from "./languageDetector.js";
import config from "../config/index.js";
import logger from "../utils/logger.js";

export async function translator(text) {
  // Detect the language for all the combined texts
  const detectedLanguage = await detectLanguage(text);
  // retrieve language status, based on the detected language, can be "supported", "translationDependant", "notSupported"
  const languageStatus = checkLanguageStatus(detectedLanguage);
  if (languageStatus === "notSupported") {
    return null;
  }
  // If translation is enabled, translate the combined text to English
  if (languageStatus === "translationDependant") {
    if (config.botSettings.translation) {
      text = await translateTextToEnglish(text);
    } else {
      if (config.environment === "development") {
        logger.error(`Translation is disabled. nothing will be translated.`);
      }
      return null;
    }
  }

  // return either the original or translated text based on input language
  return text;
}

// function that will translate the text from supported languages to english using google translate API
async function translateTextToEnglish(text) {
  try {
    const startTime = performance.now();
    const translatedObj = await translate(text, { to: "en" });
    const endTime = performance.now();

    if (config.environment === "development") {
      logger.info(
        `TRANSLATED TEXT (${(endTime - startTime).toFixed(2)} ms): \n ${
          translatedObj.text
        }`
      );
    }

    return translatedObj.text;
  } catch (error) {
    logger.error(
      `An Error occurred while translating text, returning original text`,
      error
    );
    return text;
  }
}
