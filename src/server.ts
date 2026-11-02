import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./db/prisma.js";
import { cleanupExpiredRateLimitBuckets } from "./db/rate-limit-cleanup.js";

const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    logger.info({ port: info.port }, "Server listening");
  },
);

let rateLimitCleanupTask: Promise<void> | undefined;

const runRateLimitCleanup = (): Promise<void> => {
  if (rateLimitCleanupTask) {
    return rateLimitCleanupTask;
  }

  rateLimitCleanupTask = cleanupExpiredRateLimitBuckets()
    .then(() => undefined)
    .catch((error: unknown) => {
      const errorType =
        error instanceof Error ? error.name : "UnknownError";
      logger.error({ errorType }, "Expired rate-limit bucket cleanup failed");
    })
    .finally(() => {
      rateLimitCleanupTask = undefined;
    });

  return rateLimitCleanupTask;
};

const rateLimitCleanupTimer = setInterval(() => {
  void runRateLimitCleanup();
}, 15 * 60 * 1000);

rateLimitCleanupTimer.unref();
void runRateLimitCleanup();

let shutdownStarted = false;

const shutdown = async (reason: string): Promise<void> => {
  if (shutdownStarted) {
    return;
  }

  shutdownStarted = true;
  clearInterval(rateLimitCleanupTimer);
  logger.info({ reason }, "Graceful shutdown started");

  const serverClosed = new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  const [serverResult, cleanupResult] = await Promise.allSettled([
    serverClosed,
    rateLimitCleanupTask ?? Promise.resolve(),
  ]);
  const [prismaResult] = await Promise.allSettled([prisma.$disconnect()]);
  const failure = [serverResult, cleanupResult, prismaResult].find(
    (result) => result.status === "rejected",
  );

  if (failure?.status === "rejected") {
    const errorType =
      failure.reason instanceof Error ? failure.reason.name : "UnknownError";
    logger.error({ reason, errorType }, "Graceful shutdown failed");
    process.exitCode = 1;
    return;
  }

  logger.info({ reason }, "Graceful shutdown completed");
};

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});
