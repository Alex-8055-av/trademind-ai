import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/PageHeader";
import { getCalendar } from "@/lib/services/mock";

export const Route = createFileRoute("/_authenticated/app/calendar")({
  head: () => ({ meta: [{ title: "Economic Calendar — TradeMind AI" }] }),
  component: CalendarPage,
});

const typeLabel: Record<string, string> = { econ: "Economic", earnings: "Earnings", dividend: "Dividend", ipo: "IPO", corp: "Corporate Action" };

function CalendarPage() {
  const events = getCalendar();
  const grouped = events.reduce<Record<string, typeof events>>((acc, e) => {
    (acc[e.date] ||= []).push(e); return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Economic & Corporate Calendar" subtitle="Central-bank events, earnings, dividends, splits, bonuses, and IPOs." />
      <div className="space-y-4">
        {Object.entries(grouped).map(([date, list]) => (
          <Panel key={date}>
            <div className="text-sm font-semibold mb-3">{new Date(date).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</div>
            <div className="space-y-2">
              {list.map((e, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-muted-foreground text-xs">{e.time}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${e.impact === "high" ? "bg-red-500/10 text-red-400" : e.impact === "medium" ? "bg-amber-500/10 text-amber-400" : "bg-white/10 text-muted-foreground"}`}>{e.impact}</span>
                  <span className="text-xs text-muted-foreground">{typeLabel[e.type]}</span>
                  <span className="text-foreground">{e.title}</span>
                  {e.note && <span className="text-xs text-muted-foreground">— {e.note}</span>}
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
