import type { Candle, MarketDataProvider, SymbolInfo, Timeframe } from "../types";
import { ProviderKeyMissing } from "../types";
import { getRateLimiter, withRetry } from "../rate-limit";

const TF_MAP: Partial<Record<Timeframe, { mult: number; span: string }>> = {
  "1m": { mult: 1, span: "minute" }, "5m": { mult: 5, span: "minute" },
  "15m": { mult: 15, span: "minute" }, "30m": { mult: 30, span: "minute" },
  "1h": { mult: 1, span: "hour" }, "4h": { mult: 4, span: "hour" },
  "1D": { mult: 1, span: "day" }, "1W": { mult: 1, span: "week" }, "1M": { mult: 1, span: "month" },
};

export class PolygonAdapter implements MarketDataProvider {
  name = "polygon";
  private limiter = getRateLimiter("polygon", 5, 4);
  constructor(private apiKey: string) {
    if (!apiKey) throw new ProviderKeyMissing("polygon", "POLYGON_API_KEY");
  }
  async searchSymbols(query: string): Promise<SymbolInfo[]> {
    await this.limiter.acquire();
    const url = `https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(query)}&limit=10&apiKey=${this.apiKey}`;
    return withRetry(async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Polygon search ${res.status}`);
      const j = await res.json() as { results?: Array<{ ticker: string; name: string; primary_exchange?: string }> };
      return (j.results ?? []).map((r) => ({ symbol: r.ticker, name: r.name, exchange: r.primary_exchange ?? "US" }));
    });
  }
  async getCandles(symbol: string, timeframe: Timeframe, limit = 300): Promise<Candle[]> {
    const tf = TF_MAP[timeframe];
    if (!tf) throw new Error(`Polygon does not support timeframe ${timeframe}`);
    await this.limiter.acquire();
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 400 * 86400_000).toISOString().slice(0, 10);
    const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/${tf.mult}/${tf.span}/${from}/${to}?adjusted=true&sort=asc&limit=${limit}&apiKey=${this.apiKey}`;
    return withRetry(async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Polygon candles ${res.status}`);
      const j = await res.json() as { results?: Array<{ t: number; o: number; h: number; l: number; c: number; v: number }> };
      return (j.results ?? []).map((r) => ({ time: Math.floor(r.t / 1000), open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v }));
    });
  }
}
