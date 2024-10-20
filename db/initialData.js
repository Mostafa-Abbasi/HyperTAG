// src/db/initialData.js

import { promisify } from "util";
import logger from "../src/utils/logger.js";

const initializeTablesWithDefaultValues = async (db) => {
  db.getAsync = promisify(db.get).bind(db);
  db.runAsync = promisify(db.run).bind(db);

  try {
    // Initialize Activities Table
    const activitiesCount = await db.getAsync(
      "SELECT COUNT(*) as count FROM Activities"
    );
    if (activitiesCount.count === 0) {
      await db.runAsync(
        "INSERT INTO Activities (activity_id, activity_name) VALUES (?, ?), (?, ?)",
        [1, "privateRequest", 2, "channelRequest"]
      );
      logger.info("Inserted default activities into Activities table.");
    }

    // Initialize Metrics Table
    const metricsCount = await db.getAsync(
      "SELECT COUNT(*) as count FROM Metrics"
    );

    if (metricsCount.count === 0) {
      await db.runAsync(
        `INSERT INTO Metrics (metric_name, metric_display) VALUES 
        (?, ?), (?, ?), (?, ?), 
        (?, ?), (?, ?), (?, ?), 
        (?, ?), (?, ?), (?, ?), (?, ?), (?, ?)`,
        [
          "registered_users",
          true,
          "active_users",
          true,
          "new_users",
          true,
          "registered_channels",
          true,
          "active_channels",
          true,
          "new_channels",
          true,
          "chat_requests",
          true,
          "channel_requests",
          true,
          "gemini_api_calls",
          true,
          "textrazor_api_calls",
          true,
          "openrouter_api_calls",
          true,
        ]
      );
      logger.info("Inserted default metrics into Metrics table.");
    }
  } catch (err) {
    logger.error("Error initializing tables:", err);
    throw err;
  }
};

export default initializeTablesWithDefaultValues;
