import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, pctClass } from "@/components/app/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { UNIVERSE } from "@/lib/services/mock";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/journal")({
  head: () => ({ meta: [{ title: "AI Trade Journal — TradeMind AI" }] }),
  component: JournalPage,
});

interface Trade {
  id: string; symbol: string; side: "long" | "short";
  entry: number | null; exit: number | null; sl: number | null;
  emotion: string | null; reason: string | null; strategy: string | null;
  ai_review_json: { strengths?: string; mistakes?: string; suggestion?: string; consistency?: number } | null;
  pnl: number | null; opened_at: string; closed_at: string | null;
}

function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ symbol: "RELIANCE", side: "long" as const, entry: 2800, exit: 2900, sl: 2760, emotion: "confident", reason: "SMC BOS + FVG retest", strategy: "SMC" });

  const load = async () => {
    const { data } = await supabase.from("trade_journal").select("*").order("opened_at", { ascending: false });
    setTrades((data || []) as Trade[]);
  };
  useEffect(() => { load(); }, []);

  const aiReview = (t: typeof form): Trade["ai_review_json"] => {
    const pnl = ((t.exit - t.entry) * (t.side === "long" ? 1 : -1));
    const risk = Math.abs(t.entry - t.sl);
    const rr = risk > 0 ? Math.abs(pnl / risk) : 0;
    const strengths = pnl > 0 ? "Correct bias, patient entry after retest, respected structure." : "Followed the plan, cut losses at pre-defined stop.";
    const mistakes = pnl < 0 ? "Entered before confirmation of BOS. Widen stop next time or wait for OB retest." : "Partial booking too early — left runners on the table.";
    const suggestion = `Target ${(rr + 0.5).toFixed(1)}R next similar setup. Journal with screenshot before entry.`;
    const consistency = Math.min(100, Math.round(50 + rr * 20));
    return { strengths, mistakes, suggestion, consistency };
  };

  const save = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const pnl = (form.exit - form.entry) * (form.side === "long" ? 1 : -1);
    const review = aiReview(form);
    const { error } = await supabase.from("trade_journal").insert({
      user_id: user.id, symbol: form.symbol, side: form.side,
      entry: form.entry, exit: form.exit, sl: form.sl,
      emotion: form.emotion, reason: form.reason, strategy: form.strategy,
      ai_review_json: review, pnl, closed_at: new Date().toISOString(),
    });
    if (error) return toast.error(error.message);
    setShow(false); toast.success("Trade logged with AI review"); load();
  };

  const remove = async (id: string) => {
    await supabase.from("trade_journal").delete().eq("id", id); load();
  };

  return (
    <div>
      <PageHeader title="AI Trade Journal" subtitle="Every trade auto-reviewed for strengths, mistakes, and consistency." actions={
        <button onClick={() => setShow(!show)} className="text-xs bg-emerald text-primary-foreground px-3 py-1.5 rounded-full font-semibold inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Log trade</button>
      } />

      {show && (
        <Panel className="mb-4">
          <div className="grid md:grid-cols-4 gap-3 text-xs">
            <label>Symbol
              <select value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5">{UNIVERSE.map((u) => <option key={u.symbol}>{u.symbol}</option>)}</select>
            </label>
            <label>Side
              <select value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value as "long" })} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5"><option>long</option><option>short</option></select>
            </label>
            <label>Entry<input type="number" value={form.entry} onChange={(e) => setForm({ ...form, entry: +e.target.value })} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5" /></label>
            <label>Exit<input type="number" value={form.exit} onChange={(e) => setForm({ ...form, exit: +e.target.value })} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5" /></label>
            <label>Stop Loss<input type="number" value={form.sl} onChange={(e) => setForm({ ...form, sl: +e.target.value })} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5" /></label>
            <label>Strategy<input value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5" /></label>
            <label>Emotion<input value={form.emotion} onChange={(e) => setForm({ ...form, emotion: e.target.value })} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5" /></label>
            <label className="md:col-span-4">Reason<textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5" /></label>
          </div>
          <button onClick={save} className="mt-3 bg-emerald text-primary-foreground px-4 py-1.5 rounded-full text-xs font-semibold">Log & AI Review</button>
        </Panel>
      )}

      <div className="space-y-3">
        {trades.map((t) => (
          <Panel key={t.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t.symbol}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.side === "long" ? "bg-emerald/10 text-emerald" : "bg-red-500/10 text-red-400"}`}>{t.side.toUpperCase()}</span>
                  <span className="text-xs text-muted-foreground">{t.strategy}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Entry ₹{t.entry} · Exit ₹{t.exit} · SL ₹{t.sl}</div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${pctClass(t.pnl ?? 0)}`}>₹{t.pnl?.toFixed(0)}</div>
                <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-red-400 mt-1"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            {t.ai_review_json && (
              <div className="mt-3 pt-3 border-t border-white/5 grid md:grid-cols-3 gap-3 text-xs">
                <div><div className="text-emerald font-semibold flex items-center gap-1"><Sparkles className="h-3 w-3" /> Strengths</div><div className="text-muted-foreground mt-1">{t.ai_review_json.strengths}</div></div>
                <div><div className="text-red-400 font-semibold">Mistakes</div><div className="text-muted-foreground mt-1">{t.ai_review_json.mistakes}</div></div>
                <div><div className="text-foreground font-semibold">Next time</div><div className="text-muted-foreground mt-1">{t.ai_review_json.suggestion}</div><div className="text-xs mt-1">Consistency <span className="text-emerald font-semibold">{t.ai_review_json.consistency}/100</span></div></div>
              </div>
            )}
          </Panel>
        ))}
        {trades.length === 0 && <Panel><div className="text-center py-8 text-muted-foreground text-sm">Log your first trade — AI will review it automatically.</div></Panel>}
      </div>
    </div>
  );
}
