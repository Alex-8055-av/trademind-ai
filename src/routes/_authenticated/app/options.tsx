import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, Stat, pctClass } from "@/components/app/PageHeader";
import { getOptionChain, UNIVERSE } from "@/lib/services/mock";

export const Route = createFileRoute("/_authenticated/app/options")({
  head: () => ({ meta: [{ title: "Options Analysis — TradeMind AI" }] }),
  component: OptionsPage,
});

const EXPIRIES = ["Weekly (Thu)", "Monthly", "Next Month", "Quarter"];

function OptionsPage() {
  const [symbol, setSymbol] = useState("NIFTY");
  const [expiry, setExpiry] = useState(EXPIRIES[0]);
  const chain = useMemo(() => getOptionChain(symbol, expiry), [symbol, expiry]);

  return (
    <div>
      <PageHeader title="Options Dashboard" subtitle="Option chain, OI build-up, PCR, Max Pain, and IV — all in one view." />

      <Panel className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm">
            <option value="NIFTY">NIFTY</option>
            <option value="BANKNIFTY">BANKNIFTY</option>
            {UNIVERSE.slice(0, 15).map((s) => <option key={s.symbol} value={s.symbol}>{s.symbol}</option>)}
          </select>
          <select value={expiry} onChange={(e) => setExpiry(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm">
            {EXPIRIES.map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>
      </Panel>

      <div className="grid md:grid-cols-4 gap-4 mb-4">
        <Stat label="Spot" value={chain.spot.toLocaleString()} />
        <Stat label="ATM Strike" value={chain.atm.toLocaleString()} />
        <Stat label="PCR" value={chain.pcr} tone={chain.pcr > 1 ? "up" : "down"} />
        <Stat label="Max Pain" value={chain.maxPain.toLocaleString()} />
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-[10px] uppercase text-muted-foreground">
            <tr><th className="p-2 text-right" colSpan={4}>CALLS</th><th className="p-2 text-center">Strike</th><th className="p-2 text-left" colSpan={4}>PUTS</th></tr>
            <tr className="border-t border-white/5"><th className="p-1 text-right">IV</th><th className="p-1 text-right">Chg OI</th><th className="p-1 text-right">OI</th><th className="p-1 text-right">LTP</th><th className="p-1 text-center bg-white/5">—</th><th className="p-1 text-left">LTP</th><th className="p-1 text-left">OI</th><th className="p-1 text-left">Chg OI</th><th className="p-1 text-left">IV</th></tr>
          </thead>
          <tbody>
            {chain.rows.map((r) => (
              <tr key={r.strike} className={`border-t border-white/5 ${r.strike === chain.atm ? "bg-emerald/5" : ""}`}>
                <td className="p-1 text-right">{r.ceIv}</td>
                <td className={`p-1 text-right ${pctClass(r.ceChgOI)}`}>{r.ceChgOI.toLocaleString()}</td>
                <td className="p-1 text-right">{r.ceOI.toLocaleString()}</td>
                <td className="p-1 text-right">{r.ceLtp}</td>
                <td className="p-1 text-center font-semibold bg-white/5">{r.strike}</td>
                <td className="p-1 text-left">{r.peLtp}</td>
                <td className="p-1 text-left">{r.peOI.toLocaleString()}</td>
                <td className={`p-1 text-left ${pctClass(r.peChgOI)}`}>{r.peChgOI.toLocaleString()}</td>
                <td className="p-1 text-left">{r.peIv}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
