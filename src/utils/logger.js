// src/utils/logger.js

import fs from "fs";
import config from "../config/index.js";

const getTime = () => new Date().toLocaleString();

const logger = {
  info: (message) => {
    const time = getTime();
    console.log(`[INFO - ${time}] ${message}`);
  },
  error: (message, error = "") => {
    const time = getTime();
    console.error(`[ERROR - ${time}] ${message}`, error);
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
