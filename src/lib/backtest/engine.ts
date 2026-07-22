import type { Candle } from "@/lib/market-data/types";

export interface StrategyRules {
  entry: { indicator: "ema_cross" | "rsi_oversold" | "rsi_overbought" | "breakout"; fast?: number; slow?: number; period?: number; threshold?: number; lookback?: number };
  exit?: { indicator: "ema_cross" | "rsi_neutral" | "target_or_stop" };
  stopLossPct?: number;
  takeProfitPct?: number;
  trailingStopPct?: number;
  direction?: "long" | "short" | "both";
}

export interface BacktestParams {
  capital: number;
  commissionPct: number;
  slippagePct: number;
  riskPerTradePct: number;
}

export interface BacktestTrade {
  entryTime: number; exitTime: number;
  side: "long" | "short";
  entry: number; exit: number;
  qty: number; pnl: number; pnlPct: number;
  reason: string;
}

export interface BacktestResult {
  metrics: {
    trades: number; wins: number; losses: number;
    winRate: number; profitFactor: number;
    totalPnl: number; totalReturnPct: number;
    sharpe: number; maxDrawdownPct: number;
    avgWin: number; avgLoss: number;
    finalEquity: number;
  };
  equityCurve: { t: number; equity: number }[];
  trades: BacktestTrade[];
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let e = values[0];
  out.push(e);
  for (let i = 1; i < values.length; i++) {
    e = values[i] * k + e * (1 - k);
    out.push(e);
  }
  return out;
}

function rsiSeries(values: number[], period = 14): number[] {
  const out: number[] = new Array(values.length).fill(50);
  for (let i = period; i < values.length; i++) {
    let g = 0, l = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const d = values[j] - values[j - 1];
      if (d >= 0) g += d; else l -= d;
    }
    const avgG = g / period, avgL = l / period;
    out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  }
  return out;
}

export function runBacktest(candles: Candle[], rules: StrategyRules, params: BacktestParams): BacktestResult {
  const closes = candles.map((c) => c.close);
  const fast = ema(closes, rules.entry.fast ?? 20);
  const slow = ema(closes, rules.entry.slow ?? 50);
  const rsiArr = rsiSeries(closes, rules.entry.period ?? 14);
  const lookback = rules.entry.lookback ?? 20;

  const direction = rules.direction ?? "long";
  let equity = params.capital;
  const equityCurve: { t: number; equity: number }[] = [];
  const trades: BacktestTrade[] = [];

  let position: null | { side: "long" | "short"; entry: number; qty: number; entryTime: number; peak: number } = null;
  const commission = params.commissionPct / 100;
  const slip = params.slippagePct / 100;
  const risk = params.riskPerTradePct / 100;

  const entrySignal = (i: number): "long" | "short" | null => {
    if (i < 2) return null;
    if (rules.entry.indicator === "ema_cross") {
      const crossUp = fast[i - 1] <= slow[i - 1] && fast[i] > slow[i];
      const crossDn = fast[i - 1] >= slow[i - 1] && fast[i] < slow[i];
      if (crossUp && direction !== "short") return "long";
      if (crossDn && direction !== "long") return "short";
    } else if (rules.entry.indicator === "rsi_oversold") {
      if (rsiArr[i] < (rules.entry.threshold ?? 30) && direction !== "short") return "long";
    } else if (rules.entry.indicator === "rsi_overbought") {
      if (rsiArr[i] > (rules.entry.threshold ?? 70) && direction !== "long") return "short";
    } else if (rules.entry.indicator === "breakout") {
      const window = closes.slice(Math.max(0, i - lookback), i);
      const hi = Math.max(...window);
      const lo = Math.min(...window);
      if (closes[i] > hi && direction !== "short") return "long";
      if (closes[i] < lo && direction !== "long") return "short";
    }
    return null;
  };

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    // update trailing peak
    if (position) {
      position.peak = position.side === "long"
        ? Math.max(position.peak, c.high)
        : Math.min(position.peak, c.low);
    }

    // exit checks
    if (position) {
      const priceNow = c.close;
      let exitReason: string | null = null;
      const move = position.side === "long"
        ? (priceNow - position.entry) / position.entry
        : (position.entry - priceNow) / position.entry;

      if (rules.stopLossPct && move <= -rules.stopLossPct / 100) exitReason = "stop-loss";
      else if (rules.takeProfitPct && move >= rules.takeProfitPct / 100) exitReason = "take-profit";
      else if (rules.trailingStopPct) {
        const trailMove = position.side === "long"
          ? (position.peak - priceNow) / position.peak
          : (priceNow - position.peak) / position.peak;
        if (trailMove >= rules.trailingStopPct / 100) exitReason = "trailing-stop";
      }

      if (!exitReason && rules.exit?.indicator === "ema_cross") {
        const crossUp = fast[i - 1] <= slow[i - 1] && fast[i] > slow[i];
        const crossDn = fast[i - 1] >= slow[i - 1] && fast[i] < slow[i];
        if (position.side === "long" && crossDn) exitReason = "exit-signal";
        if (position.side === "short" && crossUp) exitReason = "exit-signal";
      }

      if (exitReason) {
        const exitPrice = priceNow * (position.side === "long" ? 1 - slip : 1 + slip);
        const gross = position.side === "long"
          ? (exitPrice - position.entry) * position.qty
          : (position.entry - exitPrice) * position.qty;
        const fees = (position.entry + exitPrice) * position.qty * commission;
        const pnl = gross - fees;
        equity += pnl;
        trades.push({
          entryTime: position.entryTime, exitTime: c.time,
          side: position.side, entry: position.entry, exit: exitPrice,
          qty: position.qty, pnl, pnlPct: (pnl / (position.entry * position.qty)) * 100,
          reason: exitReason,
        });
        position = null;
      }
    }

    // entry
    if (!position) {
      const sig = entrySignal(i);
      if (sig) {
        const entryPrice = c.close * (sig === "long" ? 1 + slip : 1 - slip);
        const stopDist = ((rules.stopLossPct ?? 2) / 100) * entryPrice;
        const dollarRisk = equity * risk;
        const qty = Math.max(1, Math.floor(dollarRisk / Math.max(stopDist, entryPrice * 0.001)));
        position = { side: sig, entry: entryPrice, qty, entryTime: c.time, peak: entryPrice };
      }
    }

    const openPnl = position
      ? (position.side === "long"
          ? (c.close - position.entry) * position.qty
          : (position.entry - c.close) * position.qty)
      : 0;
    equityCurve.push({ t: c.time, equity: equity + openPnl });
  }

  // close any open position at last close
  if (position) {
    const last = candles[candles.length - 1];
    const exitPrice = last.close;
    const gross = position.side === "long"
      ? (exitPrice - position.entry) * position.qty
      : (position.entry - exitPrice) * position.qty;
    const fees = (position.entry + exitPrice) * position.qty * commission;
    const pnl = gross - fees;
    equity += pnl;
    trades.push({
      entryTime: position.entryTime, exitTime: last.time,
      side: position.side, entry: position.entry, exit: exitPrice,
      qty: position.qty, pnl, pnlPct: (pnl / (position.entry * position.qty)) * 100,
      reason: "end-of-data",
    });
  }

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const rets = equityCurve.map((p, i, arr) =>
    i === 0 ? 0 : (p.equity - arr[i - 1].equity) / arr[i - 1].equity,
  );
  const mean = rets.reduce((s, r) => s + r, 0) / (rets.length || 1);
  const variance = rets.reduce((s, r) => s + (r - mean) ** 2, 0) / (rets.length || 1);
  const std = Math.sqrt(variance);
  const sharpe = std > 0 ? (mean / std) * Math.sqrt(252) : 0;

  let peak = params.capital;
  let maxDd = 0;
  for (const p of equityCurve) {
    if (p.equity > peak) peak = p.equity;
    const dd = (peak - p.equity) / peak;
    if (dd > maxDd) maxDd = dd;
  }

  return {
    metrics: {
      trades: trades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
      profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0,
      totalPnl: equity - params.capital,
      totalReturnPct: ((equity - params.capital) / params.capital) * 100,
      sharpe,
      maxDrawdownPct: maxDd * 100,
      avgWin: wins.length ? grossWin / wins.length : 0,
      avgLoss: losses.length ? -grossLoss / losses.length : 0,
      finalEquity: equity,
    },
    equityCurve,
    trades,
  };
}
