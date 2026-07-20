import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Stat, pctClass } from "@/components/app/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { UNIVERSE } from "@/lib/services/mock";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — TradeMind AI" }] }),
  component: PortfolioPage,
});

interface Portfolio { id: string; name: string; base_currency: string }
interface Holding { id: string; portfolio_id: string; symbol: string; qty: number; avg_price: number; sector: string | null }

function currentPrice(sym: string): number {
  return UNIVERSE.find((u) => u.symbol === sym)?.price ?? 100;
}

function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ symbol: "RELIANCE", qty: 10, avg_price: 2800 });

  const load = async () => {
    const { data: pfs } = await supabase.from("portfolios").select("*").order("created_at");
    setPortfolios(pfs || []);
    if (pfs?.length && !active) setActive(pfs[0].id);
    const { data: hs } = await supabase.from("holdings").select("*");
    setHoldings(hs || []);
  };

  useEffect(() => { load(); }, []);

  const createPortfolio = async () => {
    const name = prompt("Portfolio name?", "Long term");
    if (!name) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("portfolios").insert({ user_id: user.id, name }).select().single();
    if (error) return toast.error(error.message);
    setActive(data.id);
    load();
  };

  const addHolding = async () => {
    if (!active) return toast.error("Create a portfolio first");
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const sector = UNIVERSE.find((u) => u.symbol === form.symbol)?.sector ?? null;
    const { error } = await supabase.from("holdings").insert({ user_id: user.id, portfolio_id: active, symbol: form.symbol, qty: form.qty, avg_price: form.avg_price, sector });
    setBusy(false);
    if (error) return toast.error(error.message);
    setShowAdd(false); load();
  };

  const removeHolding = async (id: string) => {
    await supabase.from("holdings").delete().eq("id", id);
    load();
  };

  const activeHoldings = holdings.filter((h) => h.portfolio_id === active);
  const invested = activeHoldings.reduce((s, h) => s + h.qty * h.avg_price, 0);
  const currentValue = activeHoldings.reduce((s, h) => s + h.qty * currentPrice(h.symbol), 0);
  const pnl = currentValue - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

  const sectorAlloc = activeHoldings.reduce<Record<string, number>>((acc, h) => {
    const sec = h.sector ?? "Other";
    acc[sec] = (acc[sec] || 0) + h.qty * currentPrice(h.symbol);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Portfolio" subtitle="Track your holdings, P&L, allocation, and portfolio risk." actions={
        <button onClick={createPortfolio} className="text-xs bg-emerald text-primary-foreground px-3 py-1.5 rounded-full font-semibold">+ New portfolio</button>
      } />

      {portfolios.length === 0 ? (
        <Panel>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-3">No portfolios yet</p>
            <button onClick={createPortfolio} className="bg-emerald text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">Create your first portfolio</button>
          </div>
        </Panel>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            {portfolios.map((p) => (
              <button key={p.id} onClick={() => setActive(p.id)} className={`px-3 py-1.5 rounded-full text-xs ${active === p.id ? "bg-emerald text-primary-foreground" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}>{p.name}</button>
            ))}
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Stat label="Invested" value={`₹${invested.toLocaleString()}`} />
            <Stat label="Current Value" value={`₹${currentValue.toLocaleString()}`} />
            <Stat label="P&L" value={`₹${pnl.toFixed(0)}`} tone={pnl >= 0 ? "up" : "down"} />
            <Stat label="Return" value={`${pnlPct.toFixed(2)}%`} tone={pnl >= 0 ? "up" : "down"} />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mb-4">
            <Panel className="lg:col-span-2 overflow-x-auto">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold">Holdings</h3>
                <button onClick={() => setShowAdd(!showAdd)} className="text-xs text-emerald inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
              </div>
              {showAdd && (
                <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-white/5">
                  <select value={form.symbol} onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs">
                    {UNIVERSE.map((u) => <option key={u.symbol}>{u.symbol}</option>)}
                  </select>
                  <input type="number" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: +e.target.value }))} placeholder="Qty" className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs w-20" />
                  <input type="number" value={form.avg_price} onChange={(e) => setForm((f) => ({ ...f, avg_price: +e.target.value }))} placeholder="Avg" className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs w-24" />
                  <button disabled={busy} onClick={addHolding} className="text-xs bg-emerald text-primary-foreground px-3 py-1 rounded-full font-semibold">Save</button>
                </div>
              )}
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground text-left">
                  <tr><th className="p-2">Symbol</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Avg</th><th className="p-2 text-right">LTP</th><th className="p-2 text-right">P&L</th><th></th></tr>
                </thead>
                <tbody>
                  {activeHoldings.map((h) => {
                    const ltp = currentPrice(h.symbol);
                    const pl = (ltp - h.avg_price) * h.qty;
                    return (
                      <tr key={h.id} className="border-t border-white/5">
                        <td className="p-2 font-medium">{h.symbol}</td>
                        <td className="p-2 text-right">{h.qty}</td>
                        <td className="p-2 text-right">₹{h.avg_price}</td>
                        <td className="p-2 text-right">₹{ltp}</td>
                        <td className={`p-2 text-right ${pctClass(pl)}`}>₹{pl.toFixed(0)}</td>
                        <td className="p-2 text-right"><button onClick={() => removeHolding(h.id)} className="text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button></td>
                      </tr>
                    );
                  })}
                  {activeHoldings.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground text-sm">No holdings yet</td></tr>}
                </tbody>
              </table>
            </Panel>

            <Panel>
              <h3 className="text-sm font-semibold mb-3">Sector allocation</h3>
              <div className="space-y-2">
                {Object.entries(sectorAlloc).map(([sec, val]) => {
                  const pct = (val / currentValue) * 100;
                  return (
                    <div key={sec} className="text-xs">
                      <div className="flex justify-between mb-1"><span>{sec}</span><span className="text-muted-foreground">{pct.toFixed(1)}%</span></div>
                      <div className="h-1.5 bg-white/5 rounded-full"><div className="h-full bg-emerald rounded-full" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
                {Object.keys(sectorAlloc).length === 0 && <div className="text-muted-foreground text-xs">Add holdings to see allocation</div>}
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
