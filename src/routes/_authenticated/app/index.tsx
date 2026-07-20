import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Stat, Panel, pctClass } from "@/components/app/PageHeader";
import { getMarketBreadth, getSectorStats, getNews } from "@/lib/services/mock";
import { ArrowRight, Radar, Boxes, Wallet, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const breadth = getMarketBreadth();
  const sectors = getSectorStats().slice(0, 5);
  const news = getNews().slice(0, 4);

  return (
    <div>
      <PageHeader title="Workstation" subtitle="Your institutional-grade command center." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Nifty 50" value="24,536" sub="+0.62%" tone="up" />
        <Stat label="Bank Nifty" value="52,180" sub="+0.41%" tone="up" />
        <Stat label="India VIX" value="13.8" sub="-2.1%" tone="down" />
        <Stat label="Breadth" value={`${breadth.strength}%`} sub={`A/D ${breadth.ratio}`} tone={breadth.strength > 50 ? "up" : "down"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <QuickTile to="/app/scanner" icon={Radar} title="AI Scanner" desc="14 scanner types, ranked by AI." />
        <QuickTile to="/app/options" icon={Boxes} title="Options Dashboard" desc="OI, PCR, Max Pain, IV." />
        <QuickTile to="/app/portfolio" icon={Wallet} title="Portfolio" desc="Track holdings, P&L, risk." />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel>
          <h3 className="text-sm font-semibold mb-3">Top sectors today</h3>
          <div className="space-y-2">
            {sectors.map((s) => (
              <div key={s.sector} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{s.sector}</span>
                <span className={pctClass(s.changePct)}>{s.changePct > 0 ? "+" : ""}{s.changePct}%</span>
              </div>
            ))}
          </div>
          <Link to="/app/sectors" className="text-xs text-emerald mt-3 inline-flex items-center gap-1">All sectors <ArrowRight className="h-3 w-3" /></Link>
        </Panel>
        <Panel>
          <h3 className="text-sm font-semibold mb-3">Market pulse</h3>
          <div className="space-y-3">
            {news.map((n) => (
              <div key={n.id} className="text-sm">
                <div className="text-foreground">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{n.source} · {n.time} · <span className={n.sentiment === "bullish" ? "text-emerald" : n.sentiment === "bearish" ? "text-red-400" : ""}>{n.sentiment}</span></div>
              </div>
            ))}
          </div>
          <Link to="/app/news" className="text-xs text-emerald mt-3 inline-flex items-center gap-1">More news <ArrowRight className="h-3 w-3" /></Link>
        </Panel>
      </div>
    </div>
  );
}

function QuickTile({ to, icon: Icon, title, desc }: { to: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link to={to} className="glass-panel rounded-2xl p-5 hover:bg-white/5 transition group">
      <Icon className="h-5 w-5 text-emerald mb-3" />
      <div className="text-foreground font-medium">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
      <div className="text-xs text-emerald mt-3 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">Open <ArrowRight className="h-3 w-3" /></div>
    </Link>
  );
}
