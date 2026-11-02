import type { HttpBindings } from "@hono/node-server";

export type AppEnv = {
  Bindings: HttpBindings;
  Variables: {
    adminId: string;
  };
};
