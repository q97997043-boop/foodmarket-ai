import { router, protectedProcedure } from "./trpc";

export const createRouter = router;
export const authedQuery = protectedProcedure;
