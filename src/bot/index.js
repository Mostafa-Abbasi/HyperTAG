// src/bot/index.js

import { getLatestUpdateId } from "../services/telegramServices.js";
import pollForUpdates from "./polling.js";
import { initializeDb, updateVipStatusForAllUsers } from "../../db/database.js";
import logger from "../utils/logger.js";

const startBot = async () => {
  try {
    await initializeDb(); // Initialize the database
    await updateVipStatusForAllUsers(); // Update VIP status for all users
    await getLatestUpdateId(); // Get the latest update ID from Telegram
    await pollForUpdates(); // Start polling for updates
  } catch (error) {
    logger.error("Error starting bot:", error);
  }
};

export default startBot;
