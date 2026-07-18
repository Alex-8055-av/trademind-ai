import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Sparkles, LineChart, Brain, ShieldCheck, TrendingUp, TrendingDown } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <TickerStrip />
        <Features />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-28">
      <div className="mx-auto max-w-5xl text-center">
        <span className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-emerald" />
          Institutional-grade intelligence, now for everyone
        </span>
        <h1 className="mt-8 font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-7xl">
          AI That Thinks Like
          <br />
          <span className="text-brand-gradient">Institutional Traders.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          TradeMind AI by Avinash is the premium trading intelligence platform that turns market
          noise into decisive, actionable signals — with the polish of the world's best fintech.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(34,197,94,0.45)]">
            Launch TradeMind <ArrowRight className="h-4 w-4" />
          </button>
          <button className="glass-panel inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-white/10">
            Watch Demo
          </button>
        </div>
      </div>

      {/* Preview card */}
      <div className="mx-auto mt-20 max-w-5xl">
        <div className="glass-panel rounded-3xl p-2 shadow-[0_40px_120px_-30px_rgba(34,197,94,0.25)]">
          <div className="rounded-[calc(1.5rem-4px)] bg-card/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">AI Signal · NASDAQ</p>
                <p className="mt-1 font-display text-2xl font-semibold">NVDA · Strong Accumulation</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-emerald/10 px-3 py-1.5 text-emerald">
                <TrendingUp className="h-4 w-4" /> <span className="text-sm font-semibold">+4.82%</span>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <StatCard label="AI Confidence" value="94%" tone="emerald" />
              <StatCard label="Risk Score" value="Low" tone="gold" />
              <StatCard label="Institutional Flow" value="Buying" tone="emerald" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "emerald" | "gold" | "red" }) {
  const color = tone === "emerald" ? "text-emerald" : tone === "gold" ? "text-gold" : "text-trading-red";
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function TickerStrip() {
  const items = [
    { s: "SPX", p: "5,842.10", d: "+0.62%", up: true },
    { s: "NDX", p: "20,914.30", d: "+1.14%", up: true },
    { s: "BTC", p: "98,240", d: "-1.24%", up: false },
    { s: "ETH", p: "3,420", d: "+2.05%", up: true },
    { s: "TSLA", p: "412.55", d: "+3.28%", up: true },
    { s: "AAPL", p: "234.12", d: "-0.42%", up: false },
    { s: "GOLD", p: "2,715", d: "+0.18%", up: true },
  ];
  return (
    <div className="border-y border-white/5 bg-background/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 overflow-hidden px-6 py-4 text-sm">
        {items.map((i) => (
          <div key={i.s} className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{i.s}</span>
            <span className="text-muted-foreground">{i.p}</span>
            <span className={`inline-flex items-center gap-1 font-medium ${i.up ? "text-emerald" : "text-trading-red"}`}>
              {i.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {i.d}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Features() {
  const features = [
    { icon: Brain, title: "Institutional AI Models", body: "Trained on decades of order flow and macro data to think the way top desks do." },
    { icon: LineChart, title: "Real-Time Market Intelligence", body: "Live signals across equities, crypto, forex and commodities — with clean, glanceable UI." },
    { icon: ShieldCheck, title: "Risk-First Portfolio", body: "Adaptive risk scoring and position sizing that protects capital before chasing return." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-14 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald">The Platform</p>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
          Built to feel like a{" "}
          <span className="text-brand-gradient">billion-dollar</span> trading floor.
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="glass-panel group rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-emerald/30">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/10 text-emerald transition-all group-hover:bg-emerald/20">
              <f.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-6 font-display text-xl font-semibold">{f.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
