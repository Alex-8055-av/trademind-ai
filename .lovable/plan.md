## TradeMind AI — Part 5 Rollout Plan

Part 5 covers ~14 major feature areas. Shipping all in one turn would produce shallow, buggy work. I'll break it into 4 phases and ship them sequentially, verifying each before moving on. Everything is additive — nothing from Parts 1–4 is removed or redesigned.

### Phase A — Trader Power Tools (this turn if you approve)
1. **Paper Trading** — new tables `paper_accounts`, `paper_orders`, `paper_positions`; `/app/paper` route with virtual balance, market/limit orders against mock LTP, open/closed positions, daily/weekly/monthly P&L.
2. **Strategy Builder** — table `strategies` (JSON rule tree); `/app/strategies` route with a rule builder (entry/exit/SL/TP/trailing/time/MTF/SMC/indicator/volume conditions), save/duplicate/share flags.
3. **Backtesting Engine** — table `backtests`; run strategy over mock historical candles server-side, compute Win Rate, PF, Sharpe, Max DD, equity curve, trade list; `/app/backtest` UI with results + comparison.
4. **AI Portfolio Manager** — server fn `reviewPortfolio` (Lovable AI) producing Diversification/Risk scores, sector exposure, sizing + rebalancing suggestions; surfaced on existing `/app/portfolio`.

### Phase B — Community & Learning
5. **Social Trading** — `public_profiles`, `strategy_shares`, `follows`, `likes`, `comments`; `/community` feed + rankings.
6. **Learning Center** — `lessons`, `quiz_attempts`, `user_progress`; `/learn` with SMC/ICT/candlestick/risk/psychology tracks, quizzes, progress bars.
7. **Marketplace** — `marketplace_items`, `reviews`; `/marketplace` for strategies/indicators/templates/watchlists with ratings.

### Phase C — Platform & Access
8. **Public REST API** — `api_keys` table (hashed); `/api/public/v1/*` routes for market data, AI analysis, scanner, portfolio, watchlists, alerts; per-key rate limit; `/app/api-keys` UI.
9. **AI Voice Assistant** — extend existing AI Copilot with Web Speech API mic input + TTS output on `/chart`.
10. **Multi-language (i18n)** — lightweight `useTranslation` hook + `en`/`hi` dictionaries; language switcher in header; architecture for more locales.

### Phase D — Mobile, PWA, Analytics, Polish
11. **Mobile Ready** — audit all workstation pages for responsive layouts, mobile nav drawer, touch targets.
12. **PWA** — manifest + icons for installable app (offline/push deferred unless you confirm; per PWA guidance the manifest-only path is usually what "installable" means).
13. **Business Analytics** — `/admin/analytics` with Active Users, AI Requests, Revenue, Retention, Conversion, Health (queries against existing tables).
14. **Final Polish** — loading skeletons, empty states, error boundaries, a11y sweep, SEO metadata on all new routes, risk disclosure banner.

### Technical Notes
- All new tables: RLS enabled, explicit GRANTs, `service_role` full access, per public-schema-grants rules.
- All AI calls go through existing `requireSupabaseAuth` middleware + Lovable AI Gateway (`openai/gpt-5.5` default).
- Backtesting runs in a `createServerFn` (not edge fn) — TanStack native.
- Public API routes live under `src/routes/api/public/v1/` with HMAC/api-key auth in the handler.
- PWA: manifest-only unless you explicitly want offline caching (service worker adds complexity + preview caveats).
- No changes to existing tables, RLS, routes, sidebar structure, or branding.

### Question before I start
Phase A alone is a big turn (4 features, ~2 migrations, ~8 new files). **Shall I start with Phase A and ship Phases B–D in subsequent turns?** Or do you want a different ordering (e.g. PWA + mobile first)?
