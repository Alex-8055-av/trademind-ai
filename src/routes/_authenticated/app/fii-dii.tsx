import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Stat } from "@/components/app/PageHeader";
import { getFiiDii } from "@/lib/services/mock";

export const Route = createFileRoute("/_authenticated/app/fii-dii")({
  head: () => ({ meta: [{ title: "FII / DII Dashboard — TradeMind AI" }] }),
  component: FiiDiiPage,
});

function FiiDiiPage() {
  const data = getFiiDii();
  const today = data[data.length - 1];
  const week = data.slice(-5);
  const wFii = week.reduce((s, d) => s + d.fii, 0);
  const wDii = week.reduce((s, d) => s + d.dii, 0);
  const max = Math.max(...data.flatMap((d) => [Math.abs(d.fii), Math.abs(d.dii)]));

  return (
    <div>
      <PageHeader title="FII / DII Activity" subtitle="Institutional cash flows in the Indian equity market." />
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Stat label="FII Today (Cr)" value={today.fii} tone={today.fii > 0 ? "up" : "down"} />
        <Stat label="DII Today (Cr)" value={today.dii} tone={today.dii > 0 ? "up" : "down"} />
        <Stat label="FII 5-day Net" value={wFii} tone={wFii > 0 ? "up" : "down"} />
        <Stat label="DII 5-day Net" value={wDii} tone={wDii > 0 ? "up" : "down"} />
      </div>

      <Panel>
        <h3 className="text-sm font-semibold mb-4">30-day activity (₹ Cr)</h3>
        <div className="space-y-1">
          {data.map((d) => (
            <div key={d.date} className="flex items-center gap-3 text-xs">
              <span className="w-20 text-muted-foreground">{d.date.slice(5)}</span>
              <div className="flex-1 flex items-center gap-0.5 h-5">
                <div className="flex-1 flex justify-end">
                  {d.fii < 0 && <div className="bg-red-500/60 rounded-l" style={{ width: `${(Math.abs(d.fii) / max) * 100}%`, height: "100%" }} />}
                </div>
                <div className="w-px bg-white/20 h-full" />
                <div className="flex-1">
                  {d.fii >= 0 && <div className="bg-emerald/70 rounded-r" style={{ width: `${(d.fii / max) * 100}%`, height: "100%" }} />}
                </div>
              </div>
              <span className={`w-16 text-right ${d.fii > 0 ? "text-emerald" : "text-red-400"}`}>{d.fii}</span>
              <span className={`w-16 text-right ${d.dii > 0 ? "text-emerald" : "text-red-400"}`}>{d.dii}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="w-3 h-3 bg-emerald/70 rounded" /> FII / DII buy</span>
          <span className="inline-flex items-center gap-1"><span className="w-3 h-3 bg-red-500/60 rounded" /> Sell</span>
        </div>
      </Panel>
    </div>
  );
}
