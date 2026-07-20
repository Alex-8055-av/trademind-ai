import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, pctClass } from "@/components/app/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { UNIVERSE } from "@/lib/services/mock";
import { Plus, Trash2, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/watchlist")({
  head: () => ({ meta: [{ title: "Watchlist — TradeMind AI" }] }),
  component: WatchlistPage,
});

interface WL { id: string; name: string; color: string; is_pinned: boolean }
interface Item { id: string; watchlist_id: string; symbol: string; note: string | null; tag_color: string | null; ai_score: number | null }

function WatchlistPage() {
  const [lists, setLists] = useState<WL[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string | null>(null);

  const load = async () => {
    const { data: ls } = await supabase.from("watchlists").select("*").order("is_pinned", { ascending: false }).order("created_at");
    setLists(ls || []);
    if (ls?.length && !active) setActive(ls[0].id);
    const { data: is } = await supabase.from("watchlist_items").select("*");
    setItems(is || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const name = prompt("Watchlist name?", "My Watchlist");
    if (!name) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("watchlists").insert({ user_id: user.id, name }).select().single();
    if (error) return toast.error(error.message);
    setActive(data.id); load();
  };

  const togglePin = async (l: WL) => {
    await supabase.from("watchlists").update({ is_pinned: !l.is_pinned }).eq("id", l.id);
    load();
  };

  const addItem = async () => {
    if (!active) return;
    const symbol = prompt("Symbol?", "RELIANCE")?.toUpperCase();
    if (!symbol) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ai_score = Math.round(Math.random() * 40 + 60) / 10;
    const { error } = await supabase.from("watchlist_items").insert({ user_id: user.id, watchlist_id: active, symbol, ai_score });
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("watchlist_items").delete().eq("id", id);
    load();
  };

  const activeItems = items.filter((i) => i.watchlist_id === active);

  return (
    <div>
      <PageHeader title="Watchlists" subtitle="Multiple watchlists, pinned lists, AI scores, and quick notes." actions={
        <button onClick={create} className="text-xs bg-emerald text-primary-foreground px-3 py-1.5 rounded-full font-semibold">+ New watchlist</button>
      } />

      {lists.length === 0 ? (
        <Panel><div className="text-center py-8"><p className="text-muted-foreground mb-3">No watchlists yet</p><button onClick={create} className="bg-emerald text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">Create watchlist</button></div></Panel>
      ) : (
        <div className="grid md:grid-cols-[220px_1fr] gap-4">
          <Panel>
            <div className="space-y-1">
              {lists.map((l) => (
                <div key={l.id} className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-sm ${active === l.id ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5"}`} onClick={() => setActive(l.id)}>
                  <span className="truncate">{l.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); togglePin(l); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground">
                    {l.is_pinned ? <Pin className="h-3 w-3 text-emerald" /> : <PinOff className="h-3 w-3" />}
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="overflow-x-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold">{lists.find((l) => l.id === active)?.name ?? "—"}</h3>
              <button onClick={addItem} className="text-xs text-emerald inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add symbol</button>
            </div>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground text-left">
                <tr><th className="p-2">Symbol</th><th className="p-2">Sector</th><th className="p-2 text-right">Price</th><th className="p-2 text-right">%Chg</th><th className="p-2 text-right">AI Score</th><th></th></tr>
              </thead>
              <tbody>
                {activeItems.map((i) => {
                  const u = UNIVERSE.find((x) => x.symbol === i.symbol);
                  const chg = (i.symbol.charCodeAt(0) % 12) - 6;
                  return (
                    <tr key={i.id} className="border-t border-white/5">
                      <td className="p-2 font-medium">{i.symbol}</td>
                      <td className="p-2 text-muted-foreground">{u?.sector ?? "—"}</td>
                      <td className="p-2 text-right">₹{u?.price ?? "—"}</td>
                      <td className={`p-2 text-right ${pctClass(chg)}`}>{chg > 0 ? "+" : ""}{chg}%</td>
                      <td className="p-2 text-right"><span className="bg-emerald/10 text-emerald px-2 py-0.5 rounded-full text-xs">{i.ai_score ?? "—"}</span></td>
                      <td className="p-2 text-right"><button onClick={() => remove(i.id)} className="text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  );
                })}
                {activeItems.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground text-sm">Empty — add symbols</td></tr>}
              </tbody>
            </table>
          </Panel>
        </div>
      )}
    </div>
  );
}
