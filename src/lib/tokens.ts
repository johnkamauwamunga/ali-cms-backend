import { createHash, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.js";

const issuer = "ali-api";
const audience = "ali-api-admin";
const accessKey = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshKey = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

type TokenType = "access" | "refresh";

const createToken = async (
  adminId: string,
  tokenType: TokenType,
  secret: Uint8Array,
  expiresIn: string,
  tokenId?: string,
): Promise<string> => {
  const token = new SignJWT({ tokenType })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime(expiresIn);

  if (tokenId) {
    token.setJti(tokenId);
  }

  return token.sign(secret);
};

const verifyToken = async (
  token: string,
  expectedType: TokenType,
  secret: Uint8Array,
): Promise<
  | { adminId: string }
  | {
      adminId: string;
      tokenId: string;
    }
> => {
  const { payload } = await jwtVerify(token, secret, {
    issuer,
    audience,
    algorithms: ["HS256"],
  });

  if (payload.tokenType !== expectedType || typeof payload.sub !== "string") {
    throw new Error("Invalid authentication token");
  }

  if (expectedType === "refresh") {
    if (typeof payload.jti !== "string") {
      throw new Error("Invalid refresh token");
    }

    return {
      adminId: payload.sub,
      tokenId: payload.jti,
    };
  }

  return { adminId: payload.sub };
};

export const createAccessToken = (adminId: string): Promise<string> =>
  createToken(
    adminId,
    "access",
    accessKey,
    env.ACCESS_TOKEN_EXPIRES_IN,
  );

export const createRefreshToken = async (
  adminId: string,
): Promise<{ token: string; tokenId: string }> => {
  const tokenId = randomUUID();
  const token = await createToken(
    adminId,
    "refresh",
    refreshKey,
    env.REFRESH_TOKEN_EXPIRES_IN,
    tokenId,
  );

  return { token, tokenId };
};

export const verifyAccessToken = async (
  token: string,
): Promise<{ adminId: string }> => {
  const payload = await verifyToken(token, "access", accessKey);

  return { adminId: payload.adminId };
};

export const verifyRefreshToken = async (
  token: string,
): Promise<{ adminId: string; tokenId: string }> => {
  const payload = await verifyToken(token, "refresh", refreshKey);

  if (!("tokenId" in payload)) {
    throw new Error("Invalid refresh token");
  }

  return payload;
};

export const hashRefreshToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");
