import { prisma } from "../prisma-client";
import { runAiPricingTick } from "./ai-pricing";

let started = false;
let ticking = false;

export function startMarketEngine() {
  if (started) return;
  started = true;

  const tick = async () => {
    if (ticking) return;
    ticking = true;
    try {
      const restaurants = await prisma.restaurant.findMany({
        where: { isActive: true },
        select: { id: true, legacyId: true },
      });
      for (const r of restaurants) {
        await runAiPricingTick(r.id, r.legacyId);
      }
    } catch (err) {
      console.error("[market-engine] tick failed", err);
    } finally {
      ticking = false;
    }
  };

  void tick();
  setInterval(() => void tick(), 5_000);
  console.log("[market-engine] AI pricing loop started (5s interval)");
}
