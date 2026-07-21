# Part 4 — Production Foundation

Ship the four core modules as a stable architectural foundation. Preserve everything from Parts 1–3. Deferred (Part 5): brokers, notifications, exports, deploy configs, tests.

## 1. Database migration (single migration, additive only)

Extend `app_role` enum: add `free`, `pro`, `premium`, `enterprise`, `super_admin` (keep existing `admin`, `moderator`, `user`).

New tables (all with RLS, GRANTs, `updated_at` triggers):

- `subscriptions` — user_id, plan, status, provider (stripe/razorpay), provider_customer_id, provider_subscription_id, current_period_end, trial_ends_at, cancel_at
- `invoices` — subscription_id, user_id, amount_cents, currency, status, provider_invoice_id, invoice_url, issued_at
- `payments` — user_id, invoice_id, amount_cents, currency, status, provider, provider_payment_id, method
- `coupons` — code (unique), discount_pct, discount_cents, max_redemptions, redeemed_count, valid_until, plan_scope
- `market_cache` — provider, symbol, timeframe, payload (jsonb), fetched_at, expires_at, unique(provider,symbol,timeframe)
- `ai_usage_log` — user_id, provider, model, feature, prompt_tokens, completion_tokens, cost_estimate_cents, latency_ms
- `audit_logs` — actor_id, action, resource_type, resource_id, metadata (jsonb), ip
- `admin_logs` — admin_id, action, target_user_id, details (jsonb)
- `feature_flags` — key (unique), enabled, rollout_pct, description, plan_min
- `support_tickets` — user_id, subject, status, priority, category
- `support_messages` — ticket_id, author_id, body, is_staff
- `notifications` — user_id, type, title, body, link, read_at
- `news_items` — source, symbol, headline, url, published_at, sentiment_score, ai_summary
- `announcements` — title, body, plan_scope, published_at, expires_at

Add SQL helpers (SECURITY DEFINER, search_path=public):
- `has_min_plan(_user_id uuid, _plan app_role)` — returns bool; ranks free<pro<premium<enterprise.
- `current_plan(_user_id uuid)` — returns app_role.

RLS pattern: users read/write own rows; admins read all via `has_role(auth.uid(),'admin')` or `super_admin`; audit_logs/admin_logs/feature_flags/announcements/news_items: read for authenticated, write for admins only.

Fix flagged linter warning: revoke EXECUTE on `has_role` from `public`/`anon`; keep grant to `authenticated`.

## 2. Modular market data layer (`src/lib/market-data/`)

Files:
- `types.ts` — extend with `Quote`, `Depth`, `IndexData`, `CompanyInfo`; add methods to `MarketDataProvider`.
- `adapters/polygon.ts`, `adapters/twelve-data.ts`, `adapters/finnhub.ts`, `adapters/alpha-vantage.ts` — each implements `MarketDataProvider`; reads API key from `process.env.<PROVIDER>_API_KEY`; throws a typed `ProviderKeyMissing` error so the factory falls back to mock.
- `cache.ts` — `withCache(provider)` wrapper: reads/writes `market_cache` via `supabaseAdmin`; TTL keyed by timeframe (1m=10s, 1h=5m, 1D=1h).
- `rate-limit.ts` — token-bucket per provider; retry with exponential backoff (max 3).
- `index.ts` — `getMarketDataProvider()` picks provider by `MARKET_DATA_PROVIDER` env (default `mock`), wraps with cache+ratelimit.
- WebSocket: stub `subscribeQuotes()` interface on the provider contract; only mock implements it now (setInterval).

No UI changes — chart & scanner keep using `getMarketDataProvider()`.

## 3. Modular AI provider system (`src/lib/ai/`)

Files:
- `providers/types.ts` — `AiProvider { name, textModel, visionModel, generate(), generateStructured() }`.
- `providers/lovable-openai.ts`, `providers/lovable-gemini.ts`, `providers/lovable-claude.ts` — all route through Lovable AI Gateway (openai-compatible), differ only in `model` id (`openai/gpt-5.5`, `google/gemini-2.5-pro`, `anthropic/claude-*` if catalog supports; else fall back to gpt-5.5 with a warning).
- `providers/index.ts` — `getAiProvider(feature)` returns a provider based on `feature_flags.ai_default_<feature>` or env fallback.
- `features/` — new server fns (all with `requireSupabaseAuth` + `ai_usage_log` insert):
  - `portfolio-review.functions.ts` — reads user's holdings, returns AI risk/allocation review.
  - `journal-review.functions.ts` — reads recent trade_journal rows, returns behavioral coaching.
  - `risk-analysis.functions.ts` — computes exposure, correlation, drawdown, AI narrative.
  - `news-summary.functions.ts` — takes headlines list, returns bullish/bearish/neutral scores + summary.
- Wire AI Review buttons into existing Portfolio, Journal, Risk, News pages (no redesign — one button + collapsible panel per page).

## 4. RBAC + Admin panel

- `src/hooks/use-role.ts` — client hook: fetches `user_roles` + `profiles.plan`.
- `src/lib/rbac/guard.ts` — client `<PlanGate min="pro">` component + server `requirePlan()` middleware factory.
- New authenticated layout `src/routes/_authenticated/admin/route.tsx` — gates via server fn calling `has_role(auth.uid(),'admin')` or `super_admin`; redirects non-admins to `/app`.
- Admin pages under `src/routes/_authenticated/admin/`:
  - `index.tsx` — KPIs: MRR, active subs, AI cost 30d, DAU, ticket backlog.
  - `users.tsx` — list users, change plan/role, disable.
  - `subscriptions.tsx` — list, filter by plan/status, cancel.
  - `revenue.tsx` — chart of payments + invoices.
  - `ai-usage.tsx` — aggregated by feature/provider/user.
  - `logs.tsx` — audit + admin logs viewer.
  - `feature-flags.tsx` — toggle flags, edit rollout %.
  - `tickets.tsx` — support ticket queue.
  - `announcements.tsx` — CRUD announcements.
  - `market-status.tsx` — provider health (last cache write, error counts).
- Add "Admin" link in `AppSidebar` conditionally rendered when `has_role('admin')`.

## 5. Subscription infrastructure (scaffold; enable providers on request)

- `src/lib/billing/` — provider-agnostic layer:
  - `types.ts` — `BillingProvider { createCheckout, cancelSubscription, listInvoices, verifyWebhook }`.
  - `stripe.ts`, `razorpay.ts` — stub implementations that throw "provider not enabled" until keys/enablement land.
  - `plans.ts` — plan catalog: Free (0), Pro (₹499/mo), Premium (₹1499/mo), Enterprise (contact); feature entitlements matrix.
- Server fns (`src/lib/billing/checkout.functions.ts`): `startCheckout`, `getMySubscription`, `listMyInvoices`, `applyCoupon`, `startTrial`, `cancelMySubscription` — all `requireSupabaseAuth`.
- Server routes for webhooks: `src/routes/api/public/webhooks/stripe.ts`, `src/routes/api/public/webhooks/razorpay.ts` — signature verify, upsert subscription/invoice/payment via `supabaseAdmin`.
- New public route `src/routes/pricing.tsx` — 4-tier grid, "Subscribe" CTAs call `startCheckout`; unauthenticated → `/auth`.
- New authenticated route `src/routes/_authenticated/app/billing.tsx` — current plan, upgrade/downgrade, invoice history table with download links, cancel flow, coupon input, trial banner.
- Feature gating: replace hardcoded plan reads with `<PlanGate>` around premium tiles (AI Copilot, Scanner strategies count, Alerts count).

**Payment provider enablement**: after this scaffold ships, I'll ask you to confirm which provider to enable first (Stripe seamless via Lovable Payments, or Razorpay BYOK). The scaffold works today with the plans catalog + gating; provider enablement is a follow-up tool call that opens a form for you to fill.

## 6. Security hardening (in-scope, low effort)

- Rate limit AI endpoints per user (in-memory token bucket keyed by userId; 20 req/hour Free, 200 Pro, unlimited Premium+).
- Input size caps: chat history 20 messages, image 8MB (down from 15MB).
- Audit log on: role change, plan change, subscription cancel, admin login.
- Fix Supabase linter warning on `has_role` (revoke public EXECUTE).

## Technical details

- One migration, additive only. No changes to existing tables (portfolios, holdings, trade_journal, watchlists, alerts, ai_reports, user_settings, profiles).
- `profiles.plan` (already exists) stays as denormalized cached plan; source of truth = `subscriptions.plan` where `status='active'`. Trigger keeps them in sync.
- All new server fns use `requireSupabaseAuth`; admin fns additionally verify `has_role('admin')` inside the handler via `context.supabase`.
- `supabaseAdmin` used only in webhook handlers and admin-verified server fns; loaded via `await import` inside handlers.
- Env vars added (all optional, mock/stub fallback): `MARKET_DATA_PROVIDER`, `POLYGON_API_KEY`, `TWELVE_DATA_API_KEY`, `FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. Users are prompted only when they choose to enable a specific provider.
- No new Supabase Edge Functions. All logic in `createServerFn` or TanStack server routes.
- No UI redesign; only additive routes and existing-page AI buttons.

## Delivery order in build

1. Migration (needs your approval before other files compile against types).
2. Market data adapter layer + cache/rate-limit.
3. AI provider abstraction + 4 new AI feature server fns + wiring buttons.
4. RBAC hook + guard + admin routes.
5. Billing scaffold + pricing + billing pages + webhook routes.
6. Security hardening pass.

After you approve the plan, I'll start with the migration and continue through the list.
