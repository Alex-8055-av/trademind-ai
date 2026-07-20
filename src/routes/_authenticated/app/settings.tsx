import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/app/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/settings")({
  head: () => ({ meta: [{ title: "Settings — TradeMind AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (p) { setDisplayName(p.display_name || ""); setPlan(p.plan || "free"); }
    })();
  }, []);

  const save = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: displayName });
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile, preferences, and integrations." />
      <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
        <Panel>
          <h3 className="text-sm font-semibold mb-3">Profile</h3>
          <div className="space-y-3">
            <label className="block text-xs">Display name<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm" /></label>
            <label className="block text-xs">Email<input value={email} disabled className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-muted-foreground" /></label>
            <label className="block text-xs">Plan<div className="mt-1 inline-block bg-emerald/10 text-emerald px-3 py-1 rounded-full text-xs uppercase">{plan}</div></label>
            <button onClick={save} className="bg-emerald text-primary-foreground px-4 py-1.5 rounded-full text-xs font-semibold">Save</button>
          </div>
        </Panel>
        <Panel>
          <h3 className="text-sm font-semibold mb-3">Preferences</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <label className="flex items-center justify-between"><span>Dark mode</span><input type="checkbox" defaultChecked className="accent-emerald" /></label>
            <label className="flex items-center justify-between"><span>Email alerts</span><input type="checkbox" defaultChecked className="accent-emerald" /></label>
            <label className="flex items-center justify-between"><span>Push notifications</span><input type="checkbox" className="accent-emerald" /></label>
            <label className="flex items-center justify-between"><span>AI voice briefings (soon)</span><input type="checkbox" disabled className="accent-emerald" /></label>
          </div>
        </Panel>
        <Panel className="md:col-span-2">
          <h3 className="text-sm font-semibold mb-3">Integrations</h3>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            {[["Zerodha Kite", "Coming soon"], ["Upstox", "Coming soon"], ["Angel One", "Coming soon"], ["Interactive Brokers", "Coming soon"], ["TradingView Webhook", "Coming soon"], ["Telegram Alerts", "Coming soon"]].map(([n, s]) => (
              <div key={n} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-foreground">{n}</span>
                <span className="text-xs text-muted-foreground">{s}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
