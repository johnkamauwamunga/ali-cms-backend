import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { rateLimitMiddleware } from "../../middleware/rate-limit.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import type { AppEnv } from "../../types/context.js";
import {
  changePasswordController,
  loginController,
  logoutController,
  meController,
  refreshController,
  securityQuestionsController,
  setupController,
  updateSecurityQuestionController,
} from "./auth.controller.js";
import {
  changePasswordSchema,
  initialSetupSchema,
  loginSchema,
  securityQuestionUpdateSchema,
} from "./auth.schema.js";

const refreshCookieSchema = z.object({
  refresh_token: z.string().min(1).max(8192),
});

const logoutCookieSchema = z.object({
  refresh_token: z.string().min(1).max(8192).optional(),
});

export const authRoutes = new Hono<AppEnv>();

authRoutes.post(
  "/setup",
  rateLimitMiddleware({
    scope: "auth:setup",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  }),
  validate("json", initialSetupSchema),
  (context) => setupController(context, context.req.valid("json")),
);

authRoutes.post(
  "/login",
  rateLimitMiddleware({
    scope: "auth:login",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  }),
  validate("json", loginSchema),
  (context) => loginController(context, context.req.valid("json")),
);

authRoutes.post(
  "/refresh",
  rateLimitMiddleware({
    scope: "auth:refresh",
    limit: 60,
    windowMs: 60 * 1000,
  }),
  validate("cookie", refreshCookieSchema),
  refreshController,
);

authRoutes.post(
  "/logout",
  validate("cookie", logoutCookieSchema),
  logoutController,
);

authRoutes.get("/me", authMiddleware, meController);

authRoutes.post(
  "/change-password",
  authMiddleware,
  validate("json", changePasswordSchema),
  (context) =>
    changePasswordController(context, context.req.valid("json")),
);

authRoutes.get("/security-questions", securityQuestionsController);

authRoutes.put(
  "/security-question",
  authMiddleware,
  validate("json", securityQuestionUpdateSchema),
  (context) =>
    updateSecurityQuestionController(context, context.req.valid("json")),
);
