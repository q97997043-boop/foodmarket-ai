import { prisma } from "../prisma-client";

export async function nextLegacyRestaurantId(): Promise<number> {
  const agg = await prisma.restaurant.aggregate({ _max: { legacyId: true } });
  return (agg._max.legacyId ?? 0) + 1;
}

export async function nextOrderNumber(restaurantId: string): Promise<number> {
  const agg = await prisma.order.aggregate({
    where: { restaurantId },
    _max: { orderNumber: true },
  });
  return (agg._max.orderNumber ?? 1000) + 1;
}
