
-- Paper trading
CREATE TABLE public.paper_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default',
  starting_balance numeric NOT NULL DEFAULT 1000000,
  cash numeric NOT NULL DEFAULT 1000000,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paper_accounts TO authenticated;
GRANT ALL ON public.paper_accounts TO service_role;
ALTER TABLE public.paper_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own paper_accounts" ON public.paper_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.paper_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.paper_accounts(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy','sell')),
  order_type text NOT NULL DEFAULT 'market' CHECK (order_type IN ('market','limit')),
  qty numeric NOT NULL,
  limit_price numeric,
  filled_price numeric,
  status text NOT NULL DEFAULT 'filled' CHECK (status IN ('pending','filled','cancelled','rejected')),
  pnl numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  filled_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paper_orders TO authenticated;
GRANT ALL ON public.paper_orders TO service_role;
ALTER TABLE public.paper_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own paper_orders" ON public.paper_orders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_paper_orders_account ON public.paper_orders(account_id, created_at DESC);

CREATE TABLE public.paper_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.paper_accounts(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  qty numeric NOT NULL,
  avg_price numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_id, symbol)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paper_positions TO authenticated;
GRANT ALL ON public.paper_positions TO service_role;
ALTER TABLE public.paper_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own paper_positions" ON public.paper_positions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Strategies
CREATE TABLE public.strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.strategies TO authenticated;
GRANT ALL ON public.strategies TO service_role;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own strategies" ON public.strategies FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "public strategies visible" ON public.strategies FOR SELECT TO authenticated USING (is_public = true);

-- Backtests
CREATE TABLE public.backtests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id uuid REFERENCES public.strategies(id) ON DELETE SET NULL,
  symbol text NOT NULL,
  timeframe text NOT NULL DEFAULT '1D',
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  equity_curve jsonb NOT NULL DEFAULT '[]'::jsonb,
  trades jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backtests TO authenticated;
GRANT ALL ON public.backtests TO service_role;
ALTER TABLE public.backtests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own backtests" ON public.backtests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at triggers
CREATE TRIGGER t_paper_accounts_updated BEFORE UPDATE ON public.paper_accounts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_paper_positions_updated BEFORE UPDATE ON public.paper_positions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_strategies_updated BEFORE UPDATE ON public.strategies FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
