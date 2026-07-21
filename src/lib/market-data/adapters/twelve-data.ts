import type { Candle, MarketDataProvider, SymbolInfo, Timeframe } from "../types";
import { ProviderKeyMissing } from "../types";
import { getRateLimiter, withRetry } from "../rate-limit";

const TF_MAP: Partial<Record<Timeframe, string>> = {
  "1m": "1min", "5m": "5min", "15m": "15min", "30m": "30min",
  "45m": "45min", "1h": "1h", "2h": "2h", "4h": "4h",
  "1D": "1day", "1W": "1week", "1M": "1month",
};

export class TwelveDataAdapter implements MarketDataProvider {
  name = "twelve-data";
  private limiter = getRateLimiter("twelve-data", 8, 8);
  constructor(private apiKey: string) {
    if (!apiKey) throw new ProviderKeyMissing("twelve-data", "TWELVE_DATA_API_KEY");
  }
  async searchSymbols(query: string): Promise<SymbolInfo[]> {
    await this.limiter.acquire();
    const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&outputsize=10`;
    return withRetry(async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`TwelveData search ${res.status}`);
      const j = await res.json() as { data?: Array<{ symbol: string; instrument_name: string; exchange: string }> };
      return (j.data ?? []).map((r) => ({ symbol: r.symbol, name: r.instrument_name, exchange: r.exchange }));
    });
  }
  async getCandles(symbol: string, timeframe: Timeframe, limit = 300): Promise<Candle[]> {
    const interval = TF_MAP[timeframe];
    if (!interval) throw new Error(`TwelveData does not support timeframe ${timeframe}`);
    await this.limiter.acquire();
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${limit}&apikey=${this.apiKey}`;
    return withRetry(async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`TwelveData candles ${res.status}`);
      const j = await res.json() as { values?: Array<{ datetime: string; open: string; high: string; low: string; close: string; volume?: string }> };
      return (j.values ?? []).reverse().map((r) => ({
        time: Math.floor(new Date(r.datetime).getTime() / 1000),
        open: +r.open, high: +r.high, low: +r.low, close: +r.close, volume: +(r.volume ?? 0),
      }));
    });
  }
}
