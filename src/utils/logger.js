// src/utils/logger.js

import fs from "fs";
import config from "../config/index.js";

const logger = {
  info: (message) => {
    console.log(`[INFO] ${message}`);
  },
  error: (message, error = "") => {
    console.error(`[ERROR] ${message}`, error);
  },
};

if (config.environment === "development") {
  // writing all the logs and errors to file output.log
  const logStream = fs.createWriteStream("output.log", { flags: "a" });
  const errorStream = fs.createWriteStream("output.log", { flags: "a" });

  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  console.log = (...args) => {
    originalConsoleLog(...args);
    logStream.write(args.join(" ") + "\n");
  };

  console.error = (...args) => {
    originalConsoleError(...args);
    errorStream.write(args.join(" ") + "\n");
  };
}

export default logger;
