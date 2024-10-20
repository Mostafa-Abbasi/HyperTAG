// src/utils/languageDetector.js

// efficient language detector, supports up to 60 languages
// link: github.com/nitotm/efficient-language-detector-js
import { eld } from "eld";
import config from "../config/index.js";
import logger from "./logger.js";
import {
  supportedLanguages,
  translationDependantLanguages,
} from "./languageList.js";

export async function detectLanguage(text) {
  const startTime = performance.now();
  const detectedLanguageObj = eld.detect(text);
  const endTime = performance.now();

  const detectedLanguage = detectedLanguageObj.language;

  if (config.environment === "development") {
    logger.info(`Combined Text:\n${text}`);
    logger.info(
      `Detected language for the combined text (${(endTime - startTime).toFixed(
        2
      )} ms): ${detectedLanguage}`
    );
  }

  return detectedLanguage;
}

export function checkLanguageStatus(detectedLanguage) {
  if (supportedLanguages.includes(detectedLanguage)) {
    return "supported";
  } else if (translationDependantLanguages.includes(detectedLanguage)) {
    if (config.environment === "development") {
      logger.info(
        `Text needs to be translated into English, Detected Language: ${detectedLanguage}`
      );
      logger.info(
        `Is translation currently enabled in config.env? "${config.botSettings.translation}"`
      );
    }

    return "translationDependant";
  } else {
    if (config.environment === "development") {
      logger.error(
        `Detected language is not supported: "${detectedLanguage}", WILL NOT return any tags`
      );
    }

    return "notSupported";
  }
}
