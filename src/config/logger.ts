import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  base: {
    service: "ali-api",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "password",
      "passwordHash",
      "securityAnswer",
      "securityAnswerHash",
      "token",
      "accessToken",
      "refreshToken",
      "req.body",
      "request.body",
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.securityAnswer",
      "*.securityAnswerHash",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.email",
      "*.phone",
      "*.name",
    ],
    censor: "[REDACTED]",
  },
});
