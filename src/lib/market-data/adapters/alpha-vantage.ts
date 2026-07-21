import type { Candle, MarketDataProvider, SymbolInfo, Timeframe } from "../types";
import { ProviderKeyMissing } from "../types";
import { getRateLimiter, withRetry } from "../rate-limit";

export class AlphaVantageAdapter implements MarketDataProvider {
  name = "alpha-vantage";
  private limiter = getRateLimiter("alpha-vantage", 5, 0.1); // ~5/min free tier
  constructor(private apiKey: string) {
    if (!apiKey) throw new ProviderKeyMissing("alpha-vantage", "ALPHA_VANTAGE_API_KEY");
  }
  async searchSymbols(query: string): Promise<SymbolInfo[]> {
    await this.limiter.acquire();
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${this.apiKey}`;
    return withRetry(async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`AlphaVantage search ${res.status}`);
      const j = await res.json() as { bestMatches?: Array<Record<string, string>> };
      return (j.bestMatches ?? []).slice(0, 10).map((r) => ({
        symbol: r["1. symbol"], name: r["2. name"], exchange: r["4. region"],
      }));
    });
  }
  async getCandles(symbol: string, timeframe: Timeframe, limit = 300): Promise<Candle[]> {
    await this.limiter.acquire();
    const fn = timeframe === "1D" ? "TIME_SERIES_DAILY"
      : timeframe === "1W" ? "TIME_SERIES_WEEKLY"
      : timeframe === "1M" ? "TIME_SERIES_MONTHLY"
      : "TIME_SERIES_INTRADAY";
    const interval = timeframe === "1m" ? "1min"
      : timeframe === "5m" ? "5min" : timeframe === "15m" ? "15min"
      : timeframe === "30m" ? "30min" : "60min";
    const params = new URLSearchParams({ function: fn, symbol, apikey: this.apiKey, outputsize: "compact" });
    if (fn === "TIME_SERIES_INTRADAY") params.set("interval", interval);
    const url = `https://www.alphavantage.co/query?${params}`;
    return withRetry(async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`AlphaVantage candles ${res.status}`);
      const j = await res.json() as Record<string, unknown>;
      const seriesKey = Object.keys(j).find((k) => k.toLowerCase().includes("time series"));
      if (!seriesKey) return [];
      const series = j[seriesKey] as Record<string, Record<string, string>>;
      return Object.entries(series).slice(0, limit).map(([t, v]) => ({
        time: Math.floor(new Date(t).getTime() / 1000),
        open: +v["1. open"], high: +v["2. high"], low: +v["3. low"],
        close: +v["4. close"], volume: +(v["5. volume"] ?? 0),
      })).reverse();
    });
  }
}
