// src/utils/textManipulator.js
import config from "../config/index.js";

// Function to format text with entities into an HTML string
export async function formatTextWithEntities(text, entities) {
  if (!entities || entities.length === 0) {
    return sanitizeText(text);
  }

  let formattedText = "";
  let currentPosition = 0;
  let openTags = [];
  let isExpandableBlockquoteOpen = false;

  // Helper function to sanitize and append text
  const appendText = (textToAppend) => {
    formattedText += sanitizeText(textToAppend);
  };

  // Helper function to open a tag
  const openTag = (tag, attributes = "") => {
    formattedText += `<${tag}${attributes}>`;
    openTags.unshift(tag);
  };

  // Helper function to close the last opened tag
  const closeTag = () => {
    const tag = openTags.shift();
    if (tag) {
      formattedText += `</${tag}>`;
      if (tag === "blockquote") {
        isExpandableBlockquoteOpen = false;
      }
    }
  };

  // Create an array of all start and end positions of entities
  const positions = entities.flatMap((entity, index) => [
    { position: entity.offset, type: "start", index },
    { position: entity.offset + entity.length, type: "end", index },
  ]);

  // Sort positions first by the position, then by type (end before start if same position)
  positions.sort(
    (a, b) => a.position - b.position || (a.type === "end" ? -1 : 1)
  );

  positions.forEach(({ position, type, index }) => {
    const entity = entities[index];

    // Append text before the current position
    if (currentPosition < position) {
      appendText(text.slice(currentPosition, position));
      currentPosition = position;
    }

    if (type === "start") {
      switch (entity.type) {
        case "bold":
          openTag("b");
          break;
        case "italic":
          openTag("i");
          break;
        case "underline":
          openTag("u");
          break;
        case "strikethrough":
          openTag("s");
          break;
        case "code":
          openTag("code");
          break;
        case "pre":
          openTag("pre");
          break;
        case "text_link":
          openTag("a", ` href="${entity.url}"`);
          break;
        case "spoiler":
          openTag("span", ` class="tg-spoiler"`);
          break;
        case "blockquote":
          if (isExpandableBlockquoteOpen) {
            formattedText += `</blockquote>`;
            isExpandableBlockquoteOpen = false;
          }
          openTag("blockquote");
          break;
        case "expandable_blockquote":
          if (isExpandableBlockquoteOpen) {
            formattedText += `</blockquote>`;
          }
          openTag("blockquote", " expandable");
          isExpandableBlockquoteOpen = true;
          break;
        // Add more cases as needed
      }
    } else if (type === "end") {
      closeTag();
    }
  });

  // Append any remaining text after the last entity
  if (currentPosition < text.length) {
    appendText(text.slice(currentPosition));
  }

  // Close any remaining open tags
  while (openTags.length) {
    closeTag();
  }

  // Close any unclosed expandable blockquotes at the end
  if (isExpandableBlockquoteOpen) {
    formattedText += `</blockquote>`;
  }

  return formattedText;
}

// Function to sanitize the text by escaping HTML-sensitive characters
export function sanitizeText(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function entitiesUrlsExtractor(text, entities = []) {
  // Code to extract URLs from entities
  const entityUrls = entities
    .filter((entity) => entity.type === "url" || entity.type === "text_link")
    .map((entity) => {
      if (entity.type === "url") {
        // Direct URL
        return text.substring(entity.offset, entity.offset + entity.length);
      } else if (entity.type === "text_link") {
        // Hyperlink
        return entity.url;
      }
    });

  // Limit the number of URLs for future analysis
  return entityUrls.slice(0, config.botSettings.numberOfUrlsToAnalyze); // default: 2, you can change value in config.env
}
