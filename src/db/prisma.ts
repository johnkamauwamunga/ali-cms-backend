import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const prismaLogLevels =
  env.NODE_ENV === "development"
    ? [
        { emit: "event" as const, level: "warn" as const },
        { emit: "event" as const, level: "error" as const },
      ]
    : [{ emit: "event" as const, level: "error" as const }];

type ConfiguredPrismaClient = PrismaClient<{
  log: typeof prismaLogLevels;
}>;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: ConfiguredPrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient<{
    log: typeof prismaLogLevels;
  }>({
    log: prismaLogLevels,
  });

prisma.$on("warn", () => {
  logger.warn({ component: "prisma" }, "Database client warning");
});

prisma.$on("error", () => {
  logger.error({ component: "prisma" }, "Database client error");
});

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
