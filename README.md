[![Release](https://img.shields.io/github/v/release/Mostafa-Abbasi/HyperTAG?style=flat-square&label=Release)](https://github.com/Mostafa-Abbasi/HyperTAG/releases)
[![Bot Link](https://img.shields.io/badge/Bot-Telegram-blue.svg?logo=telegram)](https://t.me/HyperTAG_bot)
[![Bot Link](https://img.shields.io/badge/Channel-Telegram-blue.svg?logo=telegram)](https://t.me/Falken_Devlog)
[![License](https://img.shields.io/github/license/Mostafa-Abbasi/HyperTAG?style=flat-square&label=License)](https://github.com/Mostafa-Abbasi/HyperTAG/blob/main/LICENSE.md)

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

To set up HyperTAG for the first time, follow the steps below. If you are upgrading from a previous version, please refer to the [**Upgrade Guide**](docs/Upgrading-to-a-newer-version.md) for detailed instructions on updating your instance safely.

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

- open the newly created `config.env` file and fill in the required environment variables (`TELEGRAM_API_KEY` and `GEMINI_API_KEY`). Refer to the [Prerequisites](#prerequisites) section for instructions on obtaining the keys.

5. **Run the bot**:

   ```bash
   npm start
   ```

## Upgrading HyperTAG

If you're running/hosting an older version of HyperTAG and would like to upgrade to the latest release, please refer to the [**HyperTAG Upgrade Guide**](docs/Upgrading-to-a-newer-version.md). This guide provides step-by-step instructions to ensure a smooth transition without losing your current configurations or data.

## Craft Your Ideal Bot by Customizing HyperTAG’s Config File

After completing Step 4 of the installation, please take a moment to review the `config.env` file thoroughly. If you haven't done this installation step yet, refer to the [config.env.example](config.env.example) file, which serves as a baseline for your `config.env`.

**Note**: You don't have to change all of the options below to start/use the bot, the necessary ones are only Telegram & Gemini API keys.

This file contains a variety of customizable options that can significantly enhance your experience with HyperTAG. While certain settings, such as API keys for Telegram and Gemini, are mandatory, many others are optional and can greatly influence the bot's functionality. We encourage you to adjust these settings according to your preferences to optimize your hosting experience with HyperTAG.

### Required API Keys

<div align="center">
  
| Key                 | Description                                                    | Required? |
|---------------------|----------------------------------------------------------------|-----------|
| `TELEGRAM_API_KEY`  | API key for interacting with Telegram bot.                     | Yes       |
| `GEMINI_API_KEYS`   | Google Gemini API keys/keys for generating tags and summaries  | Yes       |

</div>

### Node Environment

<div align="center">
  
| Variable               | Description                               | Default       |
|------------------------|-------------------------------------------|---------------|
| `NODE_ENV`             | Set to `production` for deployment.       | `development` |
| `POLLING_INTERVAL_DEV` | Polling interval in development (ms).     | `1000`        |
| `POLLING_INTERVAL_PROD`| Polling interval in production (ms).      | `3000`        |

</div>

### Tag Generation

<div align="center">

| Variable               | Description                               | Default          |
|------------------------|-------------------------------------------|------------------|
| `TAG_GENERATION_METHOD`| Select tag generation method (`1`-`4`).   | `1` (Gemini API) |

</div>

<div align="center">

| Methods                                 | Description                                                                                 | API Key Required? | Maximum Free Daily Limit           |
|-----------------------------------------|---------------------------------------------------------------------------------------------|-------------------|------------------------------------|
| `1` or `googleGeminiTagGenerator()`     | Works by using google gemini's API Endpoint, fast, accurate, high rate-limit                | Yes               | 1500 (Gemini-Flash)                |
| `2` or `openAiCompatibleTagGenerator()` | Works by sending the request to a provider that has OpenAi-Compatible API (e.g. OpenRouter) | Yes               | 200 (Any Free Model on OpenRouter) |
| `3` or `ollamaTagGenerator()`           | Works by using a local-hosted LLM through Ollama                                            | No                | Unlimited                          |
| `4` or `textRazorTagGenerator()`        | Works by using text Razor's API Endpoint, fast, semi-accurate, medium rate-limit            | Yes               | 500                                |

</div>

<div align="center">

| Key                    | Description                                        | Required for   |
|------------------------|----------------------------------------------------|----------------|
| `OPENROUTER_API_KEYS`  | OpenRouter API key/keys.                           | Method `2`     |
| `TEXTRAZOR_API_KEYS`   | TextRazor API key/keys.                            | Method `4`     |

</div>

### Summarization

<div align="center">

| Variable              | Description                                         | Default          |
|-----------------------|-----------------------------------------------------|------------------|
| `ENABLE_SUMMARIZATION`| Enable/disable URL summarization.                   | `true`           |
| `SUMMARIZATION_METHOD`| Select summarization method (`1`-`3`).              | `1` (Gemini API) |

</div>

<div align="center">

| Methods                                     | Description                                                                                 | API Key Required? | Maximum Free Daily Limit           |
|---------------------------------------------|---------------------------------------------------------------------------------------------|-------------------|------------------------------------|
| `1` or `googleGeminiSummaryGenerator()`     | Works by using google gemini's API Endpoint, fast, accurate, high rate-limit                | Yes               | 1500 (Gemini-Flash)                |
| `2` or `openAiCompatibleSummaryGenerator()` | Works by sending the request to a provider that has OpenAi-Compatible API (e.g. OpenRouter) | Yes               | 200 (Any Free Model on OpenRouter) |
| `3` or `ollamaSummaryGenerator()`           | Works by using a local-hosted LLM through Ollama                                            | No                | Unlimited                          |

</div>

### Proxy Options (Optional)

<div align="center">

| Variable                  | Description                                      | Default |
|---------------------------|--------------------------------------------------|---------|
| `PROXY_BASE_URL`          | Cloudflare worker URL for proxy requests.        | N/A     |
| `ENABLE_URL_PROXY`        | Enable proxy for failed URLs.                    | `false` |
| `ENABLE_TELEGRAM_PROXY`   | Use proxy for Telegram API requests.             | `false` |
| `ENABLE_GEMINI_PROXY`     | Use proxy for Gemini API requests.               | `false` |
| `ENABLE_OPENROUTER_PROXY` | Use proxy for OpenRouter API requests.           | `false` |
| `ENABLE_TEXTRAZOR_PROXY`  | Use proxy for TextRazor API requests.            | `false` |

</div>

### Admin & VIP Configuration

<div align="center">

| Variable             | Description                                          | Default |
|----------------------|------------------------------------------------------|---------|
| `BOT_ADMIN_USER_ID`  | Telegram ID of the bot admin (optional).             | N/A     |
| `VIP_USER_IDS`       | List of Telegram IDs for VIP users (optional).       | N/A     |

</div>

### Rate Limiting

<div align="center">

| Variable                      | Description                                   | Default |
|-------------------------------|-----------------------------------------------|---------|
| `MAX_CONNECTED_CHANNELS`      | Max channels for regular users.               | `1`     |
| `MAX_CONNECTED_CHANNELS_VIP`  | Max channels for VIP users.                   | `5`     |

</div>

#### Private Chats Rate Limits

<div align="center">

| Variable                      | Description                                   | Default |
|-------------------------------|-----------------------------------------------|---------|
| `RATE_LIMIT_PRIVATE_DEV`      | Rate limit in development (requests/day).     | `10`    |
| `RATE_LIMIT_PRIVATE_PROD`     | Rate limit in production (requests/day).      | `10`    |
| `RATE_LIMIT_PRIVATE_VIP_DEV`  | VIP rate limit in development (requests/day). | `100`   |
| `RATE_LIMIT_PRIVATE_VIP_PROD` | VIP rate limit in production (requests/day).  | `50`    |

</div>

#### Channel Posts Rate Limits

<div align="center">

| Variable                      | Description                                   | Default |
|-------------------------------|-----------------------------------------------|---------|
| `RATE_LIMIT_CHANNEL_DEV`      | Rate limit in development (requests/day).     | `10`    |
| `RATE_LIMIT_CHANNEL_PROD`     | Rate limit in production (requests/day).      | `10`    |
| `RATE_LIMIT_CHANNEL_VIP_DEV`  | VIP rate limit in development (requests/day). | `100`   |
| `RATE_LIMIT_CHANNEL_VIP_PROD` | VIP rate limit in production (requests/day).  | `25`    |

</div>

### Bot Settings

<div align="center">

| Variable                                         | Description                             | Default    |
|--------------------------------------------------|-----------------------------------------|------------|
| `ENABLE_TRANSLATION`                             | Enable translation feature.             | `true`     |
| `ENABLE_SECONDARY_CONTEXT_EXTENSION`             | Enable fallback context extension       | `true`     |
| `NUMBER_OF_TAGS_TO_DISPLAY_IN_PRIVATE_CHAT`      | Tags to display in private chats.       | `10`       |
| `NUMBER_OF_TAGS_TO_DISPLAY_IN_CHANNEL`           | Tags to display in channels.            | `5`        |
| `NUMBER_OF_URLS_TO_ANALYZE_FROM_EACH_REQUEST`    | URLs to fetch for analysis.             | `2`        |
| `NUMBER_OF_CHARACTERS_TO_RETRIEVE_FROM_EACH_URL` | Characters to retrieve.                 | `15000`    |
| `MAX_URL_SIZE`                                   | Maximum URL size in bytes (e.g., 10MB). | `10485760` |

</div>

### Bot Text Placeholders

<div align="center">

| Variable                 | Description                                       | Example                              |
|--------------------------|---------------------------------------------------|--------------------------------------|
| `SUPPORT_ACCOUNT_HANDLE` | Telegram handle for support.                      | `@mostafa_abbac`                     |
| `BOT_NAME`               | Name of the bot.                                  | `HyperTAG`                           |
| `BOT_HANDLE`             | Telegram handle of the bot.                       | `@HyperTAG_bot`                      |
| `BOT_LINK`               | Direct link to the bot.                           | `t.me/HyperTAG_bot`                  |
| `BOT_SIGNATURE`          | Text at the end of messages edited by HyperTAG.   | `@HyprTAG`                           |
| `BOT_SUPPORT_CHANNEL`    | Direct link to the bot's support channel          | `t.me/Falken_Devlog`                 |
| `BOT_GITHUB_LINK`        | Direct link to the bot's repository link          | `github.com/Mostafa-Abbasi/HyperTAG` |

</div>

### Sponsor Channel Configuration

<div align="center">

| Variable                 | Description                                       | Example                  |
|--------------------------|---------------------------------------------------|--------------------------|
| `ENABLE_SPONSOR_CHANNEL` | Enable mandatory sponsor channel for users.       | `true`                   |
| `SPONSOR_CHANNEL_ID`     | Telegram channel ID to join before using the bot. | `-1001374364132`         |
| `SPONSOR_CHANNEL_LINK`   | Direct link/handle for sponsor channel.           | `t.me/+0ifSLk5nQJ43ODY8` |

</div>

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
