import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, Stat } from "@/components/app/PageHeader";

export const Route = createFileRoute("/_authenticated/app/risk")({
  head: () => ({ meta: [{ title: "Risk Dashboard — TradeMind AI" }] }),
  component: RiskPage,
});

function RiskPage() {
  const [capital, setCapital] = useState(500000);
  const [riskPct, setRiskPct] = useState(1);
  const [entry, setEntry] = useState(2800);
  const [sl, setSl] = useState(2760);

  const riskAmount = capital * (riskPct / 100);
  const perShareRisk = Math.max(0.01, Math.abs(entry - sl));
  const shares = Math.floor(riskAmount / perShareRisk);
  const notional = shares * entry;
  const exposure = (notional / capital) * 100;

  return (
    <div>
      <PageHeader title="Risk Dashboard" subtitle="Position sizing, exposure, and risk allocation." />
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Stat label="Capital" value={`₹${capital.toLocaleString()}`} />
        <Stat label="Risk / trade" value={`${riskPct}%`} />
        <Stat label="₹ at Risk" value={`₹${riskAmount.toFixed(0)}`} tone="down" />
        <Stat label="Portfolio Risk" value="—" sub="Sum of active positions" />
      </div>

      <Panel className="mb-4">
        <h3 className="text-sm font-semibold mb-4">Position sizing calculator</h3>
        <div className="grid md:grid-cols-4 gap-3 text-xs">
          <label>Capital<input type="number" value={capital} onChange={(e) => setCapital(+e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5" /></label>
          <label>Risk %<input type="number" step="0.1" value={riskPct} onChange={(e) => setRiskPct(+e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5" /></label>
          <label>Entry<input type="number" value={entry} onChange={(e) => setEntry(+e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5" /></label>
          <label>Stop Loss<input type="number" value={sl} onChange={(e) => setSl(+e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5" /></label>
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <Stat label="Recommended Shares" value={shares} tone="up" />
          <Stat label="Notional Value" value={`₹${notional.toLocaleString()}`} />
          <Stat label="Exposure" value={`${exposure.toFixed(1)}%`} tone={exposure > 30 ? "down" : "up"} />
        </div>
      </Panel>

      <div className="grid md:grid-cols-3 gap-4">
        <Stat label="Daily Risk Limit" value="2%" sub="Institutional guardrail" />
        <Stat label="Weekly Risk Limit" value="6%" sub="Cap losses per week" />
        <Stat label="Capital Allocation" value="80/20" sub="Deployed / cash" />
      </div>
    </div>
  );
}
