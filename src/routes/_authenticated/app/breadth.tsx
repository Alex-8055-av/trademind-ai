import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Stat } from "@/components/app/PageHeader";
import { getMarketBreadth } from "@/lib/services/mock";

export const Route = createFileRoute("/_authenticated/app/breadth")({
  head: () => ({ meta: [{ title: "Market Breadth — TradeMind AI" }] }),
  component: BreadthPage,
});

function BreadthPage() {
  const b = getMarketBreadth();
  return (
    <div>
      <PageHeader title="Market Breadth" subtitle="Advances / declines, 52-week highs / lows, and overall market strength." />
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Stat label="Advances" value={b.advances} tone="up" />
        <Stat label="Declines" value={b.declines} tone="down" />
        <Stat label="A/D Ratio" value={b.ratio} tone={b.ratio > 1 ? "up" : "down"} />
        <Stat label="Strength" value={`${b.strength}%`} tone={b.strength > 50 ? "up" : "down"} />
      </div>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Stat label="New 52w Highs" value={b.newHighs} tone="up" />
        <Stat label="New 52w Lows" value={b.newLows} tone="down" />
        <Stat label="Unchanged" value={b.unchanged} />
      </div>
      <Panel>
        <h3 className="text-sm font-semibold mb-3">30-day advance history</h3>
        <div className="flex items-end gap-1 h-40">
          {b.series.map((p) => (
            <div key={p.day} className="flex-1 bg-emerald/40 rounded-t hover:bg-emerald" style={{ height: `${(p.ad / 2000) * 100}%` }} title={`Day ${p.day}: ${p.ad}`} />
          ))}
        </div>
      </Panel>
    </div>
  );
}
