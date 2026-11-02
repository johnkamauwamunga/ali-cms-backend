import { logger } from "../config/logger.js";
import { prisma } from "./prisma.js";

export const cleanupExpiredRateLimitBuckets = async (): Promise<number> => {
  const { count } = await prisma.rateLimitBucket.deleteMany({
    where: {
      expiresAt: { lte: new Date() },
    },
  });

  if (count > 0) {
    logger.debug({ deletedCount: count }, "Expired rate-limit buckets removed");
  }

  return count;
};
