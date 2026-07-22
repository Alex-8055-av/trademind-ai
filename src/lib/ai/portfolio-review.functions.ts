import { createServerFn } from "@tanstack/react-start";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Holding = z.object({
  symbol: z.string(),
  qty: z.number(),
  avg_price: z.number(),
  current_price: z.number(),
  sector: z.string().nullable().optional(),
});

const Input = z.object({
  holdings: z.array(Holding).min(1).max(200),
  cash: z.number().optional(),
});

const ReviewSchema = z.object({
  diversificationScore: z.number(),
  riskScore: z.number(),
  concentrationRisk: z.string(),
  sectorExposureSummary: z.string(),
  topPositionSuggestions: z.array(
    z.object({
      symbol: z.string(),
      action: z.string(),
      rationale: z.string(),
    }),
  ),
  rebalancingSuggestions: z.array(z.string()),
  longTermInsights: z.string(),
  disclaimer: z.string(),
});

export type PortfolioReview = z.infer<typeof ReviewSchema>;

export const reviewPortfolio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const invested = data.holdings.reduce((s, h) => s + h.qty * h.avg_price, 0);
    const current = data.holdings.reduce((s, h) => s + h.qty * h.current_price, 0);

    const gateway = createLovableAiGatewayProvider(key, { structuredOutputs: true });
    const model = gateway("openai/gpt-5.4-mini");

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: ReviewSchema }),
        system:
          "You are an institutional portfolio manager. Review the holdings and produce diversification (0-100), risk (0-100), concentration risk, sector exposure, position suggestions, and rebalancing ideas. Never guarantee returns. Include a clear educational disclaimer.",
        prompt: `Cash: ${data.cash ?? 0}\nInvested: ${invested.toFixed(0)}\nCurrent value: ${current.toFixed(0)}\nHoldings JSON:\n${JSON.stringify(data.holdings)}`,
      });
      return { review: output };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error))
        throw new Error("AI returned an unparseable review. Please retry.");
      throw error;
    }
  });
