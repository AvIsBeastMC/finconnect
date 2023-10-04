import { authRouter } from "./router/auth";
import { generalRouter } from "./router/general";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  general: generalRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
