export type Timeframe =
  | "1m" | "3m" | "5m" | "10m" | "15m" | "30m" | "45m"
  | "1h" | "2h" | "4h" | "1D" | "1W" | "1M";

export interface Candle {
  time: number; // unix seconds
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

export interface MarketDataProvider {
  name: string;
  searchSymbols(query: string): Promise<SymbolInfo[]>;
  getCandles(symbol: string, timeframe: Timeframe, limit?: number): Promise<Candle[]>;
}
