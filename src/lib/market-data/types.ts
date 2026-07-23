export type Timeframe =
  | "1m" | "3m" | "5m" | "10m" | "15m" | "30m" | "45m"
  | "1h" | "2h" | "4h" | "1D" | "1W" | "1M";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SymbolInfo {
  symbol: string;
  name: string;
  exchange: string;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  timestamp: number;
}

export interface DepthLevel { price: number; qty: number; }
export interface Depth { symbol: string; bids: DepthLevel[]; asks: DepthLevel[]; timestamp: number; }

export interface IndexData {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  advancers?: number;
  decliners?: number;
}

export interface CompanyInfo {
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  description?: string;
  website?: string;
}

export interface MarketDataProvider {
  name: string;
  searchSymbols(query: string): Promise<SymbolInfo[]>;
  getCandles(symbol: string, timeframe: Timeframe, limit?: number): Promise<Candle[]>;
  getQuote?(symbol: string): Promise<Quote>;
  getQuotes?(symbols: string[]): Promise<Record<string, Quote>>;
  getDepth?(symbol: string): Promise<Depth>;
  getIndex?(symbol: string): Promise<IndexData>;
  getCompany?(symbol: string): Promise<CompanyInfo>;
  /** Optional: server-side subscription for live quotes. Returns an unsubscribe fn. */
  subscribeQuotes?(symbols: string[], cb: (q: Quote) => void): () => void;
}


export class ProviderKeyMissing extends Error {
  constructor(public provider: string, public envVar: string) {
    super(`Market data provider "${provider}" requires ${envVar}`);
    this.name = "ProviderKeyMissing";
  }
}
