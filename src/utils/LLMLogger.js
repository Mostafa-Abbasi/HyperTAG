// src/utils/LLMLogger.js
import logger from "./logger.js";

// Function to log the metrics in a table format - It is used for all 3 generators,
// Note that ollama has more metrics to show - these metrics are "N/A" in other 2 generators
export default function logMetrics({
  method,
  model,
  load_duration = null,
  prompt_eval_count,
  prompt_eval_duration = null,
  eval_count,
  eval_duration = null,
  elapsedTime,
}) {
  // calculating some ollama generator specific metrics - these are not available for other generators and will be replaced with "-"
  const modelLoadDuration = load_duration
    ? `${(load_duration / 1e9).toFixed(2)}s`
    : "-";

  const promptEvaluationTime = prompt_eval_duration
    ? `${(prompt_eval_duration / 1e9).toFixed(2)}s`
    : "-";

  const promptEvaluationSpeed = prompt_eval_duration
    ? `${(prompt_eval_count / (prompt_eval_duration / 1e9)).toFixed(
        2
      )} tokens/s`
    : "-"; // in case of very high values, it is cached from before

  const responseGenerationTime = eval_duration
    ? `${(eval_duration / 1e9).toFixed(2)}s`
    : "-";

  const inferenceSpeed = eval_duration
    ? `${(eval_count / (eval_duration / 1e9)).toFixed(2)} tokens/s`
    : "-";

  // Estimated processing speed for openAI-Compatible and google generators, it is not accurate and it's here only for insight
  // It is an average of token/s for both prompt evaluation and token generation + added network latency
  const commulativeSpeed =
    method !== "offline"
      ? `${((prompt_eval_count + eval_count) / elapsedTime).toFixed(
          2
        )} tokens/s`
      : "-";

  // Table-like format for metrics
  const tableFormat = `
  +--------------------------+-------------------------+
  |          Metric          |           Value         |
  +--------------------------+-------------------------+
  Model Name                 | ${model}                
  Model Load Duration        | ${modelLoadDuration}          
  Total Tokens               | ${prompt_eval_count + eval_count}             
  Prompt Tokens              | ${prompt_eval_count}             
  Prompt Evaluation Time     | ${promptEvaluationTime}
  Prompt Evaluation Speed    | ${promptEvaluationSpeed} 
  Response Tokens            | ${eval_count}             
  Response Generation Time   | ${responseGenerationTime}
  Inference Speed            | ${inferenceSpeed}         
  Commulative Speed (Online) | ${commulativeSpeed}         
  Total Inference Duration   | ${elapsedTime}s          
  `;

  logger.info(tableFormat);
}
