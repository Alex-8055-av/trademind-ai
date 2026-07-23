import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getMarketDataProvider } from "./index";
import type { Quote } from "./types";

const QuotesInput = z.object({
  symbols: z.array(z.string().min(1).max(20)).min(1).max(50),
});

/**
 * Public streaming quotes endpoint. Called on a short polling interval from
 * the client (via useLiveQuotes) to simulate real-time WebSocket streaming
 * while keeping provider API keys server-side.
 */
export const fetchQuotes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => QuotesInput.parse(input))
  .handler(async ({ data }): Promise<{ quotes: Record<string, Quote>; provider: string }> => {
    const provider = await getMarketDataProvider();
    const out: Record<string, Quote> = {};

    // Prefer provider batch getQuotes when available.
    const anyProv = provider as unknown as {
      getQuotes?: (symbols: string[]) => Promise<Record<string, Quote>>;
      getQuote?: (symbol: string) => Promise<Quote>;
    };
    if (typeof anyProv.getQuotes === "function") {
      try {
        return { quotes: await anyProv.getQuotes(data.symbols), provider: provider.name };
      } catch (err) {
        console.warn("[fetchQuotes] batch failed, falling back", err);
      }
    }

    await Promise.all(
      data.symbols.map(async (sym) => {
        try {
          if (typeof anyProv.getQuote === "function") {
            out[sym] = await anyProv.getQuote(sym);
            return;
          }
          const candles = await provider.getCandles(sym, "1m", 2);
          const last = candles[candles.length - 1];
          const prev = candles[candles.length - 2] ?? last;
          if (!last) return;
          const change = last.close - prev.close;
          out[sym] = {
            symbol: sym,
            price: last.close,
            change,
            changePct: prev.close ? (change / prev.close) * 100 : 0,
            volume: last.volume,
            timestamp: last.time,
          };
        } catch (err) {
          console.warn(`[fetchQuotes] ${sym} failed`, err);
        }
      }),
    );
    return { quotes: out, provider: provider.name };
  });
