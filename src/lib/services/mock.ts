// Deterministic mock data services for the TradeMind AI workstation.
// Swap each factory with a live provider (NSE / Polygon / Twelve Data / broker API)
// without touching UI code — every export is a pure typed function.

function seed(str: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  let s = h >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

export const UNIVERSE = [
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", price: 2870, cap: 19_50_000 },
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT", price: 4120, cap: 15_20_000 },
  { symbol: "INFY", name: "Infosys", sector: "IT", price: 1580, cap: 6_60_000 },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", price: 1720, cap: 13_10_000 },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking", price: 1210, cap: 8_50_000 },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking", price: 820, cap: 7_30_000 },
  { symbol: "AXISBANK", name: "Axis Bank", sector: "Banking", price: 1170, cap: 3_60_000 },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Banking", price: 1780, cap: 3_50_000 },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecom", price: 1620, cap: 9_20_000 },
  { symbol: "ITC", name: "ITC Ltd", sector: "FMCG", price: 470, cap: 5_90_000 },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", sector: "FMCG", price: 2510, cap: 5_90_000 },
  { symbol: "NESTLEIND", name: "Nestle India", sector: "FMCG", price: 2360, cap: 2_30_000 },
  { symbol: "MARUTI", name: "Maruti Suzuki", sector: "Auto", price: 12_400, cap: 3_90_000 },
  { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Auto", price: 780, cap: 2_80_000 },
  { symbol: "M&M", name: "Mahindra & Mahindra", sector: "Auto", price: 2870, cap: 3_50_000 },
  { symbol: "SUNPHARMA", name: "Sun Pharma", sector: "Pharma", price: 1720, cap: 4_10_000 },
  { symbol: "DRREDDY", name: "Dr Reddy's Labs", sector: "Pharma", price: 1290, cap: 1_10_000 },
  { symbol: "CIPLA", name: "Cipla", sector: "Pharma", price: 1520, cap: 1_20_000 },
  { symbol: "LT", name: "Larsen & Toubro", sector: "Infra", price: 3620, cap: 4_90_000 },
  { symbol: "ADANIENT", name: "Adani Enterprises", sector: "Infra", price: 2450, cap: 2_80_000 },
  { symbol: "TATASTEEL", name: "Tata Steel", sector: "Metals", price: 152, cap: 1_90_000 },
  { symbol: "JSWSTEEL", name: "JSW Steel", sector: "Metals", price: 940, cap: 2_30_000 },
  { symbol: "COALINDIA", name: "Coal India", sector: "Energy", price: 420, cap: 2_60_000 },
  { symbol: "ONGC", name: "ONGC", sector: "Energy", price: 265, cap: 3_30_000 },
  { symbol: "POWERGRID", name: "Power Grid Corp", sector: "Utilities", price: 320, cap: 2_90_000 },
  { symbol: "NTPC", name: "NTPC", sector: "Utilities", price: 355, cap: 3_40_000 },
  { symbol: "WIPRO", name: "Wipro", sector: "IT", price: 540, cap: 2_80_000 },
  { symbol: "HCLTECH", name: "HCL Technologies", sector: "IT", price: 1720, cap: 4_60_000 },
  { symbol: "TITAN", name: "Titan Company", sector: "Consumer", price: 3450, cap: 3_00_000 },
  { symbol: "ASIANPAINT", name: "Asian Paints", sector: "Consumer", price: 2870, cap: 2_70_000 },
];

export const SECTORS = Array.from(new Set(UNIVERSE.map((s) => s.sector)));

export type ScannerType =
  | "intraday" | "swing" | "positional" | "breakout" | "reversal" | "momentum"
  | "volume" | "gap_up" | "gap_down" | "smart_money" | "ict" | "trend"
  | "delivery" | "high_rvol";

export const SCANNER_LABELS: Record<ScannerType, string> = {
  intraday: "Intraday", swing: "Swing", positional: "Positional",
  breakout: "Breakout", reversal: "Reversal", momentum: "Momentum",
  volume: "Volume", gap_up: "Gap Up", gap_down: "Gap Down",
  smart_money: "Smart Money", ict: "ICT", trend: "Trend",
  delivery: "Delivery Volume", high_rvol: "High Relative Volume",
};

export interface ScannerRow {
  symbol: string; name: string; sector: string;
  price: number; changePct: number; rvol: number; rsi: number;
  aiScore: number; signal: string;
}

export function runScanner(type: ScannerType, extraFilters?: { sector?: string }): ScannerRow[] {
  const rnd = seed(type);
  return UNIVERSE
    .filter((s) => !extraFilters?.sector || s.sector === extraFilters.sector)
    .map((s) => {
      const r = rnd();
      const changePct = (r - 0.5) * (type === "gap_up" ? 8 : type === "gap_down" ? -8 : 6);
      const rvol = 0.8 + rnd() * 4;
      const rsi = 20 + rnd() * 60;
      const aiScore = Math.round((rnd() * 4 + 6) * 10) / 10;
      const signal = pickSignal(type, changePct, rsi, rvol);
      return { symbol: s.symbol, name: s.name, sector: s.sector, price: s.price, changePct: +changePct.toFixed(2), rvol: +rvol.toFixed(2), rsi: +rsi.toFixed(1), aiScore, signal };
    })
    .sort((a, b) => b.aiScore - a.aiScore);
}

function pickSignal(type: ScannerType, chg: number, rsi: number, rvol: number): string {
  if (type === "smart_money") return rvol > 2 ? "Institutional accumulation" : "Order block formed";
  if (type === "ict") return chg > 0 ? "BOS + FVG bullish" : "CHOCH bearish, liquidity sweep";
  if (type === "breakout") return "Range high broken on volume";
  if (type === "reversal") return rsi < 35 ? "Oversold reversal" : "Overbought reversal";
  if (type === "gap_up") return "Gap up, holding above VWAP";
  if (type === "gap_down") return "Gap down, below VWAP";
  if (type === "momentum") return "Momentum surge";
  if (type === "trend") return chg > 0 ? "Uptrend, EMA stacked" : "Downtrend, EMA stacked";
  if (type === "volume") return "Volume spike";
  if (type === "high_rvol") return `RVOL ${rvol.toFixed(1)}x`;
  if (type === "delivery") return "Delivery > 60%";
  return "Setup forming";
}

// ---------- Heatmap ----------
export interface HeatTile { symbol: string; name: string; sector: string; changePct: number; cap: number }
export function getHeatmap(kind: "nifty" | "banknifty" | "sensex" | "sector" | "cap"): HeatTile[] {
  const rnd = seed("heatmap-" + kind);
  const base = kind === "banknifty" ? UNIVERSE.filter((s) => s.sector === "Banking") : UNIVERSE;
  return base.map((s) => ({ symbol: s.symbol, name: s.name, sector: s.sector, cap: s.cap, changePct: +(((rnd() - 0.5) * 6)).toFixed(2) }));
}

// ---------- Sector analysis ----------
export interface SectorStat { sector: string; changePct: number; momentum: number; strength: number; flow: number }
export function getSectorStats(): SectorStat[] {
  const rnd = seed("sectors");
  return SECTORS.map((sector) => ({
    sector,
    changePct: +(((rnd() - 0.5) * 5)).toFixed(2),
    momentum: +((rnd() * 100)).toFixed(0),
    strength: +((rnd() * 100)).toFixed(0),
    flow: +(((rnd() - 0.4) * 2000)).toFixed(0),
  })).sort((a, b) => b.changePct - a.changePct);
}

// ---------- Market breadth ----------
export function getMarketBreadth() {
  const rnd = seed("breadth-" + new Date().toDateString());
  const advances = Math.round(1200 + rnd() * 800);
  const declines = Math.round(800 + rnd() * 800);
  const unchanged = Math.round(80 + rnd() * 60);
  const newHighs = Math.round(40 + rnd() * 120);
  const newLows = Math.round(20 + rnd() * 80);
  return {
    advances, declines, unchanged, newHighs, newLows,
    ratio: +(advances / Math.max(declines, 1)).toFixed(2),
    strength: Math.round((advances / (advances + declines)) * 100),
    series: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, ad: Math.round(500 + rnd() * 1500) })),
  };
}

// ---------- Options ----------
export interface OptionRow { strike: number; ceOI: number; ceChgOI: number; ceLtp: number; peOI: number; peChgOI: number; peLtp: number; ceIv: number; peIv: number }
export function getOptionChain(symbol: string, expiry: string) {
  const rnd = seed("oc-" + symbol + expiry);
  const spot = UNIVERSE.find((s) => s.symbol === symbol)?.price ?? 24500;
  const step = spot > 5000 ? 100 : 50;
  const atm = Math.round(spot / step) * step;
  const rows: OptionRow[] = [];
  for (let i = -10; i <= 10; i++) {
    const strike = atm + i * step;
    rows.push({
      strike,
      ceOI: Math.round(50000 + rnd() * 400000),
      ceChgOI: Math.round((rnd() - 0.5) * 200000),
      ceLtp: Math.max(0.5, +((spot - strike + 30 + rnd() * 40)).toFixed(2)),
      peOI: Math.round(50000 + rnd() * 400000),
      peChgOI: Math.round((rnd() - 0.5) * 200000),
      peLtp: Math.max(0.5, +((strike - spot + 30 + rnd() * 40)).toFixed(2)),
      ceIv: +(15 + rnd() * 25).toFixed(1),
      peIv: +(15 + rnd() * 25).toFixed(1),
    });
  }
  const totalCe = rows.reduce((s, r) => s + r.ceOI, 0);
  const totalPe = rows.reduce((s, r) => s + r.peOI, 0);
  const pcr = +(totalPe / Math.max(totalCe, 1)).toFixed(2);
  const maxPain = rows.reduce((best, r) => {
    const pain = rows.reduce((p, x) => p + Math.max(0, r.strike - x.strike) * x.ceOI + Math.max(0, x.strike - r.strike) * x.peOI, 0);
    return pain < best.pain ? { strike: r.strike, pain } : best;
  }, { strike: atm, pain: Infinity }).strike;
  return { spot, atm, rows, pcr, maxPain };
}

// ---------- FII / DII ----------
export function getFiiDii() {
  const rnd = seed("fiidii");
  const days = 30;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - i) * 86400000).toISOString().slice(0, 10);
    return {
      date,
      fii: Math.round((rnd() - 0.45) * 8000),
      dii: Math.round((rnd() - 0.4) * 6000),
    };
  });
}

// ---------- News ----------
export interface NewsItem { id: string; title: string; source: string; category: string; sentiment: "bullish" | "neutral" | "bearish"; impact: "high" | "medium" | "low"; time: string; summary: string }
export function getNews(): NewsItem[] {
  const rnd = seed("news-" + new Date().toDateString());
  const seeds = [
    { title: "RBI holds repo rate steady, hints at data-dependent stance", category: "Economy", source: "Mint" },
    { title: "Nifty reclaims 24,500 as banking heavyweights lead recovery", category: "Market", source: "Bloomberg" },
    { title: "Reliance's new energy arm plans record capex; brokerages upgrade", category: "Company", source: "ET Markets" },
    { title: "US Fed minutes: officials open to further easing if inflation cools", category: "Global", source: "Reuters" },
    { title: "TCS wins multi-year deal with European automaker", category: "Company", source: "Moneycontrol" },
    { title: "Crude tumbles 3% on demand jitters, OMCs rally", category: "Global", source: "CNBC" },
    { title: "FIIs turn net buyers after five sessions of selling", category: "Flows", source: "NSE" },
    { title: "Auto sector Q3 preview: PV growth intact, 2W margins to expand", category: "Sector", source: "ICICIdirect" },
    { title: "India IPO pipeline swells with 20+ filings this month", category: "IPO", source: "Prime Database" },
    { title: "Adani group's green hydrogen JV crosses milestone", category: "Company", source: "BS" },
  ];
  const sents: NewsItem["sentiment"][] = ["bullish", "neutral", "bearish"];
  const imp: NewsItem["impact"][] = ["high", "medium", "low"];
  return seeds.map((n, i) => ({
    id: String(i),
    title: n.title,
    source: n.source,
    category: n.category,
    sentiment: sents[Math.floor(rnd() * 3)],
    impact: imp[Math.floor(rnd() * 3)],
    time: `${Math.floor(rnd() * 12) + 1}h ago`,
    summary: "AI summary: key takeaways include cautious tone on rates, positive stance on domestic consumption, and neutral outlook on commodities.",
  }));
}

// ---------- Economic calendar ----------
export interface CalendarEvent { date: string; time: string; title: string; type: "econ" | "earnings" | "dividend" | "ipo" | "corp"; impact: "high" | "medium" | "low"; note?: string }
export function getCalendar(): CalendarEvent[] {
  const base = new Date();
  const push = (d: number) => new Date(base.getTime() + d * 86400000).toISOString().slice(0, 10);
  return [
    { date: push(0), time: "05:30 PM", title: "RBI Monetary Policy", type: "econ", impact: "high", note: "Repo rate decision" },
    { date: push(0), time: "06:00 PM", title: "TCS Q3 Results", type: "earnings", impact: "high" },
    { date: push(1), time: "11:00 AM", title: "India CPI Inflation", type: "econ", impact: "high" },
    { date: push(1), time: "03:30 PM", title: "Infosys Interim Dividend Record Date", type: "dividend", impact: "medium" },
    { date: push(2), time: "10:30 AM", title: "IIP data", type: "econ", impact: "medium" },
    { date: push(2), time: "02:00 PM", title: "Nykaa Q3 Results", type: "earnings", impact: "medium" },
    { date: push(3), time: "09:15 AM", title: "Vibhor Steel Tubes IPO opens", type: "ipo", impact: "medium" },
    { date: push(4), time: "07:00 PM", title: "US Non-Farm Payrolls", type: "econ", impact: "high" },
    { date: push(5), time: "10:00 AM", title: "Reliance Bonus Issue Record Date", type: "corp", impact: "high" },
    { date: push(6), time: "05:00 PM", title: "HDFC Bank Q3 Results", type: "earnings", impact: "high" },
  ];
}
