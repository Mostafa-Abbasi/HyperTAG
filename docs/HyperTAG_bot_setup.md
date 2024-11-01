# How to Create and Set Up Your Own Instance of HyperTAG Bot with @BotFather

Follow these steps to set up your instance of the HyperTAG bot:

## Step 1: Create a New Bot

- Open Telegram and go to [@BotFather](https://t.me/BotFather).
- Type `/newbot` in the chat.
- Choose a **name** for your bot, e.g., **"HyperTAG"**.
- Then, select a **username** for your bot, e.g., **"HyperTAG_bot"**.

## Step 2: Get the API Key

- After creating your bot, @BotFather will generate an **API key**.
- Copy this key and paste it into the `TELEGRAM_API_KEY` field in the `config.env` file located in the app's root directory.

- If the `config.env` file doesn’t exist yet, it will be automatically created when you run the command in Step 3 of the Installation section. (See more details [in here](../README.md#installation)).

## Step 3: Adjust Bot Settings for Groups

- Type `/mybots` in the chat with @BotFather.
- Select your newly created bot.
- Go to **Bot Settings** → **Allow Groups?** and click **Turn Groups Off**.

## Step 4: Modify Channel Admin Rights

- Return to **Bot Settings**.
- Select **Channel Admin Rights**.
- Enable these options:
  - "Edit messages of other users"
  - "Post in the channel"

## Step 5: Configure Bot Commands

- Go back to **Bot Settings** → **Back to Bot** → **Edit Bot**.
- Choose **Edit Commands**.
- Enter the following commands and descriptions into the chat (copy and paste the text below into @BotFather):

```
start - Start the Bot 🚀
help - Learn How to Use the Bot ℹ️
tokens - Check Your Token Usage 📊
channels - See Connected Channel(s) 🔗
summary - Toggle The Summary Feature 📝
faq - Explore Frequently Asked Questions ❓
commands - View All Available Commands 🛠
languages - List of All Supported Languages 🌐
```

## Step 6: Additional Bot Settings (NOT NECESSARY)

Your bot is now fully set up and ready for use! However, there are optional settings you can configure to further personalize your bot:

- **/setabouttext**: Set a custom bio for your bot, example:

```
✨ AI-Generated Tags and Summaries for Telegram Messages
```

- **/setdescription**: Add a detailed description for your bot, example:

```
HyperTAG 🤖 is a Telegram bot that leverages advanced ✨ AI models to generate context-aware tags and summaries for your messages. It can also automatically create tags and summaries for channel posts.

The bot analyzes the text content of your messages along with any included links, producing relevant #️⃣ tags and 📝 summaries based on both the message text and the text from the links. Additionally, it generates summaries for 🌐 Web pages or 🎬 YouTube videos using their links.
```

- You can also add a picture to your bot’s description by selecting **Edit Description Picture** witihin **Edit Bot** section.

- **/setuserpic**: Upload a profile photo for your bot.
