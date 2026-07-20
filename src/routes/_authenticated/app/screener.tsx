import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, pctClass } from "@/components/app/PageHeader";
import { UNIVERSE, SECTORS } from "@/lib/services/mock";
import { Plus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/screener")({
  head: () => ({ meta: [{ title: "Advanced Screener — TradeMind AI" }] }),
  component: ScreenerPage,
});

type Op = ">" | "<" | ">=" | "<=";
interface Filter { id: string; field: string; op: Op; value: number }

const FIELDS = [
  "Price", "Market Cap (Cr)", "RSI", "RVOL", "Volume Breakout", "ATR", "ADX",
  "EMA Cross", "VWAP", "Supertrend", "MACD Signal", "Bollinger Band Width",
  "Open Interest", "PCR", "Order Block", "FVG", "BOS", "CHOCH",
];
const SMC_TAGS = ["BOS", "CHOCH", "Order Block", "FVG", "Liquidity Sweep", "Equal Highs", "Equal Lows", "Premium Zone", "Discount Zone"];

export default function ScreenerPage() {
  const [filters, setFilters] = useState<Filter[]>([
    { id: "1", field: "RSI", op: "<", value: 35 },
    { id: "2", field: "RVOL", op: ">", value: 2 },
  ]);
  const [selectedSector, setSelectedSector] = useState("");
  const [smc, setSmc] = useState<string[]>(["BOS"]);

  const results = useMemo(() => {
    return UNIVERSE
      .filter((s) => !selectedSector || s.sector === selectedSector)
      .map((s) => ({ ...s, rsi: 20 + (s.symbol.charCodeAt(0) % 60), rvol: 1 + (s.symbol.charCodeAt(1) % 4), changePct: (s.symbol.charCodeAt(2) % 10) - 5 }));
  }, [selectedSector]);

  const addFilter = () => setFilters((f) => [...f, { id: crypto.randomUUID(), field: "Price", op: ">", value: 0 }]);
  const rm = (id: string) => setFilters((f) => f.filter((x) => x.id !== id));

  return (
    <div>
      <PageHeader title="Advanced Screener" subtitle="Build custom scans with fundamentals, technicals, and SMC concepts." />

      <Panel className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Filter builder</h3>
          <button onClick={addFilter} className="text-xs text-emerald inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add filter</button>
        </div>
        <div className="space-y-2">
          {filters.map((f) => (
            <div key={f.id} className="flex items-center gap-2">
              <select value={f.field} onChange={(e) => setFilters((xs) => xs.map((x) => x.id === f.id ? { ...x, field: e.target.value } : x))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm flex-1">
                {FIELDS.map((v) => <option key={v}>{v}</option>)}
              </select>
              <select value={f.op} onChange={(e) => setFilters((xs) => xs.map((x) => x.id === f.id ? { ...x, op: e.target.value as Op } : x))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm w-20">
                {[">", "<", ">=", "<="].map((v) => <option key={v}>{v}</option>)}
              </select>
              <input type="number" value={f.value} onChange={(e) => setFilters((xs) => xs.map((x) => x.id === f.id ? { ...x, value: +e.target.value } : x))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm w-28" />
              <button onClick={() => rm(f.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase text-muted-foreground mb-2">Sector</div>
            <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm w-full">
              <option value="">All</option>
              {SECTORS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground mb-2">Market structure</div>
            <div className="flex flex-wrap gap-1.5">
              {SMC_TAGS.map((t) => (
                <button key={t} onClick={() => setSmc((s) => s.includes(t) ? s.filter((x) => x !== t) : [...s, t])}
                  className={`px-2.5 py-1 rounded-full text-xs ${smc.includes(t) ? "bg-emerald text-primary-foreground" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="overflow-x-auto">
        <div className="text-xs text-muted-foreground mb-2">{results.length} stocks match</div>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground text-left">
            <tr><th className="p-2">Symbol</th><th className="p-2">Sector</th><th className="p-2 text-right">Price</th><th className="p-2 text-right">%Chg</th><th className="p-2 text-right">RSI</th><th className="p-2 text-right">RVOL</th></tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.symbol} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-2 font-medium">{r.symbol}</td>
                <td className="p-2 text-muted-foreground">{r.sector}</td>
                <td className="p-2 text-right">₹{r.price}</td>
                <td className={`p-2 text-right ${pctClass(r.changePct)}`}>{r.changePct > 0 ? "+" : ""}{r.changePct}%</td>
                <td className="p-2 text-right">{r.rsi}</td>
                <td className="p-2 text-right">{r.rvol}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

