import { createServerFn } from "@tanstack/react-start";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getMarketDataProvider } from "@/lib/market-data";
import type { Candle, Timeframe } from "@/lib/market-data/types";

const TF_VALUES = [
  "1m","3m","5m","10m","15m","30m","45m","1h","2h","4h","1D","1W","1M",
] as const;

const AnalyzeInput = z.object({
  symbol: z.string().min(1).max(20),
  timeframe: z.enum(TF_VALUES),
});

// Constraint-free schema (limits go in the prompt, we clamp in code).
const ReportSchema = z.object({
  bias: z.string(),
  overallTrend: z.string(),
  bullishProbability: z.number(),
  bearishProbability: z.number(),
  confidence: z.string(),
  tradeQuality: z.number(),
  riskLevel: z.string(),
  volatility: z.string(),
  institutionalStrength: z.string(),
  marketStructure: z.string(),
  liquidity: z.string(),
  smartMoneyConcepts: z.string(),
  ictConcepts: z.string(),
  patterns: z.string(),
  candlestickSignals: z.string(),
  indicators: z.string(),
  multiTimeframe: z.string(),
  tradePlan: z.object({
    direction: z.string(),
    entry: z.string(),
    stopLoss: z.string(),
    target1: z.string(),
    target2: z.string(),
    target3: z.string(),
    riskReward: z.string(),
    invalidation: z.string(),
    duration: z.string(),
    positionSizingNote: z.string(),
  }),
  beginnerExplanation: z.string(),
  professionalExplanation: z.string(),
  disclaimer: z.string(),
});

export type TradeReport = z.infer<typeof ReportSchema>;

function ema(values: number[], period: number): number {
  const k = 2 / (period + 1);
  let e = values[0];
  for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}

function rsi(values: number[], period = 14): number {
  if (values.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const avgG = gains / period, avgL = losses / period;
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

function buildSnapshot(symbol: string, timeframe: Timeframe, candles: Candle[]) {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const last = candles[candles.length - 1];
  const first = candles[0];
  const pctChange = ((last.close - first.close) / first.close) * 100;
  const hi = Math.max(...highs);
  const lo = Math.min(...lows);
  const avgVol = candles.reduce((s, c) => s + c.volume, 0) / candles.length;
  const recentVol = candles.slice(-10).reduce((s, c) => s + c.volume, 0) / 10;

  return {
    symbol,
    timeframe,
    lastClose: last.close.toFixed(2),
    sessionHigh: hi.toFixed(2),
    sessionLow: lo.toFixed(2),
    rangePct: (((hi - lo) / lo) * 100).toFixed(2),
    changePct: pctChange.toFixed(2),
    ema20: ema(closes.slice(-60), 20).toFixed(2),
    ema50: ema(closes.slice(-120) ?? closes, 50).toFixed(2),
    ema200: ema(closes, 200).toFixed(2),
    rsi14: rsi(closes, 14).toFixed(1),
    avgVolume: Math.round(avgVol),
    recentVolume: Math.round(recentVol),
    candleCount: candles.length,
    recentCandles: candles.slice(-20).map((c) => ({
      o: +c.open.toFixed(2), h: +c.high.toFixed(2),
      l: +c.low.toFixed(2), c: +c.close.toFixed(2), v: c.volume,
    })),
  };
}

const SYSTEM_PROMPT = `You are TradeMind AI — a panel of institutional traders, ICT experts, Smart Money Concept specialists, quantitative analysts and hedge fund analysts.
Analyse the market data snapshot and produce an INSTITUTIONAL-GRADE trading report.
Rules:
- Never guarantee profits. Always explain uncertainty.
- Bullish + bearish probability should sum to roughly 100 (0-100 each).
- tradeQuality is 0-10 with one decimal.
- Use SMC/ICT vocabulary (BOS, CHOCH, MSS, Order Block, FVG, liquidity sweep, premium/discount, OTE, etc.) where it genuinely applies.
- Reference concrete price levels from the snapshot in tradePlan (entry, SL, targets).
- Include a clear educational disclaimer.`;

export const analyzeSymbol = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const provider = getMarketDataProvider();
    const candles = await provider.getCandles(data.symbol, data.timeframe, 300);
    const snapshot = buildSnapshot(data.symbol, data.timeframe, candles);

    const gateway = createLovableAiGatewayProvider(key, { structuredOutputs: true });
    const model = gateway("openai/gpt-5.4-mini");

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: ReportSchema }),
        system: SYSTEM_PROMPT,
        prompt: `Symbol: ${data.symbol}\nTimeframe: ${data.timeframe}\nSnapshot JSON:\n${JSON.stringify(snapshot)}`,
      });
      return { report: output, snapshot: { lastClose: snapshot.lastClose, changePct: snapshot.changePct, rsi14: snapshot.rsi14 } };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("The AI returned an unparseable report. Please retry.");
      }
      throw error;
    }
  });

const ChatInput = z.object({
  symbol: z.string().min(1).max(20).optional(),
  timeframe: z.enum(TF_VALUES).optional(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(4000),
  })).min(1).max(30),
});

export const chatWithCopilot = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const provider = getMarketDataProvider();
    let contextBlock = "No active chart symbol.";
    if (data.symbol && data.timeframe) {
      const candles = await provider.getCandles(data.symbol, data.timeframe, 200);
      const snap = buildSnapshot(data.symbol, data.timeframe, candles);
      contextBlock = `Active chart context:\n${JSON.stringify(snap)}`;
    }

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("openai/gpt-5.4-mini");

    const { text } = await generateText({
      model,
      system: `${SYSTEM_PROMPT}\nYou are also a friendly copilot. Answer conversationally using SMC/ICT vocabulary. Offer both a beginner and pro perspective when relevant. Refuse to guarantee profits.`,
      messages: [
        { role: "user", content: contextBlock },
        ...data.messages,
      ],
    });
    return { reply: text };
  });

const ImageInput = z.object({
  imageDataUrl: z.string().min(20).max(15_000_000),
  question: z.string().max(2000).optional(),
});

export const analyzeChartImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ImageInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("openai/gpt-5.5");

    const question = data.question?.trim() ||
      "Analyse this trading chart as an institutional trader. Identify trend, market structure (BOS/CHOCH/MSS), liquidity pools, order blocks, fair value gaps, key support/resistance, candlestick patterns, and provide an institutional trade plan (entry, stop, targets, invalidation). Add beginner + pro explanations and a disclaimer. Format with clear markdown headings.";

    const { text } = await generateText({
      model,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: question },
            { type: "image", image: data.imageDataUrl },
          ],
        },
      ],
    });
    return { analysis: text };
  });
