// src/utils/youtubeCaptionFetcher.js

// Here are 2 methods to retrieve captions from youtube (by default we use the 2nd solution)

// 1. youtubeCaptionFetcher() works by directly fetching the youtube page, parsing it and getting the caption data
// It is a working method with a catch, youtube identifies bot-like or suspected requests and restrict the access to its page,
// Whether with enforcing captchas or completely blocking the IP, hence the second solution comes in

// 2. youtubeCaptionScraper() works by adding "downsub.com/?url=" at the start of a youtube URL, it then scrapes the downsub.com website
// And retrieve the raw data of captions (which are also scraped by downsub.com), as of now, it works great but there are 2 catches,
// There is a chance of being blocked by IP (not happened yet), and also the site structure may change which essentially breaks parts of the code

// for youtubeCaptionFetcher()
import he from "he";
import striptags from "striptags";
import { fetchWithProxy } from "./urlFetcher.js";

// for youtubeCaptionScraper()
import puppeteer from "puppeteer";
import path from "path"; // to load ad blocker extension

// misc
import config from "../config/index.js";
import logger from "./logger.js";

// Function to check if the URL is a YouTube link
export function isYoutubeUrl(url) {
  const youTubeRegex =
    /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(?:-nocookie)?\.com|youtu\.be))(\/(?:[\w\-]+\?v=|embed\/|live\/|v\/)?)([\w\-]+)(\S+)?$/;

  return youTubeRegex.test(url);
}

// Function to get YouTube subtitles directly
export async function youtubeCaptionFetcher(url) {
  // Extract video ID from YouTube URL
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  const videoID = match ? match[1] : null;
  const videoUrl = `https://youtube.com/watch?v=${videoID}`;
  const lang = "en";

  // Fetch YouTube video page data
  let data;
  try {
    data = await fetchWithProxy(videoUrl);

    // Ensure that the fetched data is a string
    if (typeof data !== "string") {
      logger.error(
        `Expected string data but received ${typeof data} for video: ${videoID}`
      );
      return "";
    }
  } catch (error) {
    logger.error(`Failed to fetch YouTube page for video: ${videoID}`, error);
    return "";
  }

  // Check if the video page contains captions
  if (!data.includes("captionTracks")) {
    logger.error(`No captions found for video: ${videoID}`);
    return "";
  }

  // Extract caption tracks JSON string from video page data
  const regex = /"captionTracks":(\[.*?\])/;
  const regexResult = regex.exec(data);

  if (!regexResult) {
    logger.error(`Failed to extract captionTracks from video: ${videoID}`);
    return "";
  }

  const captionTracksJson = regexResult[1];
  let captionTracks;

  try {
    captionTracks = JSON.parse(captionTracksJson);
  } catch (error) {
    logger.error(
      `Failed to parse captionTracks JSON for video: ${videoID}`,
      error
    );
    return "";
  }

  // Find the appropriate subtitle language track
  const subtitle =
    captionTracks.find((track) => track.vssId === `.${lang}`) ||
    captionTracks.find((track) => track.vssId === `a.${lang}`) ||
    captionTracks.find((track) => track.vssId && track.vssId.match(`.${lang}`));

  // Check if the subtitle language track exists
  if (!subtitle?.baseUrl) {
    logger.error(`Could not find ${lang} captions for ${videoID}`);
    return "";
  }

  // Fetch subtitles XML from the subtitle track URL
  let transcript;
  try {
    transcript = await fetchWithProxy(subtitle.baseUrl);

    // Ensure that the transcript is a string
    if (typeof transcript !== "string") {
      logger.error(
        `Expected string transcript but received ${typeof transcript} for video: ${videoID}`
      );
      return "";
    }
  } catch (error) {
    logger.error(`Failed to fetch subtitles for video: ${videoID}`, error);
    return "";
  }

  // Define regex patterns for extracting start and duration times
  const startRegex = /start="([\d.]+)"/;
  const durRegex = /dur="([\d.]+)"/;

  // Process the subtitles XML to create an array of subtitle objects
  const lines = transcript
    .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', "")
    .replace("</transcript>", "")
    .split("</text>")
    .filter((line) => line && line.trim())
    .reduce((acc, line) => {
      // Extract start and duration times using regex patterns
      const startResult = startRegex.exec(line);
      const durResult = durRegex.exec(line);

      if (!startResult || !durResult) {
        logger.error(`Failed to extract start or duration from line: ${line}`);
        return acc;
      }

      const start = startResult[1];
      const dur = durResult[1];

      // Clean up subtitle text by removing HTML tags and decoding HTML entities
      const htmlText = line
        .replace(/<text.+>/, "")
        .replace(/&amp;/gi, "&")
        .replace(/<\/?[^>]+(>|$)/g, "");
      const decodedText = he.decode(htmlText);
      const text = striptags(decodedText);

      // Create a subtitle object with start, duration, and text properties
      acc.push({
        start,
        dur,
        text,
      });

      return acc;
    }, []);

  // extract text from YouTube subtitles into a single big string
  return lines.map((subtitle) => subtitle.text).join(" ");
}

// ----------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------- //

// function to get youtube subtitles by scraping a 3rd party website (downsub.com)
export async function youtubeCaptionScraper(url) {
  // Prepare the scraping URL by adding "downsub.com/?url=" at the beginning
  const scrapingUrl = `https://downsub.com/?url=${url}`;

  const startTime = performance.now();

  // Path to the unpacked uBlock Origin Lite extension (currently installed version: uBOLite_2024.9.12.1004)
  // Source: https://github.com/uBlockOrigin/uBOL-home/releases/tag/uBOLite_2024.9.12.1004
  // Update the currently insalled version later by doing these 2 steps:
  // 1. Download the chromium.zip file from the latest stable release in the github's releases page.
  // 2. Un-zip it and paste it in the path specified below:
  const uBlockOriginLiteExtensionPath = path.resolve(
    "./src/utils/puppeteer-extensions/uBlockOriginLite.chromium"
  ); // manifest.v3-compliant

  // ------------------- VERY IMPORTANT -------------------
  // If you are going to update the uBlock Origin Lite extension yourself,
  // It is absolutely necessary to edit the manifest.json file located in the extension's root folder.
  // Open manifest.json and find this line: "options_page": "dashboard.html"
  // Change this line to: "options_page": ""
  // By removing the "dashboard.html" and replacing it with an empty "", the extension will no longer open its dashboard while loading
  // This will ensure that no problems will be caused by the extension's dashboard, The necessary changes are already done in the manifest.json file
  // So it is only important if you want to update it, that's when you should edit manifest.json file as well.
  // ------------------------------------------------------

  // Launch the browser through headless mode in production
  let browser;
  try {
    browser = await puppeteer.launch({
      // if you don't want to run in headless mode (running the browser in background) while using extensions,
      // comment-out the "--headless=new" line in args[] below, by doing this you will be able to see the live execution and debug the process
      headless: false, // it will be over-ridden anyway when --headless=new is in args[]
      args: [
        "--headless=new",

        // manifest.v3-compliant code (less effective at blocking ads but future-proof)
        `--disable-extensions-except=${uBlockOriginLiteExtensionPath}`,
        `--load-extension=${uBlockOriginLiteExtensionPath}`,
      ],
    });
  } catch (error) {
    logger.error("Failed to launch Puppeteer browser", error);
    return "";
  }

  // Open a new page
  let page;
  try {
    const pages = await browser.pages(); // Get all open tabs
    page = pages[0]; // Use the first (default) tab

    // Rotate user-agent by selecting a random one from the list
    const randomUserAgent =
      userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUserAgent);

    // Block unnecessary resources and requests to specific domains
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = request.url();
      const resourceType = request.resourceType();

      // Block specific URLs and resource types
      if (
        url.includes("static.cloudflareinsights.com") ||
        resourceType === "image" ||
        resourceType === "media" ||
        resourceType === "font"
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(scrapingUrl, {
      waitUntil: "networkidle0",
      timeout: 90000, // Adjust the timeout as needed
    });
  } catch (error) {
    logger.error(`Failed to load page: ${scrapingUrl}`, error);
    if (browser) await browser.close();
    return "";
  }

  // Define button selectors for both [RAW] English and auto-generated English
  const rawEnglishSelector = 'button[data-title="[RAW] English"]';
  const autoGeneratedEnglishSelector =
    'button[data-title="[RAW] English (auto-generated)"]';

  // Attempt to click the [RAW] English button first, if not fallback to auto-generated English
  try {
    const rawButton = await page.$(rawEnglishSelector);
    const autoButton = await page.$(autoGeneratedEnglishSelector);

    if (rawButton) {
      await rawButton.click();
    } else if (autoButton) {
      await autoButton.click();
    } else {
      throw new Error("Neither RAW nor auto-generated English subtitles found");
    }
  } catch (error) {
    logger.error("Failed to find or click caption button:", error);
    await browser.close();
    return "";
  }

  // Wait for the new content (captions) to load
  let content;
  try {
    await page.waitForSelector("pre", { timeout: 60000 });
    content = await page.evaluate(
      () => document.querySelector("pre").innerText
    );
  } catch (error) {
    logger.error("Failed to extract subtitles content", error);
    await browser.close();
    return "";
  }

  // Close the browser
  await browser.close();

  // Return the extracted captions as plain text with improved whitespace handling
  content = content ? content.replace(/\s+/g, " ").trim() : "";

  // performance log
  const endTime = performance.now();
  if (config.environment === "development")
    logger.info(
      `YoutubeCaptionDownloader response (${(endTime - startTime).toFixed(
        2
      )} ms)`,
      content
    );

  return content;
}

// Example list of user agents (you can add more or update with the latest ones)
// These user-agents are collected on 2024/09, UPDATE THEM IF YOU ARE USING THEM LATER
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
  // Add more user agents if necessary
];
