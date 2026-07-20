import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/app/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { UNIVERSE } from "@/lib/services/mock";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/alerts")({
  head: () => ({ meta: [{ title: "Smart Alerts — TradeMind AI" }] }),
  component: AlertsPage,
});

const KINDS = ["price","volume","breakout","breakdown","bos","choch","order_block","fvg","ema_cross","vwap_cross","rsi","macd","options_oi","sector_strength","news"] as const;
type Kind = typeof KINDS[number];

interface Alert { id: string; symbol: string; kind: Kind; condition_json: Record<string, unknown>; is_active: boolean; created_at: string; triggered_at: string | null }

function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [form, setForm] = useState({ symbol: "RELIANCE", kind: "price" as Kind, threshold: 2900 });
  const [show, setShow] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("alerts").select("*").order("created_at", { ascending: false });
    setAlerts((data || []) as Alert[]);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("alerts").insert({
      user_id: user.id, symbol: form.symbol, kind: form.kind,
      condition_json: { threshold: form.threshold },
    });
    if (error) return toast.error(error.message);
    setShow(false); load(); toast.success("Alert created");
  };

  const toggle = async (a: Alert) => {
    await supabase.from("alerts").update({ is_active: !a.is_active }).eq("id", a.id);
    load();
  };
  const remove = async (id: string) => {
    await supabase.from("alerts").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <PageHeader title="Smart Alerts" subtitle="In-app, email, and push notifications for price, volume, structure, and news." actions={
        <button onClick={() => setShow(!show)} className="text-xs bg-emerald text-primary-foreground px-3 py-1.5 rounded-full font-semibold inline-flex items-center gap-1"><Plus className="h-3 w-3" /> New alert</button>
      } />

      {show && (
        <Panel className="mb-4">
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Symbol</div>
              <select value={form.symbol} onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm">
                {UNIVERSE.map((u) => <option key={u.symbol}>{u.symbol}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Trigger</div>
              <select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as Kind }))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm">
                {KINDS.map((k) => <option key={k} value={k}>{k.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Threshold</div>
              <input type="number" value={form.threshold} onChange={(e) => setForm((f) => ({ ...f, threshold: +e.target.value }))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm w-28" />
            </div>
            <button onClick={create} className="bg-emerald text-primary-foreground px-4 py-1.5 rounded-full text-xs font-semibold">Create</button>
          </div>
        </Panel>
      )}

      <Panel className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground text-left">
            <tr><th className="p-2">Symbol</th><th className="p-2">Trigger</th><th className="p-2">Condition</th><th className="p-2">Status</th><th className="p-2">Created</th><th></th></tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} className="border-t border-white/5">
                <td className="p-2 font-medium">{a.symbol}</td>
                <td className="p-2 text-muted-foreground uppercase text-xs">{a.kind.replace(/_/g, " ")}</td>
                <td className="p-2 text-muted-foreground text-xs">{JSON.stringify(a.condition_json)}</td>
                <td className="p-2"><button onClick={() => toggle(a)} className={`text-xs px-2 py-0.5 rounded-full ${a.is_active ? "bg-emerald/10 text-emerald" : "bg-white/10 text-muted-foreground"}`}>{a.is_active ? "active" : "paused"}</button></td>
                <td className="p-2 text-muted-foreground text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="p-2 text-right"><button onClick={() => remove(a.id)} className="text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}
            {alerts.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground text-sm">No alerts yet — create your first</td></tr>}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
