import { Hono } from "hono";
import { authRoutes } from "../modules/auth/auth.route.js";
import { projectRoutes } from "../modules/projects/projects.route.js";
import type { AppEnv } from "../types/context.js";

export const apiRoutes = new Hono<AppEnv>();

apiRoutes.route("/auth", authRoutes);
apiRoutes.route("/projects", projectRoutes);
