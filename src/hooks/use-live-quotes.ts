import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { fetchQuotes } from "@/lib/market-data/quotes.functions";
import type { Quote } from "@/lib/market-data/types";

/**
 * Subscribe to live quotes for a set of symbols. Polls the server every
 * `intervalMs` (default 5s) to approximate WebSocket streaming while keeping
 * provider keys server-side. Empty symbol lists are a no-op.
 */
export function useLiveQuotes(symbols: string[], intervalMs = 5000) {
  const fn = useServerFn(fetchQuotes);
  const key = useMemo(() => Array.from(new Set(symbols)).sort(), [symbols]);
  const query = useQuery({
    queryKey: ["live-quotes", key],
    queryFn: () => fn({ data: { symbols: key } }),
    enabled: key.length > 0,
    refetchInterval: intervalMs,
    refetchIntervalInBackground: false,
    staleTime: intervalMs / 2,
  });
  const quotes: Record<string, Quote> = query.data?.quotes ?? {};
  return { quotes, isLoading: query.isLoading, provider: query.data?.provider };
}

export function useLiveQuote(symbol: string | null | undefined, intervalMs = 5000) {
  const list = useMemo(() => (symbol ? [symbol] : []), [symbol]);
  const { quotes, isLoading, provider } = useLiveQuotes(list, intervalMs);
  return { quote: symbol ? quotes[symbol] : undefined, isLoading, provider };
}
