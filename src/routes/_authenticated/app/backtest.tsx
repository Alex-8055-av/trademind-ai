import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, Panel, Stat, pctClass } from "@/components/app/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { runBacktestFn } from "@/lib/backtest/run.functions";
import type { BacktestResult } from "@/lib/backtest/engine";
import { UNIVERSE } from "@/lib/services/mock";
import { toast } from "sonner";
import { Play } from "lucide-react";

const searchSchema = z.object({ strategyId: z.string().optional() });

export const Route = createFileRoute("/_authenticated/app/backtest")({
  head: () => ({
    meta: [
      { title: "Backtesting — TradeMind AI" },
      { name: "description", content: "Test strategies over historical data with Sharpe, Profit Factor, Drawdown, equity curve, and trade list." },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: BacktestPage,
});

const TFs = ["15m","1h","4h","1D","1W"] as const;

function BacktestPage() {
  const { strategyId } = Route.useSearch();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(strategyId ?? null);
  const [symbol, setSymbol] = useState("RELIANCE");
  const [timeframe, setTimeframe] = useState<typeof TFs[number]>("1D");
  const [bars, setBars] = useState(500);
  const [params, setParams] = useState({ capital: 1000000, commissionPct: 0.05, slippagePct: 0.05, riskPerTradePct: 1 });
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [previous, setPrevious] = useState<{ label: string; res: BacktestResult } | null>(null);
  const [busy, setBusy] = useState(false);
  const run = useServerFn(runBacktestFn);

  useEffect(() => {
    supabase.from("strategies").select("id,name,rules").then(({ data }) => {
      setStrategies(data || []);
      if (!selected && data?.length) setSelected(data[0].id);
    });
  }, []);

  const runIt = async () => {
    const strat = strategies.find((s) => s.id === selected);
    if (!strat) return toast.error("Pick a strategy first");
    setBusy(true);
    try {
      const res = await run({ data: { symbol, timeframe, bars, rules: strat.rules, params } });
      if (result) setPrevious({ label: `${symbol} ${timeframe}`, res: result });
      setResult(res);
      // persist
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from("backtests").insert({
        user_id: user.id, strategy_id: strat.id, symbol, timeframe,
        params: params as any, metrics: res.metrics as any, equity_curve: res.equityCurve as any, trades: res.trades as any,
      });
    } catch (e: any) {
      toast.error(e?.message || "Backtest failed");
    }
    setBusy(false);
  };

  return (
    <div>
      <PageHeader title="Backtesting" subtitle="Simulate strategies on historical (mock) data with institutional metrics." />

      <div className="grid lg:grid-cols-4 gap-4 mb-4">
        <Panel className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold">Configuration</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Field label="Strategy">
              <select value={selected ?? ""} onChange={(e) => setSelected(e.target.value)} className={inp}>
                {strategies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                {strategies.length === 0 && <option value="">— none — create one first</option>}
              </select>
            </Field>
            <Field label="Symbol">
              <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={inp}>
                {UNIVERSE.map((u) => <option key={u.symbol}>{u.symbol}</option>)}
              </select>
            </Field>
            <Field label="Timeframe">
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value as any)} className={inp}>
                {TFs.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Bars"><input type="number" value={bars} onChange={(e) => setBars(+e.target.value)} className={inp} /></Field>
            <Field label="Capital"><input type="number" value={params.capital} onChange={(e) => setParams((p) => ({ ...p, capital: +e.target.value }))} className={inp} /></Field>
            <Field label="Commission %"><input type="number" step="0.01" value={params.commissionPct} onChange={(e) => setParams((p) => ({ ...p, commissionPct: +e.target.value }))} className={inp} /></Field>
            <Field label="Slippage %"><input type="number" step="0.01" value={params.slippagePct} onChange={(e) => setParams((p) => ({ ...p, slippagePct: +e.target.value }))} className={inp} /></Field>
            <Field label="Risk / trade %"><input type="number" step="0.1" value={params.riskPerTradePct} onChange={(e) => setParams((p) => ({ ...p, riskPerTradePct: +e.target.value }))} className={inp} /></Field>
          </div>
          <button disabled={busy || !selected} onClick={runIt} className="w-full mt-2 bg-emerald text-primary-foreground text-sm font-semibold py-2 rounded-full inline-flex items-center justify-center gap-2 disabled:opacity-50">
            <Play className="h-4 w-4" /> {busy ? "Running…" : "Run backtest"}
          </button>
        </Panel>

        <Panel className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3">Metrics</h3>
          {!result ? (
            <div className="text-xs text-muted-foreground text-center py-10">Run a backtest to see metrics.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Stat label="Return" value={`${result.metrics.totalReturnPct.toFixed(2)}%`} tone={result.metrics.totalReturnPct >= 0 ? "up" : "down"} />
                <Stat label="Trades" value={String(result.metrics.trades)} />
                <Stat label="Win Rate" value={`${result.metrics.winRate.toFixed(1)}%`} />
                <Stat label="Profit Factor" value={result.metrics.profitFactor.toFixed(2)} />
                <Stat label="Sharpe" value={result.metrics.sharpe.toFixed(2)} />
                <Stat label="Max DD" value={`${result.metrics.maxDrawdownPct.toFixed(1)}%`} tone="down" />
                <Stat label="Avg Win" value={`₹${result.metrics.avgWin.toFixed(0)}`} tone="up" />
                <Stat label="Avg Loss" value={`₹${result.metrics.avgLoss.toFixed(0)}`} tone="down" />
              </div>
              {previous && (
                <div className="text-xs text-muted-foreground border-t border-white/5 pt-3">
                  <div className="font-semibold mb-2">vs previous ({previous.label})</div>
                  <div className="grid grid-cols-4 gap-2">
                    <Diff label="Return" a={result.metrics.totalReturnPct} b={previous.res.metrics.totalReturnPct} suffix="%" />
                    <Diff label="Sharpe" a={result.metrics.sharpe} b={previous.res.metrics.sharpe} />
                    <Diff label="Win %" a={result.metrics.winRate} b={previous.res.metrics.winRate} suffix="%" />
                    <Diff label="Max DD" a={result.metrics.maxDrawdownPct} b={previous.res.metrics.maxDrawdownPct} suffix="%" invert />
                  </div>
                </div>
              )}
            </>
          )}
        </Panel>
      </div>

      {result && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Panel className="lg:col-span-2">
            <h3 className="text-sm font-semibold mb-3">Equity curve</h3>
            <EquitySvg data={result.equityCurve} />
          </Panel>
          <Panel className="overflow-x-auto">
            <h3 className="text-sm font-semibold mb-3">Trades ({result.trades.length})</h3>
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase text-muted-foreground text-left">
                <tr><th className="p-1.5">Side</th><th className="p-1.5 text-right">Entry</th><th className="p-1.5 text-right">Exit</th><th className="p-1.5 text-right">P&L</th><th className="p-1.5">Reason</th></tr>
              </thead>
              <tbody>
                {result.trades.slice(-40).reverse().map((t, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className={`p-1.5 uppercase ${t.side === "long" ? "text-emerald" : "text-red-400"}`}>{t.side}</td>
                    <td className="p-1.5 text-right">{t.entry.toFixed(2)}</td>
                    <td className="p-1.5 text-right">{t.exit.toFixed(2)}</td>
                    <td className={`p-1.5 text-right ${pctClass(t.pnl)}`}>₹{t.pnl.toFixed(0)}</td>
                    <td className="p-1.5 text-muted-foreground">{t.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4">⚠️ Backtests use mock historical data and are for educational purposes only. Past performance does not guarantee future results.</p>
    </div>
  );
}

const inp = "w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-[10px] uppercase text-muted-foreground">{label}</label>{children}</div>;
}
function Diff({ label, a, b, suffix = "", invert = false }: { label: string; a: number; b: number; suffix?: string; invert?: boolean }) {
  const d = a - b; const good = invert ? d < 0 : d > 0;
  return <div><div className="text-[10px] text-muted-foreground">{label}</div><div className={good ? "text-emerald" : "text-red-400"}>{d > 0 ? "+" : ""}{d.toFixed(2)}{suffix}</div></div>;
}
function EquitySvg({ data }: { data: { t: number; equity: number }[] }) {
  if (data.length < 2) return null;
  const w = 640, h = 200, pad = 20;
  const min = Math.min(...data.map((d) => d.equity));
  const max = Math.max(...data.map((d) => d.equity));
  const x = (i: number) => pad + (i / (data.length - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.equity).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <path d={path} fill="none" stroke="oklch(0.75 0.15 155)" strokeWidth="1.5" />
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="oklch(0.4 0 0)" strokeWidth="0.5" />
    </svg>
  );
}
