import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getMarketDataProvider } from "@/lib/market-data";
import { runBacktest, type BacktestResult, type StrategyRules, type BacktestParams } from "@/lib/backtest/engine";

const TF = ["1m","3m","5m","10m","15m","30m","45m","1h","2h","4h","1D","1W","1M"] as const;

const Input = z.object({
  symbol: z.string().min(1).max(20),
  timeframe: z.enum(TF),
  bars: z.number().int().min(50).max(2000).default(500),
  rules: z.any(),
  params: z.object({
    capital: z.number().positive(),
    commissionPct: z.number().min(0).max(5),
    slippagePct: z.number().min(0).max(5),
    riskPerTradePct: z.number().min(0.1).max(50),
  }),
});

export const runBacktestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<BacktestResult> => {
    const provider = await getMarketDataProvider();
    const candles = await provider.getCandles(data.symbol, data.timeframe, data.bars);
    return runBacktest(candles, data.rules as StrategyRules, data.params as BacktestParams);
  });
