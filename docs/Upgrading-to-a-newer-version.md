# How to Upgrade Your Currently Hosted HyperTAG to a Newer Version

Upgrading HyperTAG to a newer version is a straightforward process. Follow these steps carefully to ensure a smooth upgrade while preserving your data and configuration.

---

## 0. How Can I Know if a New Version Has Released?

To stay updated on new releases:

- Regularly check the [GitHub repository](https://github.com/Mostafa-Abbasi/hypertag.git), specifically the **Releases** section.
- Alternatively, follow the Telegram Channel: [T.me/Falken_Devlog](https://T.me/Falken_Devlog) for announcements, tips, and change logs.

---

## 1. Back Up Your Current Setup

Before proceeding with the upgrade, **create multiple backups** of your important files:

- **`database.sqlite`**: Contains your bot’s data. Save it regularly and store a copy in external storage or a cloud drive.
- **`config.env`**: Stores API keys, settings, and environment configurations.
- (Optional) **`output.log`**: Useful if you want to preserve the log of previous deployments.

---

## 2. Download the New Release

Go to the [GitHub releases page](https://github.com/Mostafa-Abbasi/hypertag.git) and download the latest version of HyperTAG.

---

## 3. Restore Configurations and Database

- Copy your **backed-up `database.sqlite`** and **`config.env`** files to the appropriate directories in the new release.
- Keep additional copies of your backups in case of unexpected issues during the upgrade.

---

## 4. Review Change Logs

Carefully review the **change logs** for:

- The version you are upgrading to.
- Any intermediate versions if you are skipping multiple releases.

### How to Check Your Current Version

You can find your current HyperTAG version in the **`package.json`** file:

- Open the file in a text editor.
- Look for the `version` field.
  ```json
  "version": "x.x.x"
  ```
  The number shown is your current version.

Pay close attention to the `config.env` file:

- **New variables** may have been added.
- **Default values** for existing variables may have changed.

Update your `config.env` file accordingly to ensure compatibility with the new version.

---

## 5. Install Node Modules and Start the Bot

- Run `npm i` in the bot’s directory to install any new or updated dependencies.
- Start the bot using the command `npm start`.

---

## 6. Troubleshooting

If you encounter issues during or after the upgrade:

- Check the **`output.log`** file for error messages.
- Verify that your `config.env` file includes all the necessary variables.
- Refer to the GitHub Issues page or reach out via the Telegram Devlog Channel for support.
- Use your **backed-up `database.sqlite`** and **`config.env`** files to revert to a previous version if necessary.

---

## FAQ

### What should I do if I forgot to back up my database?

Unfortunately, without a backup, your data cannot be restored. It’s strongly recommended to always keep multiple backups before upgrading.

### How do I reset `config.env` if it breaks the bot?

Re-download the latest release, copy the default `example.config.env` to a new `config.env` file, and manually reconfigure your API keys and settings.

---

By following these steps, your HyperTAG bot should be successfully upgraded and ready to use with the latest features and improvements!
