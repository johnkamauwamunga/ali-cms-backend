import "dotenv/config";
import { z } from "zod";

const secretSchema = z
  .string()
  .min(32, "Must contain at least 32 characters")
  .refine((value) => !value.toLowerCase().startsWith("replace-with-"), {
    message: "Replace the example value with a unique secret",
  });

const tokenLifetimeSchema = z
  .string()
  .regex(/^[1-9]\d*[smhd]$/, "Must be a positive duration such as 15m or 7d");

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z
      .string()
      .url()
      .refine((value) => value.startsWith("mysql://"), {
        message: "Must be a MySQL connection URL",
      }),
    JWT_ACCESS_SECRET: secretSchema,
    JWT_REFRESH_SECRET: secretSchema,
    ACCESS_TOKEN_EXPIRES_IN: tokenLifetimeSchema.default("15m"),
    REFRESH_TOKEN_EXPIRES_IN: tokenLifetimeSchema.default("7d"),
    FRONTEND_URL: z.string().url(),
  })
  .superRefine((values, context) => {
    if (values.JWT_ACCESS_SECRET === values.JWT_REFRESH_SECRET) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_REFRESH_SECRET"],
        message: "Must differ from JWT_ACCESS_SECRET",
      });
    }
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues
    .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = result.data;
export type Environment = z.infer<typeof envSchema>;
