import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, Stat, pctClass } from "@/components/app/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { UNIVERSE } from "@/lib/services/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/paper")({
  head: () => ({
    meta: [
      { title: "Paper Trading — TradeMind AI" },
      { name: "description", content: "Practice trading with a virtual portfolio, live P&L, and full order history." },
    ],
  }),
  component: PaperTradingPage,
});

interface Account { id: string; name: string; starting_balance: number; cash: number; currency: string }
interface Order { id: string; account_id: string; symbol: string; side: "buy"|"sell"; order_type: string; qty: number; filled_price: number | null; status: string; pnl: number | null; created_at: string; filled_at: string | null }
interface Position { id: string; account_id: string; symbol: string; qty: number; avg_price: number }

function ltp(sym: string): number {
  return UNIVERSE.find((u) => u.symbol === sym)?.price ?? 100;
}

function PaperTradingPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [form, setForm] = useState({ symbol: "RELIANCE", side: "buy" as "buy"|"sell", qty: 10 });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: accs } = await supabase.from("paper_accounts").select("*").order("created_at");
    setAccounts(accs || []);
    if (accs?.length && !active) setActive(accs[0].id);
    const { data: ords } = await supabase.from("paper_orders").select("*").order("created_at", { ascending: false });
    setOrders((ords || []) as Order[]);
    const { data: pos } = await supabase.from("paper_positions").select("*");
    setPositions(pos || []);
  };

  useEffect(() => { load(); }, []);

  const createAccount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("paper_accounts").insert({ user_id: user.id, name: "Paper A/C" }).select().single();
    if (error) return toast.error(error.message);
    setActive(data.id); load();
  };

  const placeOrder = async () => {
    if (!active) return toast.error("Create an account first");
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }
    const price = ltp(form.symbol);
    const account = accounts.find((a) => a.id === active)!;
    const notional = price * form.qty;

    // update cash + position atomically-ish (best-effort in mock)
    if (form.side === "buy") {
      if (notional > account.cash) { setBusy(false); return toast.error("Insufficient virtual cash"); }
      const existing = positions.find((p) => p.account_id === active && p.symbol === form.symbol);
      const newQty = (existing?.qty ?? 0) + form.qty;
      const newAvg = existing ? ((existing.avg_price * existing.qty) + notional) / newQty : price;
      if (existing) {
        await supabase.from("paper_positions").update({ qty: newQty, avg_price: newAvg }).eq("id", existing.id);
      } else {
        await supabase.from("paper_positions").insert({ user_id: user.id, account_id: active, symbol: form.symbol, qty: form.qty, avg_price: price });
      }
      await supabase.from("paper_accounts").update({ cash: account.cash - notional }).eq("id", active);
      await supabase.from("paper_orders").insert({ user_id: user.id, account_id: active, symbol: form.symbol, side: "buy", qty: form.qty, filled_price: price, status: "filled", filled_at: new Date().toISOString() });
    } else {
      const existing = positions.find((p) => p.account_id === active && p.symbol === form.symbol);
      if (!existing || existing.qty < form.qty) { setBusy(false); return toast.error("No position to sell"); }
      const pnl = (price - existing.avg_price) * form.qty;
      const newQty = existing.qty - form.qty;
      if (newQty === 0) await supabase.from("paper_positions").delete().eq("id", existing.id);
      else await supabase.from("paper_positions").update({ qty: newQty }).eq("id", existing.id);
      await supabase.from("paper_accounts").update({ cash: account.cash + notional }).eq("id", active);
      await supabase.from("paper_orders").insert({ user_id: user.id, account_id: active, symbol: form.symbol, side: "sell", qty: form.qty, filled_price: price, status: "filled", pnl, filled_at: new Date().toISOString() });
    }
    setBusy(false);
    toast.success(`${form.side.toUpperCase()} ${form.qty} ${form.symbol} @ ₹${price}`);
    load();
  };

  const accPositions = positions.filter((p) => p.account_id === active);
  const accOrders = orders.filter((o) => o.account_id === active);
  const account = accounts.find((a) => a.id === active);
  const positionsValue = accPositions.reduce((s, p) => s + p.qty * ltp(p.symbol), 0);
  const equity = (account?.cash ?? 0) + positionsValue;
  const totalPnl = equity - (account?.starting_balance ?? 0);
  const totalPnlPct = account?.starting_balance ? (totalPnl / account.starting_balance) * 100 : 0;

  const now = Date.now();
  const pnlSince = (ms: number) => accOrders.filter((o) => o.pnl && new Date(o.created_at).getTime() > now - ms).reduce((s, o) => s + (o.pnl || 0), 0);
  const pnlDaily = useMemo(() => pnlSince(24 * 3600 * 1000), [accOrders]);
  const pnlWeekly = useMemo(() => pnlSince(7 * 24 * 3600 * 1000), [accOrders]);
  const pnlMonthly = useMemo(() => pnlSince(30 * 24 * 3600 * 1000), [accOrders]);

  return (
    <div>
      <PageHeader
        title="Paper Trading"
        subtitle="Virtual account. Practice without risk. All trades are simulated."
        actions={<button onClick={createAccount} className="text-xs bg-emerald text-primary-foreground px-3 py-1.5 rounded-full font-semibold">+ New account</button>}
      />

      {accounts.length === 0 ? (
        <Panel>
          <div className="text-center py-10">
            <p className="text-muted-foreground mb-3">No paper accounts yet</p>
            <button onClick={createAccount} className="bg-emerald text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">Create virtual account</button>
          </div>
        </Panel>
      ) : (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {accounts.map((a) => (
              <button key={a.id} onClick={() => setActive(a.id)} className={`px-3 py-1.5 rounded-full text-xs ${active === a.id ? "bg-emerald text-primary-foreground" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}>{a.name}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Stat label="Equity" value={`₹${equity.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            <Stat label="Cash" value={`₹${(account?.cash ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            <Stat label="Total P&L" value={`₹${totalPnl.toFixed(0)}`} sub={`${totalPnlPct.toFixed(2)}%`} tone={totalPnl >= 0 ? "up" : "down"} />
            <Stat label="Positions" value={String(accPositions.length)} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Stat label="Daily P&L" value={`₹${pnlDaily.toFixed(0)}`} tone={pnlDaily >= 0 ? "up" : "down"} />
            <Stat label="Weekly P&L" value={`₹${pnlWeekly.toFixed(0)}`} tone={pnlWeekly >= 0 ? "up" : "down"} />
            <Stat label="Monthly P&L" value={`₹${pnlMonthly.toFixed(0)}`} tone={pnlMonthly >= 0 ? "up" : "down"} />
          </div>

          <Panel className="mb-4">
            <h3 className="text-sm font-semibold mb-3">Place order</h3>
            <div className="flex flex-wrap gap-2 items-center">
              <select value={form.symbol} onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
                {UNIVERSE.map((u) => <option key={u.symbol}>{u.symbol}</option>)}
              </select>
              <select value={form.side} onChange={(e) => setForm((f) => ({ ...f, side: e.target.value as "buy"|"sell" }))} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
                <option value="buy">BUY</option><option value="sell">SELL</option>
              </select>
              <input type="number" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: +e.target.value }))} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs w-24" />
              <div className="text-xs text-muted-foreground">LTP ₹{ltp(form.symbol)}</div>
              <button disabled={busy} onClick={placeOrder} className="text-xs bg-emerald text-primary-foreground px-4 py-1.5 rounded-full font-semibold disabled:opacity-50">Place</button>
            </div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel className="overflow-x-auto">
              <h3 className="text-sm font-semibold mb-3">Open positions</h3>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground text-left">
                  <tr><th className="p-2">Symbol</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Avg</th><th className="p-2 text-right">LTP</th><th className="p-2 text-right">P&L</th></tr>
                </thead>
                <tbody>
                  {accPositions.map((p) => {
                    const l = ltp(p.symbol); const pl = (l - p.avg_price) * p.qty;
                    return (
                      <tr key={p.id} className="border-t border-white/5">
                        <td className="p-2 font-medium">{p.symbol}</td>
                        <td className="p-2 text-right">{p.qty}</td>
                        <td className="p-2 text-right">₹{p.avg_price.toFixed(2)}</td>
                        <td className="p-2 text-right">₹{l}</td>
                        <td className={`p-2 text-right ${pctClass(pl)}`}>₹{pl.toFixed(0)}</td>
                      </tr>
                    );
                  })}
                  {accPositions.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground text-sm">No open positions</td></tr>}
                </tbody>
              </table>
            </Panel>

            <Panel className="overflow-x-auto">
              <h3 className="text-sm font-semibold mb-3">Order history</h3>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground text-left">
                  <tr><th className="p-2">Time</th><th className="p-2">Sym</th><th className="p-2">Side</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Px</th><th className="p-2 text-right">P&L</th></tr>
                </thead>
                <tbody>
                  {accOrders.slice(0, 30).map((o) => (
                    <tr key={o.id} className="border-t border-white/5">
                      <td className="p-2 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                      <td className="p-2 font-medium">{o.symbol}</td>
                      <td className={`p-2 uppercase text-xs ${o.side === "buy" ? "text-emerald" : "text-red-400"}`}>{o.side}</td>
                      <td className="p-2 text-right">{o.qty}</td>
                      <td className="p-2 text-right">₹{o.filled_price}</td>
                      <td className={`p-2 text-right ${pctClass(o.pnl ?? 0)}`}>{o.pnl != null ? `₹${o.pnl.toFixed(0)}` : "—"}</td>
                    </tr>
                  ))}
                  {accOrders.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground text-sm">No orders yet</td></tr>}
                </tbody>
              </table>
            </Panel>
          </div>

          <p className="text-xs text-muted-foreground mt-4">⚠️ Simulated trades using mock market prices. Not investment advice. Real trading involves risk of loss.</p>
        </>
      )}
    </div>
  );
}
