import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, pctClass } from "@/components/app/PageHeader";
import { getSectorStats } from "@/lib/services/mock";

export const Route = createFileRoute("/_authenticated/app/sectors")({
  head: () => ({ meta: [{ title: "Sector Analysis — TradeMind AI" }] }),
  component: SectorsPage,
});

function SectorsPage() {
  const stats = getSectorStats();
  const best = stats[0];
  const worst = stats[stats.length - 1];

  return (
    <div>
      <PageHeader title="Sector Analysis" subtitle="Rotation, strength, momentum, and money flow across sectors." />
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Panel>
          <div className="text-xs uppercase text-muted-foreground">Best performing</div>
          <div className="text-2xl font-semibold text-emerald mt-1">{best.sector}</div>
          <div className="text-sm text-muted-foreground">+{best.changePct}% · Strength {best.strength}</div>
        </Panel>
        <Panel>
          <div className="text-xs uppercase text-muted-foreground">Worst performing</div>
          <div className="text-2xl font-semibold text-red-400 mt-1">{worst.sector}</div>
          <div className="text-sm text-muted-foreground">{worst.changePct}% · Strength {worst.strength}</div>
        </Panel>
      </div>
      <Panel className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground text-left">
            <tr><th className="p-2">Sector</th><th className="p-2 text-right">%Chg</th><th className="p-2 text-right">Momentum</th><th className="p-2 text-right">Strength</th><th className="p-2 text-right">Flow (Cr)</th></tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.sector} className="border-t border-white/5">
                <td className="p-2 font-medium">{s.sector}</td>
                <td className={`p-2 text-right ${pctClass(s.changePct)}`}>{s.changePct > 0 ? "+" : ""}{s.changePct}%</td>
                <td className="p-2 text-right">
                  <div className="inline-block w-24 bg-white/5 rounded-full h-1.5 overflow-hidden align-middle">
                    <div className="h-full bg-emerald" style={{ width: `${s.momentum}%` }} />
                  </div>
                </td>
                <td className="p-2 text-right">{s.strength}</td>
                <td className={`p-2 text-right ${pctClass(s.flow)}`}>{s.flow > 0 ? "+" : ""}{s.flow}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
