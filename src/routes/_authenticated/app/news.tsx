import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel } from "@/components/app/PageHeader";
import { getNews } from "@/lib/services/mock";

export const Route = createFileRoute("/_authenticated/app/news")({
  head: () => ({ meta: [{ title: "News & Sentiment — TradeMind AI" }] }),
  component: NewsPage,
});

const CATS = ["All", "Market", "Company", "Global", "Economy", "Sector", "IPO", "Flows"];

function NewsPage() {
  const all = useMemo(() => getNews(), []);
  const [cat, setCat] = useState("All");
  const items = cat === "All" ? all : all.filter((n) => n.category === cat);
  const bull = all.filter((n) => n.sentiment === "bullish").length;
  const bear = all.filter((n) => n.sentiment === "bearish").length;
  const neu = all.filter((n) => n.sentiment === "neutral").length;

  return (
    <div>
      <PageHeader title="News & Sentiment" subtitle="AI-summarized market intelligence with sentiment and impact scoring." />

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="glass-panel rounded-2xl p-4"><div className="text-xs uppercase text-muted-foreground">Bullish</div><div className="text-2xl font-semibold text-emerald mt-1">{bull}</div></div>
        <div className="glass-panel rounded-2xl p-4"><div className="text-xs uppercase text-muted-foreground">Neutral</div><div className="text-2xl font-semibold mt-1">{neu}</div></div>
        <div className="glass-panel rounded-2xl p-4"><div className="text-xs uppercase text-muted-foreground">Bearish</div><div className="text-2xl font-semibold text-red-400 mt-1">{bear}</div></div>
      </div>

      <Panel className="mb-4">
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`px-3 py-1 rounded-full text-xs ${cat === c ? "bg-emerald text-primary-foreground" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}>{c}</button>
          ))}
        </div>
      </Panel>

      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className="glass-panel rounded-2xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-foreground font-medium">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{n.source} · {n.category} · {n.time}</div>
                <p className="text-sm text-muted-foreground mt-2">{n.summary}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${n.sentiment === "bullish" ? "bg-emerald/10 text-emerald" : n.sentiment === "bearish" ? "bg-red-500/10 text-red-400" : "bg-white/10 text-muted-foreground"}`}>{n.sentiment}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${n.impact === "high" ? "bg-red-500/10 text-red-400" : n.impact === "medium" ? "bg-amber-500/10 text-amber-400" : "bg-white/10 text-muted-foreground"}`}>{n.impact} impact</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
