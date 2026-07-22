import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/app/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Share2, Trash2, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/strategies")({
  head: () => ({
    meta: [
      { title: "Strategy Builder — TradeMind AI" },
      { name: "description", content: "Build no-code trading strategies with entry, exit, stop-loss, take-profit, trailing, SMC/ICT and volume conditions." },
    ],
  }),
  component: StrategiesPage,
});

interface Strategy { id: string; name: string; description: string | null; rules: any; is_public: boolean; created_at: string }

const DEFAULT_RULES = {
  entry: { indicator: "ema_cross", fast: 20, slow: 50 },
  exit: { indicator: "ema_cross" },
  stopLossPct: 2,
  takeProfitPct: 6,
  trailingStopPct: 0,
  direction: "long",
  timeFilter: { session: "all" },
  mtfConfirm: { timeframe: "1D", trend: "up" },
  smc: { requireBOS: false, requireFVG: false, requireOB: false },
  volume: { minRvol: 1.0 },
};

function StrategiesPage() {
  const [items, setItems] = useState<Strategy[]>([]);
  const [editing, setEditing] = useState<Strategy | null>(null);
  const [name, setName] = useState("New strategy");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<any>(DEFAULT_RULES);
  const [isPublic, setIsPublic] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("strategies").select("*").order("created_at", { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const startNew = () => {
    setEditing(null); setName("New strategy"); setDescription(""); setRules(DEFAULT_RULES); setIsPublic(false);
  };
  const edit = (s: Strategy) => {
    setEditing(s); setName(s.name); setDescription(s.description ?? ""); setRules(s.rules || DEFAULT_RULES); setIsPublic(s.is_public);
  };

  const save = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (editing) {
      const { error } = await supabase.from("strategies").update({ name, description, rules, is_public: isPublic }).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Strategy updated");
    } else {
      const { error } = await supabase.from("strategies").insert({ user_id: user.id, name, description, rules, is_public: isPublic });
      if (error) return toast.error(error.message);
      toast.success("Strategy saved");
    }
    startNew(); load();
  };
  const duplicate = async (s: Strategy) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("strategies").insert({ user_id: user.id, name: `${s.name} (copy)`, description: s.description, rules: s.rules, is_public: false });
    load();
  };
  const remove = async (id: string) => { await supabase.from("strategies").delete().eq("id", id); load(); };

  const setR = (path: string, val: any) => {
    setRules((r: any) => {
      const clone = JSON.parse(JSON.stringify(r));
      const keys = path.split(".");
      let cur = clone;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] ??= {};
      cur[keys[keys.length - 1]] = val;
      return clone;
    });
  };

  return (
    <div>
      <PageHeader title="Strategy Builder" subtitle="Build no-code strategies. Save, duplicate, share, and backtest them." actions={
        <button onClick={startNew} className="text-xs bg-emerald text-primary-foreground px-3 py-1.5 rounded-full font-semibold">+ New</button>
      } />

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Section title="Entry conditions">
              <Row label="Indicator">
                <select value={rules.entry.indicator} onChange={(e) => setR("entry.indicator", e.target.value)} className={inp}>
                  <option value="ema_cross">EMA cross</option>
                  <option value="rsi_oversold">RSI oversold</option>
                  <option value="rsi_overbought">RSI overbought</option>
                  <option value="breakout">Breakout</option>
                </select>
              </Row>
              {rules.entry.indicator === "ema_cross" && <>
                <Row label="Fast EMA"><Num value={rules.entry.fast} onChange={(v) => setR("entry.fast", v)} /></Row>
                <Row label="Slow EMA"><Num value={rules.entry.slow} onChange={(v) => setR("entry.slow", v)} /></Row>
              </>}
              {(rules.entry.indicator === "rsi_oversold" || rules.entry.indicator === "rsi_overbought") && <>
                <Row label="Period"><Num value={rules.entry.period ?? 14} onChange={(v) => setR("entry.period", v)} /></Row>
                <Row label="Threshold"><Num value={rules.entry.threshold ?? (rules.entry.indicator === "rsi_oversold" ? 30 : 70)} onChange={(v) => setR("entry.threshold", v)} /></Row>
              </>}
              {rules.entry.indicator === "breakout" && <Row label="Lookback"><Num value={rules.entry.lookback ?? 20} onChange={(v) => setR("entry.lookback", v)} /></Row>}
              <Row label="Direction">
                <select value={rules.direction} onChange={(e) => setR("direction", e.target.value)} className={inp}>
                  <option value="long">Long only</option><option value="short">Short only</option><option value="both">Both</option>
                </select>
              </Row>
            </Section>

            <Section title="Exit & risk">
              <Row label="Exit signal">
                <select value={rules.exit?.indicator ?? "target_or_stop"} onChange={(e) => setR("exit.indicator", e.target.value)} className={inp}>
                  <option value="target_or_stop">Stop / Target only</option>
                  <option value="ema_cross">Opposite EMA cross</option>
                </select>
              </Row>
              <Row label="Stop-loss %"><Num value={rules.stopLossPct ?? 0} onChange={(v) => setR("stopLossPct", v)} step={0.1} /></Row>
              <Row label="Take-profit %"><Num value={rules.takeProfitPct ?? 0} onChange={(v) => setR("takeProfitPct", v)} step={0.1} /></Row>
              <Row label="Trailing stop %"><Num value={rules.trailingStopPct ?? 0} onChange={(v) => setR("trailingStopPct", v)} step={0.1} /></Row>
            </Section>

            <Section title="Time & MTF filter">
              <Row label="Session">
                <select value={rules.timeFilter?.session ?? "all"} onChange={(e) => setR("timeFilter.session", e.target.value)} className={inp}>
                  <option value="all">All hours</option><option value="open">First hour</option><option value="mid">Midday</option><option value="close">Last hour</option>
                </select>
              </Row>
              <Row label="MTF Trend TF">
                <select value={rules.mtfConfirm?.timeframe ?? "1D"} onChange={(e) => setR("mtfConfirm.timeframe", e.target.value)} className={inp}>
                  <option>1h</option><option>4h</option><option>1D</option><option>1W</option>
                </select>
              </Row>
              <Row label="MTF Trend Bias">
                <select value={rules.mtfConfirm?.trend ?? "up"} onChange={(e) => setR("mtfConfirm.trend", e.target.value)} className={inp}>
                  <option value="up">Up</option><option value="down">Down</option><option value="any">Any</option>
                </select>
              </Row>
            </Section>

            <Section title="SMC / ICT & Volume">
              <Toggle label="Require BOS" checked={!!rules.smc?.requireBOS} onChange={(v) => setR("smc.requireBOS", v)} />
              <Toggle label="Require FVG" checked={!!rules.smc?.requireFVG} onChange={(v) => setR("smc.requireFVG", v)} />
              <Toggle label="Require Order Block" checked={!!rules.smc?.requireOB} onChange={(v) => setR("smc.requireOB", v)} />
              <Row label="Min RVol"><Num value={rules.volume?.minRvol ?? 1} onChange={(v) => setR("volume.minRvol", v)} step={0.1} /></Row>
            </Section>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              <Share2 className="h-3 w-3" /> Share publicly
            </label>
            <button onClick={save} className="bg-emerald text-primary-foreground text-xs px-4 py-2 rounded-full font-semibold">{editing ? "Update" : "Save strategy"}</button>
          </div>
        </Panel>

        <Panel>
          <h3 className="text-sm font-semibold mb-3">My strategies</h3>
          <div className="space-y-2">
            {items.map((s) => (
              <div key={s.id} className="rounded-lg border border-white/5 bg-white/5 p-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.description || "—"}</div>
                    {s.is_public && <span className="text-[10px] uppercase text-emerald">Public</span>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Link to="/app/backtest" search={{ strategyId: s.id }} className="p-1 text-muted-foreground hover:text-emerald" title="Backtest"><PlayCircle className="h-4 w-4" /></Link>
                    <button onClick={() => edit(s)} className="text-xs text-emerald px-2">Edit</button>
                    <button onClick={() => duplicate(s)} className="p-1 text-muted-foreground hover:text-foreground" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(s.id)} className="p-1 text-muted-foreground hover:text-red-400" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">No strategies yet</div>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

const inp = "w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs";
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-white/5 bg-white/5 p-3 space-y-2"><div className="text-xs font-semibold text-emerald">{title}</div>{children}</div>;
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid grid-cols-[110px_1fr] items-center gap-2"><span className="text-xs text-muted-foreground">{label}</span>{children}</div>;
}
function Num({ value, onChange, step = 1 }: { value: number; onChange: (v: number) => void; step?: number }) {
  return <input type="number" step={step} value={value} onChange={(e) => onChange(+e.target.value)} className={inp} />;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}</label>;
}
