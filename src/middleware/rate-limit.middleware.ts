import { createHmac } from "node:crypto";
import type { MiddlewareHandler } from "hono";
import { prisma } from "../db/prisma.js";
import { env } from "../config/env.js";
import { errorResponse } from "../lib/response.js";
import type { AppEnv } from "../types/context.js";

type RateLimitOptions = {
  scope: string;
  limit: number;
  windowMs: number;
};

export const rateLimitMiddleware = ({
  scope,
  limit,
  windowMs,
}: RateLimitOptions): MiddlewareHandler<AppEnv> => {
  if (!scope.trim()) {
    throw new Error("Rate limit scope must not be empty");
  }

  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error("Rate limit must be a positive safe integer");
  }

  if (!Number.isSafeInteger(windowMs) || windowMs < 1) {
    throw new Error("Rate limit window must be a positive safe integer");
  }

  return async (context, next) => {
    const clientAddress = context.env?.incoming?.socket?.remoteAddress;

    if (!clientAddress) {
      return context.json(errorResponse("Unable to identify client"), 503);
    }

    const now = Date.now();
    const windowStartMs = Math.floor(now / windowMs) * windowMs;
    const windowStartedAt = new Date(windowStartMs);
    const expiresAt = new Date(windowStartMs + windowMs);
    const bucketId = createHmac("sha256", env.JWT_ACCESS_SECRET)
      .update(JSON.stringify([scope, clientAddress, windowStartMs]))
      .digest("hex");

    const bucket = await prisma.rateLimitBucket.upsert({
      where: { id: bucketId },
      create: {
        id: bucketId,
        windowStartedAt,
        expiresAt,
        requestCount: 1,
      },
      update: {
        requestCount: { increment: 1 },
      },
    });

    if (bucket.requestCount > limit) {
      const retryAfter = Math.max(
        1,
        Math.ceil((windowStartMs + windowMs - now) / 1000),
      );

      return context.json(errorResponse("Too many requests"), 429, {
        "Retry-After": String(retryAfter),
      });
    }

    await next();
  };
};
