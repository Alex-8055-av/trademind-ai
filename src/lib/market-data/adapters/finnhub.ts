import type { Candle, MarketDataProvider, SymbolInfo, Timeframe } from "../types";
import { ProviderKeyMissing } from "../types";
import { getRateLimiter, withRetry } from "../rate-limit";

const TF_MAP: Partial<Record<Timeframe, string>> = {
  "1m": "1", "5m": "5", "15m": "15", "30m": "30",
  "1h": "60", "1D": "D", "1W": "W", "1M": "M",
};

export class FinnhubAdapter implements MarketDataProvider {
  name = "finnhub";
  private limiter = getRateLimiter("finnhub", 30, 30);
  constructor(private apiKey: string) {
    if (!apiKey) throw new ProviderKeyMissing("finnhub", "FINNHUB_API_KEY");
  }
  async searchSymbols(query: string): Promise<SymbolInfo[]> {
    await this.limiter.acquire();
    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${this.apiKey}`;
    return withRetry(async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Finnhub search ${res.status}`);
      const j = await res.json() as { result?: Array<{ symbol: string; description: string; type: string }> };
      return (j.result ?? []).slice(0, 10).map((r) => ({ symbol: r.symbol, name: r.description, exchange: r.type }));
    });
  }
  async getCandles(symbol: string, timeframe: Timeframe, limit = 300): Promise<Candle[]> {
    const res = TF_MAP[timeframe];
    if (!res) throw new Error(`Finnhub does not support timeframe ${timeframe}`);
    await this.limiter.acquire();
    const to = Math.floor(Date.now() / 1000);
    const from = to - limit * 3600;
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${res}&from=${from}&to=${to}&token=${this.apiKey}`;
    return withRetry(async () => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Finnhub candles ${r.status}`);
      const j = await r.json() as { s?: string; t?: number[]; o?: number[]; h?: number[]; l?: number[]; c?: number[]; v?: number[] };
      if (j.s !== "ok" || !j.t) return [];
      return j.t.map((t, i) => ({
        time: t, open: j.o![i], high: j.h![i], low: j.l![i], close: j.c![i], volume: j.v?.[i] ?? 0,
      }));
    });
  }
}
