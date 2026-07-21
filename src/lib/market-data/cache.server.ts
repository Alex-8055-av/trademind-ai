/**
 * Server-side market data cache backed by public.market_cache.
 * Load dynamically from server handlers (not at module scope of client-reachable files).
 */
import type { Candle, Timeframe } from "./types";

const TTL_SECONDS: Record<Timeframe, number> = {
  "1m": 10, "3m": 20, "5m": 30, "10m": 45, "15m": 60,
  "30m": 90, "45m": 120, "1h": 300, "2h": 600, "4h": 1200,
  "1D": 3600, "1W": 21600, "1M": 86400,
};

export async function getCachedCandles(
  provider: string, symbol: string, timeframe: Timeframe,
): Promise<Candle[] | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("market_cache")
    .select("payload, expires_at")
    .eq("provider", provider).eq("symbol", symbol)
    .eq("timeframe", timeframe).eq("kind", "candles")
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return data.payload as unknown as Candle[];
}

export async function setCachedCandles(
  provider: string, symbol: string, timeframe: Timeframe, candles: Candle[],
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ttl = TTL_SECONDS[timeframe] ?? 60;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  await supabaseAdmin.from("market_cache").upsert({
    provider, symbol, timeframe, kind: "candles",
    payload: candles as unknown as never,
    fetched_at: new Date().toISOString(), expires_at: expiresAt,
  }, { onConflict: "provider,symbol,timeframe,kind" });
}

export async function cachedCandles(
  provider: string, symbol: string, timeframe: Timeframe,
  fetcher: () => Promise<Candle[]>,
): Promise<Candle[]> {
  const cached = await getCachedCandles(provider, symbol, timeframe);
  if (cached && cached.length > 0) return cached;
  const fresh = await fetcher();
  if (fresh.length > 0) await setCachedCandles(provider, symbol, timeframe, fresh);
  return fresh;
}
