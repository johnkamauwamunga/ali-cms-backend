import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";
import { errorResponse } from "../lib/response.js";

export const errorHandler: ErrorHandler = (error, context) => {
  if (error instanceof ZodError) {
    logger.warn({ errorType: "ZodError" }, "Request validation failed");

    return context.json(
      errorResponse(
        "Validation failed",
        error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      ),
      400,
    );
  }

  if (error instanceof HTTPException) {
    const isInternalError = error.status >= 500;

    if (isInternalError) {
      logger.error(
        { errorType: error.name, status: error.status },
        "HTTP request failed",
      );
    } else {
      logger.warn(
        { errorType: error.name, status: error.status },
        "HTTP request rejected",
      );
    }

    return context.json(
      errorResponse(
        isInternalError ? "Internal server error" : error.message,
      ),
      error.status,
    );
  }

  logger.error({ errorType: error.name }, "Unhandled request error");

  return context.json(errorResponse("Internal server error"), 500);
};
