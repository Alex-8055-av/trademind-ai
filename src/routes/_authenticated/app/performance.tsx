import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Stat } from "@/components/app/PageHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/performance")({
  head: () => ({ meta: [{ title: "Performance Analytics — TradeMind AI" }] }),
  component: PerformancePage,
});

interface T { pnl: number | null; entry: number | null; sl: number | null; exit: number | null; closed_at: string | null }

function PerformancePage() {
  const [trades, setTrades] = useState<T[]>([]);
  useEffect(() => { supabase.from("trade_journal").select("pnl, entry, sl, exit, closed_at").then(({ data }) => setTrades((data || []) as T[])); }, []);

  const closed = trades.filter((t) => t.pnl != null);
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.pnl ?? 0) < 0);
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
  const avgWin = wins.length ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length : 0;
  const profitFactor = avgLoss < 0 ? (wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / -losses.reduce((s, t) => s + (t.pnl ?? 0), 0)) : 0;
  const totalPnL = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const rr = closed.length ? closed.reduce((s, t) => s + Math.abs(((t.exit ?? 0) - (t.entry ?? 0)) / Math.max(0.01, Math.abs((t.entry ?? 0) - (t.sl ?? 0)))), 0) / closed.length : 0;
  const returns = closed.map((t) => t.pnl ?? 0);
  const mean = returns.reduce((s, x) => s + x, 0) / (returns.length || 1);
  const std = Math.sqrt(returns.reduce((s, x) => s + (x - mean) ** 2, 0) / (returns.length || 1)) || 1;
  const sharpe = (mean / std) * Math.sqrt(252);

  // Drawdown
  let peak = 0, cum = 0, mdd = 0;
  for (const r of returns) { cum += r; if (cum > peak) peak = cum; mdd = Math.min(mdd, cum - peak); }

  return (
    <div>
      <PageHeader title="Performance Analytics" subtitle="Institutional-grade stats derived from your trade journal." />
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Stat label="Trades" value={closed.length} />
        <Stat label="Win Rate" value={`${winRate.toFixed(1)}%`} tone={winRate >= 50 ? "up" : "down"} />
        <Stat label="Total P&L" value={`₹${totalPnL.toFixed(0)}`} tone={totalPnL >= 0 ? "up" : "down"} />
        <Stat label="Profit Factor" value={profitFactor.toFixed(2)} tone={profitFactor >= 1 ? "up" : "down"} />
      </div>
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Stat label="Avg Win" value={`₹${avgWin.toFixed(0)}`} tone="up" />
        <Stat label="Avg Loss" value={`₹${avgLoss.toFixed(0)}`} tone="down" />
        <Stat label="Avg RR" value={rr.toFixed(2)} />
        <Stat label="Sharpe (approx)" value={isFinite(sharpe) ? sharpe.toFixed(2) : "—"} tone={sharpe > 1 ? "up" : "down"} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Stat label="Max Drawdown" value={`₹${mdd.toFixed(0)}`} tone="down" />
        <Stat label="Best Trade" value={`₹${Math.max(0, ...returns).toFixed(0)}`} tone="up" />
      </div>
      {closed.length === 0 && <Panel className="mt-4"><div className="text-center py-8 text-muted-foreground text-sm">Log trades in the Journal to unlock analytics.</div></Panel>}
    </div>
  );
}
