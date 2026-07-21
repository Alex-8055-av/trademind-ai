import { MockMarketDataProvider } from "./mock-provider";
import type { Candle, MarketDataProvider, Timeframe } from "./types";
import { ProviderKeyMissing } from "./types";

/**
 * Returns the active market data provider based on the MARKET_DATA_PROVIDER
 * env variable. Falls back to mock if the selected provider is missing its
 * API key. Safe to call from server function handlers.
 *
 * Providers: mock | polygon | twelve-data | finnhub | alpha-vantage
 */
export async function getMarketDataProvider(): Promise<MarketDataProvider> {
  const requested = (typeof process !== "undefined" ? process.env?.MARKET_DATA_PROVIDER : undefined) ?? "mock";
  try {
    switch (requested) {
      case "polygon": {
        const { PolygonAdapter } = await import("./adapters/polygon");
        return new PolygonAdapter(process.env.POLYGON_API_KEY ?? "");
      }
      case "twelve-data": {
        const { TwelveDataAdapter } = await import("./adapters/twelve-data");
        return new TwelveDataAdapter(process.env.TWELVE_DATA_API_KEY ?? "");
      }
      case "finnhub": {
        const { FinnhubAdapter } = await import("./adapters/finnhub");
        return new FinnhubAdapter(process.env.FINNHUB_API_KEY ?? "");
      }
      case "alpha-vantage": {
        const { AlphaVantageAdapter } = await import("./adapters/alpha-vantage");
        return new AlphaVantageAdapter(process.env.ALPHA_VANTAGE_API_KEY ?? "");
      }
      case "mock":
      default:
        return new MockMarketDataProvider();
    }
  } catch (err) {
    if (err instanceof ProviderKeyMissing) {
      console.warn(`[market-data] ${err.message} — falling back to mock`);
      return new MockMarketDataProvider();
    }
    throw err;
  }
}

/**
 * Fetch candles through the active provider with server-side caching.
 * Server-only: dynamically imports the cache module (uses supabaseAdmin).
 */
export async function fetchCandlesCached(symbol: string, timeframe: Timeframe, limit = 300): Promise<Candle[]> {
  const provider = await getMarketDataProvider();
  if (provider.name === "mock") return provider.getCandles(symbol, timeframe, limit);
  const { cachedCandles } = await import("./cache.server");
  return cachedCandles(provider.name, symbol, timeframe, () => provider.getCandles(symbol, timeframe, limit));
}

export * from "./types";
