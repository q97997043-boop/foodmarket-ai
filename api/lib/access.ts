import { TRPCError } from "@trpc/server";

type AuthUser = {
  id: string;
  email: string;
  role: string;
  restaurantId: string | null;
};

export function requireRestaurantId(user: AuthUser): string {
  if (!user.restaurantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No restaurant linked to this account",
    });
  }
  return user.restaurantId;
}

export function assertRestaurantAccess(
  restaurantId: string,
  user: AuthUser,
): void {
  if (!user.restaurantId || user.restaurantId !== restaurantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this restaurant",
    });
  }
}
