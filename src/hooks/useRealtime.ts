/**
 * src/hooks/useRealtime.ts
 *
 * Base hook that subscribes to the "event" channel on the socket and calls
 * a typed handler only when the event type matches.
 *
 * All feature-specific hooks (useOrderFeed, usePriceTicker, etc.) are built
 * on top of this.
 *
 * Usage:
 *   useRealtime(RT.PRICE_UPDATED, (payload) => { ... }, [deps]);
 */

import { useEffect, useRef } from "react";
import { getSocket } from "@/realtime/client";
import type { RealtimeEvent, RTEventName } from "@/realtime/types";

type ExtractPayload<E extends RTEventName, T extends RealtimeEvent> =
  T extends { type: E; payload: infer P } ? P : never;

export function useRealtime<E extends RTEventName>(
  eventType: E,
  handler: (payload: ExtractPayload<E, RealtimeEvent>) => void,
  deps: React.DependencyList = [],
): void {
  // Stable ref to the handler so we don't re-register on every render.
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();

    function onEvent(event: RealtimeEvent) {
      if (event.type === eventType) {
        handlerRef.current(event.payload as ExtractPayload<E, RealtimeEvent>);
      }
    }

    socket.on("event", onEvent);

    return () => {
      socket.off("event", onEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, ...deps]);
}
