import { Hono } from "hono";
import { corsMiddleware } from "./config/cors.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { requestIdMiddleware } from "./middleware/request-id.middleware.js";
import { successResponse } from "./lib/response.js";
import { apiRoutes } from "./routes/index.js";
import type { AppEnv } from "./types/context.js";

export const app = new Hono<AppEnv>();

app.use("*", requestIdMiddleware);

app.use("*", async (context, next) => {
  const startedAt = Date.now();

  await next();

  logger.info(
    {
      requestId: context.res.headers.get("X-Request-ID"),
      method: context.req.method,
      path: context.req.path,
      status: context.res.status,
      durationMs: Date.now() - startedAt,
    },
    "Request completed",
  );
});

app.use("*", corsMiddleware);

app.get("/health", (context) =>
  context.json(
    successResponse("Service is healthy", {
      status: "ok",
      environment: env.NODE_ENV,
    }),
  ),
);

app.route("/api/v1", apiRoutes);

app.onError(errorHandler);
