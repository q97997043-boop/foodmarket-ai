import { trpc } from "@/lib/trpc";
import { useRestaurant } from "@/providers/RestaurantProvider";
import { useRealtimeMarket } from "./useRealtimeMarket";

export function useMarketData(selectedProductId?: string | null) {
  const { restaurantId, legacyId, restaurant } = useRestaurant();

  const snapshot = trpc.market.getSnapshot.useQuery(
    { restaurantId: restaurantId! },
    { enabled: !!restaurantId, refetchInterval: 15_000 },
  );

  const chart = trpc.market.getChartData.useQuery(
    {
      restaurantId: restaurantId!,
      productId: selectedProductId ?? undefined,
      hours: 24,
    },
    { enabled: !!restaurantId, refetchInterval: 20_000 },
  );

  const realtime = useRealtimeMarket(legacyId);

  return {
    restaurant,
    restaurantId,
    legacyId,
    snapshot: snapshot.data,
    chartSeries: chart.data?.series ?? [],
    isLoading: snapshot.isLoading,
    refetch: snapshot.refetch,
    realtime,
  };
}
