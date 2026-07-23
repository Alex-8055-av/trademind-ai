import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel } from "@/components/app/PageHeader";
import { getHeatmap } from "@/lib/services/mock";
import { useLiveQuotes } from "@/hooks/use-live-quotes";


export const Route = createFileRoute("/_authenticated/app/heatmap")({
  head: () => ({ meta: [{ title: "Market Heatmap — TradeMind AI" }] }),
  component: HeatmapPage,
});

type Kind = "nifty" | "banknifty" | "sensex" | "sector" | "cap";
const KINDS: { key: Kind; label: string }[] = [
  { key: "nifty", label: "Nifty 50" },
  { key: "banknifty", label: "Bank Nifty" },
  { key: "sensex", label: "Sensex" },
  { key: "sector", label: "Sector" },
  { key: "cap", label: "Market Cap" },
];

function tileColor(chg: number): string {
  const clamped = Math.max(-3, Math.min(3, chg)) / 3;
  if (clamped >= 0) return `oklch(0.55 ${0.05 + clamped * 0.15} 152)`;
  return `oklch(0.55 ${0.05 + Math.abs(clamped) * 0.18} 25)`;
}

function HeatmapPage() {
  const [kind, setKind] = useState<Kind>("nifty");
  const tiles = useMemo(() => getHeatmap(kind), [kind]);
  const total = tiles.reduce((s, t) => s + t.cap, 0);
  const symbols = useMemo(() => tiles.slice(0, 40).map((t) => t.symbol), [tiles]);
  const { quotes } = useLiveQuotes(symbols, 10_000);


  return (
    <div>
      <PageHeader title="Market Heatmap" subtitle="Live-look weight-sized heatmap. Green = bullish, red = bearish." />
      <Panel className="mb-4">
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button key={k.key} onClick={() => setKind(k.key)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${kind === k.key ? "bg-emerald text-primary-foreground" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}>{k.label}</button>
          ))}
        </div>
      </Panel>
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
        {tiles.map((t) => {
          const weight = Math.max(1, Math.round((t.cap / total) * 20));
          const live = quotes[t.symbol]?.changePct;
          const chg = live ?? t.changePct;
          return (
            <div key={t.symbol} style={{ backgroundColor: tileColor(chg), gridColumn: `span ${Math.min(3, weight)}` }} className="rounded-lg p-3 text-white text-xs">
              <div className="font-semibold truncate">{t.symbol}</div>
              <div className="opacity-80 text-[10px] truncate">{t.name}</div>
              <div className="mt-1 font-semibold">{chg > 0 ? "+" : ""}{chg.toFixed(2)}%</div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
