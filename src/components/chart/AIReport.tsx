import { Sparkles, TrendingUp, TrendingDown, ShieldAlert } from "lucide-react";
import type { TradeReport } from "@/lib/ai/trade-analysis.functions";

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function AIReport({ report, loading }: { report: TradeReport | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center text-sm text-muted-foreground">
        <Sparkles className="mx-auto h-6 w-6 animate-pulse text-emerald" />
        <p className="mt-3">TradeMind AI is analyzing market structure, liquidity and order flow…</p>
      </div>
    );
  }
  if (!report) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-sm text-muted-foreground">
        Select a symbol and click <span className="font-semibold text-foreground">Run AI Analysis</span> to generate an institutional-grade report.
      </div>
    );
  }

  const bull = clampPct(report.bullishProbability);
  const bear = clampPct(report.bearishProbability);
  const bullish = bull >= bear;

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">AI Verdict</p>
            <p className="mt-1 font-display text-2xl font-semibold">
              {report.overallTrend}
            </p>
          </div>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${bullish ? "bg-emerald/10 text-emerald" : "bg-trading-red/10 text-trading-red"}`}>
            {bullish ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm font-semibold">{report.bias}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Bullish" value={`${bull.toFixed(0)}%`} tone="emerald" />
          <Metric label="Bearish" value={`${bear.toFixed(0)}%`} tone="red" />
          <Metric label="Confidence" value={report.confidence} tone="gold" />
          <Metric label="Trade Quality" value={`${report.tradeQuality.toFixed(1)}/10`} tone="emerald" />
        </div>

        <div className="mt-4">
          <ProbabilityBar bull={bull} bear={bear} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Risk Level" value={report.riskLevel} tone="gold" />
          <Metric label="Volatility" value={report.volatility} tone="gold" />
          <Metric label="Inst. Strength" value={report.institutionalStrength} tone="emerald" />
        </div>
      </div>

      <Section title="Trade Plan">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PlanRow label="Direction" value={report.tradePlan.direction} />
          <PlanRow label="Entry" value={report.tradePlan.entry} />
          <PlanRow label="Stop Loss" value={report.tradePlan.stopLoss} />
          <PlanRow label="Target 1" value={report.tradePlan.target1} />
          <PlanRow label="Target 2" value={report.tradePlan.target2} />
          <PlanRow label="Target 3" value={report.tradePlan.target3} />
          <PlanRow label="R:R" value={report.tradePlan.riskReward} />
          <PlanRow label="Invalidation" value={report.tradePlan.invalidation} />
          <PlanRow label="Duration" value={report.tradePlan.duration} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{report.tradePlan.positionSizingNote}</p>
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Market Structure"><Prose>{report.marketStructure}</Prose></Section>
        <Section title="Liquidity"><Prose>{report.liquidity}</Prose></Section>
        <Section title="Smart Money Concepts"><Prose>{report.smartMoneyConcepts}</Prose></Section>
        <Section title="ICT Concepts"><Prose>{report.ictConcepts}</Prose></Section>
        <Section title="Chart Patterns"><Prose>{report.patterns}</Prose></Section>
        <Section title="Candlestick Signals"><Prose>{report.candlestickSignals}</Prose></Section>
        <Section title="Indicators"><Prose>{report.indicators}</Prose></Section>
        <Section title="Multi-Timeframe View"><Prose>{report.multiTimeframe}</Prose></Section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Explain like I'm a beginner"><Prose>{report.beginnerExplanation}</Prose></Section>
        <Section title="Institutional / Pro view"><Prose>{report.professionalExplanation}</Prose></Section>
      </div>

      <div className="glass-panel flex items-start gap-3 rounded-2xl p-4 text-xs text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p>{report.disclaimer}</p>
      </div>
    </div>
  );
}

function ProbabilityBar({ bull, bear }: { bull: number; bear: number }) {
  const total = bull + bear || 1;
  const bp = (bull / total) * 100;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
      <div className="flex h-full">
        <div className="h-full bg-emerald" style={{ width: `${bp}%` }} />
        <div className="h-full bg-trading-red" style={{ width: `${100 - bp}%` }} />
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "emerald" | "red" | "gold" }) {
  const color = tone === "emerald" ? "text-emerald" : tone === "red" ? "text-trading-red" : "text-gold";
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <p className="text-xs uppercase tracking-widest text-emerald">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{children}</p>;
}
