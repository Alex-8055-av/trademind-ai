import type { Candle, MarketDataProvider, Quote, SymbolInfo, Timeframe } from "./types";

const CATALOG: SymbolInfo[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE" },
  { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys", exchange: "NSE" },
  { symbol: "HDFCBANK", name: "HDFC Bank", exchange: "NSE" },
  { symbol: "NIFTY", name: "Nifty 50 Index", exchange: "NSE" },
  { symbol: "BANKNIFTY", name: "Bank Nifty Index", exchange: "NSE" },
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ" },
  { symbol: "BTCUSD", name: "Bitcoin / USD", exchange: "CRYPTO" },
  { symbol: "ETHUSD", name: "Ethereum / USD", exchange: "CRYPTO" },
];

const TF_SECONDS: Record<Timeframe, number> = {
  "1m": 60, "3m": 180, "5m": 300, "10m": 600, "15m": 900, "30m": 1800, "45m": 2700,
  "1h": 3600, "2h": 7200, "4h": 14400, "1D": 86400, "1W": 604800, "1M": 2592000,
};

// Deterministic pseudo-random so mock candles stay stable per symbol.
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function symbolSeed(symbol: string): number {
  let h = 2166136261;
  for (let i = 0; i < symbol.length; i++) {
    h ^= symbol.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function basePrice(symbol: string): number {
  if (symbol === "BTCUSD") return 98000;
  if (symbol === "ETHUSD") return 3400;
  if (symbol === "NIFTY") return 24500;
  if (symbol === "BANKNIFTY") return 52000;
  return 100 + (symbolSeed(symbol) % 900);
}

export class MockMarketDataProvider implements MarketDataProvider {
  name = "mock";

  async searchSymbols(query: string): Promise<SymbolInfo[]> {
    const q = query.trim().toUpperCase();
    if (!q) return CATALOG.slice(0, 8);
    return CATALOG.filter(
      (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q),
    );
  }

  async getCandles(symbol: string, timeframe: Timeframe, limit = 300): Promise<Candle[]> {
    const step = TF_SECONDS[timeframe];
    const rnd = seeded(symbolSeed(symbol) ^ (step * 7919));
    const now = Math.floor(Date.now() / 1000);
    const alignedNow = now - (now % step);

    let price = basePrice(symbol);
    const vol = price * 0.008; // per-candle volatility scale
    const candles: Candle[] = [];

    // Build oldest -> newest with a gentle trend + noise
    const trendBias = (rnd() - 0.5) * 0.0015;
    for (let i = limit - 1; i >= 0; i--) {
      const t = alignedNow - i * step;
      const drift = trendBias * price;
      const shock = (rnd() - 0.5) * 2 * vol;
      const open = price;
      const close = Math.max(0.01, open + drift + shock);
      const high = Math.max(open, close) + rnd() * vol * 0.8;
      const low = Math.min(open, close) - rnd() * vol * 0.8;
      const volume = Math.floor(50000 + rnd() * 500000);
      candles.push({ time: t, open, high, low, close, volume });
      price = close;
    }
    return candles;
  }

  async getQuote(symbol: string): Promise<Quote> {
    // Live-ish: adds a tiny time-dependent jitter so polling shows movement.
    const candles = await this.getCandles(symbol, "1m", 2);
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2] ?? last;
    const jitter = ((Date.now() / 1000) % 60) / 60 - 0.5;
    const price = last.close * (1 + jitter * 0.0008);
    const change = price - prev.close;
    return {
      symbol,
      price,
      change,
      changePct: prev.close ? (change / prev.close) * 100 : 0,
      volume: last.volume,
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  async getQuotes(symbols: string[]): Promise<Record<string, Quote>> {
    const out: Record<string, Quote> = {};
    await Promise.all(symbols.map(async (s) => { out[s] = await this.getQuote(s); }));
    return out;
  }
}

