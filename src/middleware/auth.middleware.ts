import { errors as joseErrors } from "jose";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { getAdminById } from "../modules/auth/auth.service.js";
import { verifyAccessToken } from "../lib/tokens.js";
import type { AppEnv } from "../types/context.js";

const authenticationRequired = (): HTTPException =>
  new HTTPException(401, { message: "Authentication required" });

const verifyToken = async (token: string): Promise<{ adminId: string }> => {
  try {
    return await verifyAccessToken(token);
  } catch (error) {
    if (
      error instanceof joseErrors.JOSEError ||
      (error instanceof Error &&
        error.message === "Invalid authentication token")
    ) {
      throw authenticationRequired();
    }

    throw error;
  }
};

export const authMiddleware: MiddlewareHandler<AppEnv> = async (
  context,
  next,
) => {
  const authorization = context.req.header("Authorization");
  const match = authorization
    ? /^Bearer\s+([^\s]+)$/i.exec(authorization)
    : undefined;

  if (!match) {
    throw authenticationRequired();
  }

  const { adminId } = await verifyToken(match[1]);
  const admin = await getAdminById(adminId);

  if (!admin || !admin.isActive) {
    throw authenticationRequired();
  }

  context.set("adminId", admin.id);
  await next();
};
