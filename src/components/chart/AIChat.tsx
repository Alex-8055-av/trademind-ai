import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { chatWithCopilot } from "@/lib/ai/trade-analysis.functions";
import type { Timeframe } from "@/lib/market-data/types";

interface Msg { role: "user" | "assistant"; content: string; }

const STARTERS = [
  "Analyze this chart",
  "Where is the liquidity?",
  "Is there a valid Order Block?",
  "Explain like I'm a beginner",
  "Should I wait for a better entry?",
];

export function AIChat({ symbol, timeframe }: { symbol: string; timeframe: Timeframe }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chat = useServerFn(chatWithCopilot);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await chat({ data: { symbol, timeframe, messages: next } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed");
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel flex h-[560px] flex-col rounded-3xl">
      <div className="flex items-center gap-2 border-b border-white/5 px-5 py-4">
        <Sparkles className="h-4 w-4 text-emerald" />
        <p className="font-display text-sm font-semibold">AI Copilot</p>
        <span className="ml-auto rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-semibold text-emerald">
          {symbol} · {timeframe}
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Try asking:</p>
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-white/5"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user"
                ? "ml-8 bg-emerald/10 text-foreground"
                : "mr-8 border border-white/5 bg-white/[0.02] text-muted-foreground"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="mr-8 rounded-2xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-3 w-3 animate-pulse text-emerald" /> Thinking…
            </span>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 border-t border-white/5 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${symbol}…`}
          className="flex-1 rounded-full border border-white/5 bg-white/[0.02] px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald text-primary-foreground transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
