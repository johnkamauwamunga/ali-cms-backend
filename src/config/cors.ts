import { cors } from "hono/cors";
import { env } from "./env.js";

const allowedOrigin = new URL(env.FRONTEND_URL).origin;

export const corsMiddleware = cors({
  origin: (origin) => (origin === allowedOrigin ? origin : null),
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  exposeHeaders: ["X-Request-ID"],
  credentials: true,
  maxAge: 600,
});
