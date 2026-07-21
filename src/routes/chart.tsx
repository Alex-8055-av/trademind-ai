import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { Search, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AIChat } from "@/components/chart/AIChat";
import { AIReport } from "@/components/chart/AIReport";
import { ImageAnalyzer } from "@/components/chart/ImageAnalyzer";
import { PriceChart } from "@/components/chart/PriceChart";
import { analyzeSymbol, type TradeReport } from "@/lib/ai/trade-analysis.functions";
import { getMarketDataProvider } from "@/lib/market-data";
import type { Timeframe } from "@/lib/market-data/types";


const TIMEFRAMES: Timeframe[] = [
  "1m","3m","5m","10m","15m","30m","45m","1h","2h","4h","1D","1W","1M",
];

const CandlesInput = z.object({
  symbol: z.string().min(1).max(20),
  timeframe: z.enum([
    "1m","3m","5m","10m","15m","30m","45m","1h","2h","4h","1D","1W","1M",
  ] as const),
});

const fetchCandles = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CandlesInput.parse(input))
  .handler(async ({ data }) => {
    const provider = await getMarketDataProvider();
    const candles = await provider.getCandles(data.symbol, data.timeframe, 300);
    return { candles, provider: provider.name };
  });

const searchSymbolsFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ query: z.string().max(40) }).parse(input))
  .handler(async ({ data }) => {
    const provider = await getMarketDataProvider();
    return { results: await provider.searchSymbols(data.query) };
  });

export const Route = createFileRoute("/chart")({
  head: () => ({
    meta: [
      { title: "AI Chart · TradeMind AI by Avinash" },
      { name: "description", content: "Institutional AI chart analysis — SMC, ICT, liquidity, order blocks and trade plans on any symbol." },
      { property: "og:title", content: "AI Chart · TradeMind AI" },
      { property: "og:description", content: "Institutional AI chart analysis for traders and investors." },
    ],
  }),
  component: ChartPage,
});

function ChartPage() {
  const [symbol, setSymbol] = useState<string>("NVDA");
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [report, setReport] = useState<TradeReport | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  

  const candlesFn = useServerFn(fetchCandles);
  const analyzeFn = useServerFn(analyzeSymbol);

  const candlesQuery = useQuery({
    queryKey: ["candles", symbol, timeframe],
    queryFn: () => candlesFn({ data: { symbol, timeframe } }),
    staleTime: 30_000,
  });

  useEffect(() => { setReport(null); }, [symbol, timeframe]);

  const candles = candlesQuery.data?.candles ?? [];
  const last = candles[candles.length - 1];
  const first = candles[0];
  const changePct = last && first ? ((last.close - first.close) / first.close) * 100 : 0;
  const up = changePct >= 0;

  async function onAnalyze() {
    setAnalyzing(true);
    setReport(null);
    try {
      const res = await analyzeFn({ data: { symbol, timeframe } });
      setReport(res.report);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="glass-panel rounded-3xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <SymbolPicker symbol={symbol} onChange={setSymbol} />

            <div className="flex flex-wrap items-center gap-1 rounded-full bg-white/[0.02] p-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    tf === timeframe ? "bg-emerald text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-3">
              {last && (
                <div className="text-right">
                  <p className="font-display text-lg font-semibold text-foreground">{last.close.toFixed(2)}</p>
                  <p className={`inline-flex items-center gap-1 text-xs font-medium ${up ? "text-emerald" : "text-trading-red"}`}>
                    {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {changePct.toFixed(2)}%
                  </p>
                </div>
              )}
              <button
                onClick={onAnalyze}
                disabled={analyzing || candlesQuery.isLoading}
                className="inline-flex items-center gap-2 rounded-full bg-emerald px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {analyzing ? "Analyzing…" : "Run AI Analysis"}
              </button>
            </div>
          </div>

          <div className="mt-4">
            {candlesQuery.isLoading ? (
              <div className="flex h-[480px] items-center justify-center text-sm text-muted-foreground">
                Loading candles…
              </div>
            ) : (
              <PriceChart candles={candles} />
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <AIReport report={report} loading={analyzing} />
          <AIChat symbol={symbol} timeframe={timeframe} />
        </div>

        <div className="mt-6">
          <ImageAnalyzer />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Educational use only. TradeMind AI does not guarantee profits — always manage risk and consult a licensed advisor.
        </p>
      </main>
      <Footer />


    </div>
  );
}

function SymbolPicker({ symbol, onChange }: { symbol: string; onChange: (s: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const search = useServerFn(searchSymbolsFn);

  const results = useQuery({
    queryKey: ["symbol-search", query],
    queryFn: () => search({ data: { query } }),
    staleTime: 60_000,
    enabled: open,
  });

  const items = useMemo(() => results.data?.results ?? [], [results.data]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-white/5"
      >
        <Search className="h-4 w-4 text-emerald" />
        {symbol}
      </button>
      {open && (
        <div className="glass-panel absolute left-0 top-full z-40 mt-2 w-72 rounded-2xl p-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbols…"
            className="w-full rounded-xl border border-white/5 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald/40 focus:outline-none"
          />
          <div className="mt-2 max-h-64 overflow-y-auto">
            {items.map((s) => (
              <button
                key={s.symbol}
                onClick={() => { onChange(s.symbol); setOpen(false); setQuery(""); }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-white/5"
              >
                <span className="font-semibold text-foreground">{s.symbol}</span>
                <span className="text-xs text-muted-foreground">{s.name} · {s.exchange}</span>
              </button>
            ))}
            {items.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
