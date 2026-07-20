import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, pctClass } from "@/components/app/PageHeader";
import { runScanner, SCANNER_LABELS, SECTORS, type ScannerType } from "@/lib/services/mock";

export const Route = createFileRoute("/_authenticated/app/scanner")({
  head: () => ({ meta: [{ title: "AI Stock Scanner — TradeMind AI" }] }),
  component: ScannerPage,
});

function ScannerPage() {
  const [type, setType] = useState<ScannerType>("intraday");
  const [sector, setSector] = useState<string>("");
  const rows = useMemo(() => runScanner(type, sector ? { sector } : undefined), [type, sector]);

  return (
    <div>
      <PageHeader title="AI Stock Scanner" subtitle="Scan the market with 14 institutional strategies. Combine filters to narrow the setup." />

      <Panel className="mb-4">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SCANNER_LABELS) as ScannerType[]).map((k) => (
            <button key={k} onClick={() => setType(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${type === k ? "bg-emerald text-primary-foreground" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}>
              {SCANNER_LABELS[k]}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <label className="text-xs text-muted-foreground">Sector filter</label>
          <select value={sector} onChange={(e) => setSector(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm">
            <option value="">All sectors</option>
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-xs text-muted-foreground ml-auto">{rows.length} matches</span>
        </div>
      </Panel>

      <Panel className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr className="text-left"><th className="p-2">Symbol</th><th className="p-2">Sector</th><th className="p-2 text-right">Price</th><th className="p-2 text-right">%Chg</th><th className="p-2 text-right">RVOL</th><th className="p-2 text-right">RSI</th><th className="p-2 text-right">AI Score</th><th className="p-2">Signal</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-2 font-medium">{r.symbol}</td>
                <td className="p-2 text-muted-foreground">{r.sector}</td>
                <td className="p-2 text-right">₹{r.price}</td>
                <td className={`p-2 text-right ${pctClass(r.changePct)}`}>{r.changePct > 0 ? "+" : ""}{r.changePct}%</td>
                <td className="p-2 text-right">{r.rvol}x</td>
                <td className="p-2 text-right">{r.rsi}</td>
                <td className="p-2 text-right"><span className="inline-block bg-emerald/10 text-emerald px-2 py-0.5 rounded-full text-xs font-semibold">{r.aiScore}</span></td>
                <td className="p-2 text-muted-foreground">{r.signal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
