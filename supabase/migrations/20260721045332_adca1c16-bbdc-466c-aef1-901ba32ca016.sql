
-- Part 4 foundation (reordered)

-- Fix flagged linter warning
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Plan rank helper (pure)
CREATE OR REPLACE FUNCTION public.plan_rank(_plan text)
RETURNS int LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE lower(coalesce(_plan,'free'))
    WHEN 'free' THEN 0 WHEN 'pro' THEN 1 WHEN 'premium' THEN 2 WHEN 'enterprise' THEN 3
    ELSE 0 END;
$$;
REVOKE EXECUTE ON FUNCTION public.plan_rank(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.plan_rank(text) TO authenticated, service_role;

-- SUBSCRIPTIONS (first, so helpers can reference it)
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','premium','enterprise')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('trialing','active','past_due','canceled','incomplete','expired')),
  provider text CHECK (provider IN ('stripe','razorpay','manual')),
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX subscriptions_status_idx ON public.subscriptions(status);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub self read" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sub admin read" ON public.subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER subscriptions_touch BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Plan helpers
CREATE OR REPLACE FUNCTION public.current_plan(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT plan FROM public.subscriptions
      WHERE user_id = _user_id AND status = 'active'
      ORDER BY plan_rank(plan) DESC LIMIT 1),
    (SELECT plan FROM public.profiles WHERE id = _user_id),
    'free'
  );
$$;
REVOKE EXECUTE ON FUNCTION public.current_plan(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_plan(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_min_plan(_user_id uuid, _min_plan text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT plan_rank(public.current_plan(_user_id)) >= plan_rank(_min_plan);
$$;
REVOKE EXECUTE ON FUNCTION public.has_min_plan(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_min_plan(uuid, text) TO authenticated, service_role;

-- Sync profiles.plan
CREATE OR REPLACE FUNCTION public.sync_profile_plan()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET plan = public.current_plan(NEW.user_id), updated_at = now() WHERE id = NEW.user_id;
  RETURN NEW;
END $$;
CREATE TRIGGER subscriptions_sync_profile
  AFTER INSERT OR UPDATE OF plan, status ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_plan();

-- INVOICES
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('draft','open','paid','void','uncollectible')),
  provider text CHECK (provider IN ('stripe','razorpay','manual')),
  provider_invoice_id text,
  invoice_url text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX invoices_user_id_idx ON public.invoices(user_id);
GRANT SELECT ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv self read" ON public.invoices FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "inv admin read" ON public.invoices FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER invoices_touch BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PAYMENTS
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'succeeded' CHECK (status IN ('pending','succeeded','failed','refunded')),
  provider text CHECK (provider IN ('stripe','razorpay','manual')),
  provider_payment_id text,
  method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_user_id_idx ON public.payments(user_id);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pay self read" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "pay admin read" ON public.payments FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER payments_touch BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- COUPONS
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_pct integer CHECK (discount_pct BETWEEN 0 AND 100),
  discount_cents integer CHECK (discount_cents >= 0),
  max_redemptions integer,
  redeemed_count integer NOT NULL DEFAULT 0,
  valid_until timestamptz,
  plan_scope text CHECK (plan_scope IN ('any','pro','premium','enterprise')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons authed read active" ON public.coupons FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "coupons admin all" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER coupons_touch BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- MARKET CACHE
CREATE TABLE public.market_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  symbol text NOT NULL,
  timeframe text NOT NULL,
  kind text NOT NULL DEFAULT 'candles',
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  UNIQUE(provider, symbol, timeframe, kind)
);
CREATE INDEX market_cache_expires_idx ON public.market_cache(expires_at);
GRANT ALL ON public.market_cache TO service_role;
ALTER TABLE public.market_cache ENABLE ROW LEVEL SECURITY;

-- AI USAGE LOG
CREATE TABLE public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider text NOT NULL,
  model text NOT NULL,
  feature text NOT NULL,
  prompt_tokens integer,
  completion_tokens integer,
  cost_estimate_cents integer,
  latency_ms integer,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_user_created_idx ON public.ai_usage_log(user_id, created_at DESC);
CREATE INDEX ai_usage_feature_idx ON public.ai_usage_log(feature);
GRANT SELECT ON public.ai_usage_log TO authenticated;
GRANT ALL ON public.ai_usage_log TO service_role;
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai usage self read" ON public.ai_usage_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ai usage admin read" ON public.ai_usage_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- AUDIT + ADMIN LOGS
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_actor_idx ON public.audit_logs(actor_id, created_at DESC);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_logs_created_idx ON public.admin_logs(created_at DESC);
GRANT SELECT ON public.admin_logs TO authenticated;
GRANT ALL ON public.admin_logs TO service_role;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin logs admin read" ON public.admin_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- FEATURE FLAGS
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  rollout_pct integer NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  description text,
  plan_min text NOT NULL DEFAULT 'free' CHECK (plan_min IN ('free','pro','premium','enterprise')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flags authed read" ON public.feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "flags admin write" ON public.feature_flags FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER flags_touch BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.feature_flags (key, enabled, plan_min, description) VALUES
  ('ai_default_chart', true, 'free', 'Default AI provider for chart analysis'),
  ('ai_default_copilot', true, 'free', 'Default AI provider for copilot chat'),
  ('ai_default_news', true, 'free', 'Default AI provider for news summarization'),
  ('ai_default_portfolio', true, 'pro', 'AI portfolio review (Pro+)'),
  ('ai_default_journal', true, 'pro', 'AI trade journal review (Pro+)'),
  ('ai_default_risk', true, 'premium', 'AI risk analysis (Premium+)'),
  ('live_market_data', false, 'pro', 'Route to live market data providers'),
  ('webhook_alerts', false, 'premium', 'Outbound webhook alerts')
ON CONFLICT (key) DO NOTHING;

-- SUPPORT
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending','resolved','closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tickets_user_idx ON public.support_tickets(user_id);
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets self manage" ON public.support_tickets FOR ALL TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER tickets_touch BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  is_staff boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_ticket_idx ON public.support_messages(ticket_id, created_at);
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages via ticket" ON public.support_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "messages insert" ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notif_user_created_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif self" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif self update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NEWS
CREATE TABLE public.news_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  symbol text,
  headline text NOT NULL,
  url text,
  published_at timestamptz NOT NULL DEFAULT now(),
  sentiment_score numeric,
  bullish_score numeric,
  bearish_score numeric,
  neutral_score numeric,
  ai_summary text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX news_published_idx ON public.news_items(published_at DESC);
CREATE INDEX news_symbol_idx ON public.news_items(symbol);
GRANT SELECT ON public.news_items TO authenticated;
GRANT ALL ON public.news_items TO service_role;
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news authed read" ON public.news_items FOR SELECT TO authenticated USING (true);

-- ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  plan_scope text NOT NULL DEFAULT 'any' CHECK (plan_scope IN ('any','free','pro','premium','enterprise')),
  published_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann authed read active" ON public.announcements FOR SELECT TO authenticated
  USING (published_at <= now() AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "ann admin all" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER ann_touch BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed free subscription for existing users
INSERT INTO public.subscriptions (user_id, plan, status, provider)
SELECT id, 'free', 'active', 'manual' FROM auth.users
ON CONFLICT DO NOTHING;
