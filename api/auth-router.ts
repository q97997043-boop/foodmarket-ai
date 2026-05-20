import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./trpc";
import { registerUser, loginUser } from "./lib/auth-service";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  restaurantName: z.string().min(2).max(120).optional(),
});

export const authRouter = router({
  register: publicProcedure
    .input(authSchema)
    .mutation(async ({ input }) => registerUser(input)),

  login: publicProcedure
    .input(authSchema.omit({ restaurantName: true }))
    .mutation(async ({ input }) => loginUser(input)),

  me: protectedProcedure.query(({ ctx }) => ctx.user),
});
