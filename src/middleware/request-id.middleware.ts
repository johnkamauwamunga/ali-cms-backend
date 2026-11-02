import { randomUUID } from "node:crypto";
import type { MiddlewareHandler } from "hono";
import { z } from "zod";

const requestIdSchema = z.string().uuid();

export const requestIdMiddleware: MiddlewareHandler = async (
  context,
  next,
) => {
  const incomingRequestId = context.req.header("X-Request-ID");
  const parsedRequestId = incomingRequestId
    ? requestIdSchema.safeParse(incomingRequestId)
    : undefined;
  const requestId =
    parsedRequestId?.success === true ? parsedRequestId.data : randomUUID();

  context.header("X-Request-ID", requestId);
  await next();
};
