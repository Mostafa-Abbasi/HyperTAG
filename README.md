[![Release](https://img.shields.io/github/v/release/Mostafa-Abbasi/HyperTAG?style=flat-square&label=Release)](https://github.com/Mostafa-Abbasi/HyperTAG/releases)
[![Bot Link](https://img.shields.io/badge/Bot-Telegram-blue.svg?logo=telegram)](https://t.me/HyperTAG_bot)
[![Bot Link](https://img.shields.io/badge/Channel-Telegram-blue.svg?logo=telegram)](https://t.me/Falken_Devlog)
[![License](https://img.shields.io/github/license/Mostafa-Abbasi/HyperTAG?style=flat-square&label=License)](https://github.com/Mostafa-Abbasi/HyperTAG/blob/main/LICENSE)

<p align="center"><img src="/assets/HyperTag_Logo.svg" width="250" height="250"></p>

# <p align="center"><b>#️⃣HyperTAG Telegram Bot</b></p> <p align="center"><b>AI-Generated Tags and Summaries for Telegram Messages</b></p>

<p align="center"><a href="https://telegram.me/HyperTag_bot"><b>Click Here To Access HyperTAG Bot on Telegram</b></a></p>

**HyperTAG** is a Telegram bot that leverages **advanced AI models** to generate context-aware tags and summaries for your messages. It can also automatically create tags and summaries for channel posts.

The bot **analyzes the text content of your messages along with any included links**, producing **relevant tags and summaries** based on both the message text and the text from the links. Additionally, it generates summaries for **Web pages** or **YouTube videos** using their links.

**Usage Example**: (more examples below)

<p align="center"><img src="/assets/img0.jpg" alt="Generating Tag and Summary from a YouTube Url"  width="60%" height="60%"></p>

<details>
<summary><b>Expand to See More Usage Examples:</b> ➡️</summary>

- Generating Tag from a Text
<p align="center"><img src="/assets/img1.jpg" alt="Generating Tag from a Text" width="60%" height="60%"></p>

- Generating Tag and Summary from a Regular Url
<p align="center"><img src="/assets/img2.jpg" alt="Generating Tag and Summary from a Regular Url" width="60%" height="60%"></p>

- Generating Tag and Summary from a YouTube Url
<p align="center"><img src="/assets/img3.jpg" alt="Generating Tag and Summary from a YouTube Url" width="60%" height="60%"></p>

- Generating Tag and Summary from a YouTube Url (Expanded)
<p align="center"><img src="/assets/img4.jpg" alt="Generating Tag and Summary from a YouTube Url (Expanded)" width="60%" height="60%"></p>

</details>

Interested in trying it out? Click [**Here**](https://telegram.me/HyperTag_bot) to access the bot, or simply search for [**@HyperTAG_bot**](https://telegram.me/HyperTag_bot) on Telegram.

To see HyperTAG's channel integration features in action (automated tag and summary generation for channel posts), check out the [**@HW_HUB**](https://telegram.me/HW_HUB) channel on Telegram.

Join my [**Devlog**](https://telegram.me/Falken_Devlog) channel on Telegram for updates and announcements about HyperTAG and other projects.

## Key Features

- 📖 **Text Analysis**:
  HyperTAG analyzes the text content of your messages to recommend relevant tags.

- 🔗 **Link Analysis**:
  When your message contains links, HyperTAG extracts the main content (up to the first 2 URLs) to enhance tag recommendations.

- 🎥 **YouTube Analysis**:
  HyperTAG also retrieves captions from YouTube video links to use it in generating better tags.

- 📝 **Summarization**:
  HyperTAG can summarize the First Link in a message—whether it's a regular or YouTube link—providing a concise overview of the content as a brief summary.

- 📢 **Channel Integration**:
  You can add HyperTAG to your channels, enabling it to automatically generate tags and, if enabled, summaries for your posts.

**... and more!**

## Prerequisites

To run HyperTAG locally, ensure you have the following:

1. **Node.js v18**

- HyperTAG requires Node.js version **18 LTS** ([Download Link](https://nodejs.org/en/download/prebuilt-installer)) for compatibility, as newer Node.js versions introduce breaking changes that affect some libraries used in the project. If you have a different Node.js version installed and prefer not to uninstall it, you can manage multiple versions and switch between them using a **Node Version Manager** ([Windows Guide](https://github.com/coreybutler/nvm-windows) - [Mac/Linux Guide](https://github.com/nvm-sh/nvm)).

2. **Telegram API Key**

- Create a bot using [@BotFather](https://t.me/botfather) on Telegram and obtain the API key. For detailed instructions, refer to the [HyperTAG Bot Setup Guide](docs/HyperTAG_bot_setup.md) documentation.

3. **Google Gemini API Key**

- Sign up at [Google AI Studio](https://aistudio.google.com) and generate your free Gemini API key.

Both the Telegram and Gemini API keys are mandatory for the bot to function, and they are **free** to obtain without needing a credit card.

## Installation

To run the HyperTAG bot on your machine, follow these steps:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/mostafa-abbasi/HyperTAG.git
   cd HyperTAG
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Create Configuration File**:

   ```bash
   cp config.env.example config.env
   ```

- This command creates a new `config.env` file in the project's root directory and copies the contents of `config.env.example` into it.

4. **Set Up Environment Variables**:

- open the newly created `config.env` file and fill in the required environment variables (`TELEGRAM_API_KEY` and `GEMINI_API_KEY`). You can refer to [Prerequisites](#prerequisites) section for how to get the keys.

5. **Run the bot**:

   ```bash
   npm start
   ```

## Craft Your Ideal Bot by Customizing HyperTAG’s Config File

After completing Step 4 of the installation, please take a moment to review the `config.env` file thoroughly. If you haven't done this installation step yet, refer to the [config.env.example](config.env.example) file, which serves as a baseline for your `config.env`.

This file contains a variety of customizable options that can significantly enhance your experience with HyperTAG. While certain settings, such as API keys for Telegram and Gemini, are mandatory, many others are optional and can greatly influence the bot's functionality. We encourage you to adjust these settings according to your preferences to optimize your hosting experience with HyperTAG.

<details>
<summary><b>Click Here for a Summary of Configurable Options in config.env</b> ➡️</summary>

### Required API Keys

- `TELEGRAM_API_KEY`: API key for interacting with Telegram bot (required).
- `GEMINI_API_KEYS`: Google Gemini API keys for generating tags and summaries (required). You can provide one or more keys in an array.

### Node Environment

- `NODE_ENV`: Set to `production` for deployment (`development` by default).
- `POLLING_INTERVAL_DEV`: Polling interval in development (default: 1000ms).
- `POLLING_INTERVAL_PROD`: Polling interval in production (default: 3000ms).

### Tag Generation

- `TAG_GENERATION_METHOD`: Select method for tag generation (`1` for Google Gemini, `2` for TextRazor).
- `TEXTRAZOR_API_KEYS`: TextRazor API keys (optional for method 2).

### Summarization

- `ENABLE_SUMMARIZATION`: Enable/disable URL summarization (`true` or `false`).
- `SUMMARIZATION_METHOD`: Select method for summarization (`1` for Google Gemini, `2` for OpenAI-Compatible, `3` for Ollama).
- `OPENROUTER_API_KEYS`: OpenRouter API keys (optional for method 2).

### Proxy Options (Optional)

- `PROXY_BASE_URL`: Cloudflare worker URL for proxy requests.
- `ENABLE_URL_PROXY`: Enable proxy for failed URLs.
- `ENABLE_TELEGRAM_PROXY`: Use proxy for Telegram API requests.
- `ENABLE_GEMINI_PROXY`: Use proxy for Gemini API requests.
- `ENABLE_TEXTRAZOR_PROXY`: Use proxy for TextRazor API requests.
- `ENABLE_OPENROUTER_PROXY`: Use proxy for OpenRouter API requests.

### Admin & VIP Configuration

- `BOT_ADMIN_USER_ID`: Telegram ID of the bot admin (required for admin commands such as /broadcast and /stats). (optional)
- `VIP_USER_IDS`: List of Telegram IDs of users with VIP access, e.g., `[user_id1, user_id2]`. (optional)

### Rate Limiting

- `MAX_CONNECTED_CHANNELS`: Max channels for regular users (default: 1).
- `MAX_CONNECTED_CHANNELS_VIP`: Max channels for VIP users (default: 5).

#### Rate Limits for Private Chats

- `RATE_LIMIT_PRIVATE_DEV`: Rate limit for private chats in development (default: `100` requests/day).
- `RATE_LIMIT_PRIVATE_PROD`: Rate limit for private chats in production (default: `10` requests/day).
- `RATE_LIMIT_PRIVATE_VIP_DEV`: Rate limit for VIP users in development (default: `100` requests/day).
- `RATE_LIMIT_PRIVATE_VIP_PROD`: Rate limit for VIP users in production (default: `50` requests/day).

#### Rate Limits for Channel Posts

- `RATE_LIMIT_CHANNEL_DEV`: Rate limit for channel posts in development (default: `100` requests/day).
- `RATE_LIMIT_CHANNEL_PROD`: Rate limit for channel posts in production (default: `10` requests/day).
- `RATE_LIMIT_CHANNEL_VIP_DEV`: Rate limit for VIP users in channel posts (default: `100` requests/day).
- `RATE_LIMIT_CHANNEL_VIP_PROD`: Rate limit for VIP users in channel posts (default: `25` requests/day).

### Bot Settings

- `ENABLE_TRANSLATION`: Enable translation feature (`true` or `false`).
- `ENABLE_SECONDARY_CONTEXT_EXTENSION`: Enable fallback context extender using the Cheerio library (`true` or `false`).
- `NUMBER_OF_TAGS_TO_DISPLAY_IN_PRIVATE_CHAT`: Number of tags to display in private chats (default: 10).
- `NUMBER_OF_TAGS_TO_DISPLAY_IN_CHANNEL`: Number of tags to display in channels (default: 5).
- `NUMBER_OF_URLS_TO_ANALYZE_FROM_EACH_REQUEST`: URLs to fetch for context analysis (default: 2).
- `NUMBER_OF_CHARACTERS_TO_RETRIEVE_FROM_EACH_URL`: Number of characters to retrieve from each URL. (default: 15000)
- `MAX_URL_SIZE`: Maximum allowed URL size for fetching in bytes (e.g., `10485760` for 10MB).

### Bot Text Placeholders

- `SUPPORT_ACCOUNT_HANDLE`: Telegram handle for support (e.g., `@mostafa_abbac`).
- `BOT_NAME`: Name of the bot (e.g., `HyperTAG`).
- `BOT_HANDLE`: Telegram handle of the bot (e.g., `@HyperTag_bot`).
- `BOT_LINK`: Direct link to the bot (e.g., `t.me/HyperTag_bot`).
- `BOT_SIGNATURE`: Text that will be shown at the end of messages edited by HyperTAG in channels (e.g., `@HyprTAG`)

### Sponsor Channel Configuration

- `ENABLE_SPONSOR_CHANNEL`: Enable mandatory sponsor channel for users (`true`/`false`).
- `SPONSOR_CHANNEL_ID`: The Telegram channel ID that users must join before using the bot.  
  Example: `-1001374364132`.
- `SPONSOR_CHANNEL_LINK`: Direct link or handle for users to join the sponsor channel (e.g., `t.me/+0ifSLk5nQJ43ODY8`).

</details>

## Proxy Feature

HyperTAG provides an optional proxy feature aimed at improving accessibility and privacy, especially in areas with internet censorship (such as Iran) or where access to specific services is limited. This feature routes requests through a Cloudflare Worker, enabling users to circumvent regional restrictions while concealing their IP address and location. It's important to note that there shouldn't be any issues when accessing Cloudflare itself by the host.

The proxy can be used for various services within the bot that perform direct HTTP/HTTPS requests, effectively acting as a bridge between the client and the target URL.

### Enabling the Proxy

To activate the proxy feature, please refer to the comprehensive instructions in the [Cloudflare Worker Proxy Setup Guide](docs/Cloudflare_worker_proxy_setup.md). This guide will assist you in configuring the `config.env` file to ensure that both API requests and URL fetching are routed through the proxy.

## Contributing

Contributions are welcomed! If you have ideas or want to improve the bot, feel free to submit a pull request or create an issue.

You can contact me at mostafaabbac@gmail.com or [@mostafa_abbac](https://t.me/mostafa_abbac) on Telegram.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE.md) file for details.
