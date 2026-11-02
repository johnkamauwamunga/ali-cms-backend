import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { env } from "../../config/env.js";
import { successResponse } from "../../lib/response.js";
import type { AppEnv } from "../../types/context.js";
import {
  changePassword as changePasswordService,
  createInitialAdmin,
  getAdminById,
  listSecurityQuestions,
  login as loginService,
  logout as logoutService,
  refreshSession,
  updateSecurityQuestion,
  type AuthSession,
} from "./auth.service.js";
import type {
  ChangePasswordInput,
  InitialSetupInput,
  LoginInput,
  SecurityQuestionUpdateInput,
} from "./auth.schema.js";

const refreshCookieName = "refresh_token";
const frontendOrigin = new URL(env.FRONTEND_URL).origin;
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? ("None" as const) : ("Lax" as const),
  path: "/api/v1/auth",
};

const durationToSeconds = (duration: string): number => {
  const match = /^([1-9]\d*)([smhd])$/.exec(duration);

  if (!match) {
    throw new Error("Invalid refresh token lifetime configuration");
  }

  const amount = Number(match[1]);
  let multiplier: number;

  switch (match[2]) {
    case "s":
      multiplier = 1;
      break;
    case "m":
      multiplier = 60;
      break;
    case "h":
      multiplier = 3_600;
      break;
    case "d":
      multiplier = 86_400;
      break;
    default:
      throw new Error("Invalid refresh token lifetime configuration");
  }

  const seconds = amount * multiplier;

  if (!Number.isSafeInteger(seconds)) {
    throw new Error("Refresh token lifetime exceeds the supported range");
  }

  return seconds;
};

const setRefreshCookie = (context: Context<AppEnv>, token: string): void => {
  setCookie(context, refreshCookieName, token, {
    ...refreshCookieOptions,
    maxAge: durationToSeconds(env.REFRESH_TOKEN_EXPIRES_IN),
  });
};

const clearRefreshCookie = (context: Context<AppEnv>): void => {
  deleteCookie(context, refreshCookieName, refreshCookieOptions);
};

const preventCaching = (context: Context<AppEnv>): void => {
  context.header("Cache-Control", "no-store");
};

const assertTrustedOrigin = (context: Context<AppEnv>): void => {
  const origin = context.req.header("Origin");

  if (origin && origin !== frontendOrigin) {
    throw new HTTPException(403, { message: "Origin is not allowed" });
  }
};

const sessionResponse = (session: AuthSession) => ({
  admin: session.admin,
  accessToken: session.accessToken,
  accessTokenExpiresIn: session.accessTokenExpiresIn,
});

export const setupController = async (
  context: Context<AppEnv>,
  input: InitialSetupInput,
) => {
  const admin = await createInitialAdmin(input);
  preventCaching(context);

  return context.json(
    successResponse("Administrator created successfully", admin),
    201,
  );
};

export const loginController = async (
  context: Context<AppEnv>,
  input: LoginInput,
) => {
  const session = await loginService(input, {
    userAgent: context.req.header("User-Agent"),
  });
  setRefreshCookie(context, session.refreshToken);
  preventCaching(context);

  return context.json(
    successResponse("Login successful", sessionResponse(session)),
  );
};

export const refreshController = async (context: Context<AppEnv>) => {
  assertTrustedOrigin(context);

  const refreshToken = getCookie(context, refreshCookieName);

  if (!refreshToken) {
    throw new HTTPException(401, {
      message: "Invalid or expired refresh token",
    });
  }

  const session = await refreshSession(refreshToken, {
    userAgent: context.req.header("User-Agent"),
  });
  setRefreshCookie(context, session.refreshToken);
  preventCaching(context);

  return context.json(
    successResponse("Session refreshed successfully", sessionResponse(session)),
  );
};

export const logoutController = async (context: Context<AppEnv>) => {
  assertTrustedOrigin(context);
  await logoutService(getCookie(context, refreshCookieName));
  clearRefreshCookie(context);
  preventCaching(context);

  return context.json(successResponse("Logged out successfully", null));
};

export const meController = async (context: Context<AppEnv>) => {
  const admin = await getAdminById(context.get("adminId"));

  if (!admin || !admin.isActive) {
    throw new HTTPException(401, { message: "Authentication required" });
  }

  preventCaching(context);

  return context.json(successResponse("Administrator retrieved successfully", admin));
};

export const changePasswordController = async (
  context: Context<AppEnv>,
  input: ChangePasswordInput,
) => {
  await changePasswordService(context.get("adminId"), input);
  clearRefreshCookie(context);
  preventCaching(context);

  return context.json(successResponse("Password changed successfully", null));
};

export const securityQuestionsController = async (
  context: Context<AppEnv>,
) => {
  const questions = await listSecurityQuestions();

  return context.json(
    successResponse("Security questions retrieved successfully", questions),
  );
};

export const updateSecurityQuestionController = async (
  context: Context<AppEnv>,
  input: SecurityQuestionUpdateInput,
) => {
  await updateSecurityQuestion(context.get("adminId"), input);
  preventCaching(context);

  return context.json(
    successResponse("Security question updated successfully", null),
  );
};
