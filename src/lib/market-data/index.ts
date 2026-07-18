import { MockMarketDataProvider } from "./mock-provider";
import type { MarketDataProvider } from "./types";

let cached: MarketDataProvider | null = null;

/**
 * Returns the active market data provider. Swap this factory to add
 * Polygon.io, Twelve Data, Alpha Vantage, Finnhub, or NSE/BSE feeds
 * without touching UI or AI code — the MarketDataProvider interface
 * is the only contract the rest of the app depends on.
 */
export function getMarketDataProvider(): MarketDataProvider {
  if (!cached) cached = new MockMarketDataProvider();
  return cached;
}

export * from "./types";
