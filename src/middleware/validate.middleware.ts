import { validator } from "hono/validator";
import { z } from "zod";
import { errorResponse } from "../lib/response.js";

type ValidationTarget = "cookie" | "json" | "param" | "query";

export const validate = <
  Target extends ValidationTarget,
  Schema extends z.ZodTypeAny,
>(
  target: Target,
  schema: Schema,
) =>
  validator(target, async (value, context) => {
    const result = await schema.safeParseAsync(value);

    if (!result.success) {
      return context.json(
        errorResponse(
          "Validation failed",
          result.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        ),
        400,
      );
    }

    return result.data;
  });
