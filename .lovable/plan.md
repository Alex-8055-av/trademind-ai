# Part 3 — Professional Trader Toolkit

Ship every requested feature area as a working, mock-powered page inside a new "workstation" shell, with Lovable Cloud auth + a scalable database backing the personal features (Watchlist, Portfolio, Alerts, Journal, AI Report history, Settings). Existing landing page, /chart route, AI engine, brand, and design system are preserved.

## Architecture

- **Nav split (as requested):**
  - Marketing header stays on `/` (landing).
  - New `/app/*` routes render inside a **collapsible glassmorphic sidebar** (shadcn Sidebar) grouped: Markets, Derivatives, Portfolio, Journal, Settings. Existing top nav gets a mega-menu linking into `/app/*`.
- **Auth (Lovable Cloud):** email/password + Google. Routes under `src/routes/_authenticated/app/...` gated by the managed layout. Landing, /chart, /auth stay public.
- **Data layer:** modular services in `src/lib/services/` (scanner, screener, heatmap, sector, breadth, options, fii-dii, news, calendar). Each exports typed functions returning mock data today, swappable for live APIs later without UI changes — same pattern as `market-data/`.
- **Persistence:** Supabase tables with RLS scoped to `auth.uid()` for user-owned data.

## Database schema (single migration)

```text
profiles(id=auth.users, display_name, avatar_url, plan)
user_roles(user_id, role) + has_role() SECURITY DEFINER
watchlists(id, user_id, name, color, is_pinned, sort_order)
watchlist_items(id, watchlist_id, symbol, note, tag_color, ai_score)
portfolios(id, user_id, name, base_currency)
holdings(id, portfolio_id, symbol, qty, avg_price, opened_at)
alerts(id, user_id, symbol, kind, condition_json, is_active, triggered_at)
trade_journal(id, user_id, symbol, side, entry, exit, sl, targets_json,
              emotion, reason, screenshot_url, strategy, ai_review_json,
              pnl, opened_at, closed_at)
ai_reports(id, user_id, symbol, timeframe, report_json, created_at)
user_settings(user_id, prefs_json)
```

All tables: GRANTs to `authenticated` + `service_role`, RLS on, policies `auth.uid() = user_id`. Trigger creates `profiles` row on signup.

## New routes

```text
/auth                              public sign in / sign up
/_authenticated/app                dashboard overview (workstation home)
/_authenticated/app/scanner        AI Stock Scanner (14 scanner types, filter chips)
/_authenticated/app/screener       Advanced Screener (visual filter builder)
/_authenticated/app/heatmap        Market Heatmap (Nifty/BankNifty/sector/cap)
/_authenticated/app/sectors        Sector Analysis + rotation + strength
/_authenticated/app/breadth        Market Breadth (A/D, 52w H/L, ratio)
/_authenticated/app/options        Options Dashboard (chain, OI, PCR, Max Pain)
/_authenticated/app/fii-dii        FII/DII Dashboard + historical charts
/_authenticated/app/news           News & Sentiment with AI summary
/_authenticated/app/calendar       Economic + Earnings + IPO calendar
/_authenticated/app/portfolio      Portfolios, holdings, P&L, allocation
/_authenticated/app/watchlist      Multiple watchlists, folders, tags, AI score
/_authenticated/app/alerts         Smart Alerts CRUD (all alert kinds)
/_authenticated/app/journal        AI Trade Journal + AI review per trade
/_authenticated/app/performance    Win rate, RR, Sharpe, drawdown, calendar
/_authenticated/app/risk           Risk dashboard + position-size calculator
/_authenticated/app/settings       Profile, preferences, integrations
```

Existing `/chart` moves under the app sidebar as "AI Chart" but the URL stays for compatibility.

## Design

- Reuse existing dark theme, brand tokens, glass-panel utility, Space Grotesk + Inter.
- Tables: sticky-header data tables (shadcn Table) with color-coded up/down cells.
- Heatmap: CSS grid of tiles sized by weight, background lerp from emerald → red via OKLCH.
- Charts (breadth, FII/DII, sector strength, performance calendar): reuse `lightweight-charts` where candle/line, use Recharts for bars/pies/heat.
- Every page has a Skeleton loading state and empty state.

## Modularity

- `src/lib/services/*.ts` exports pure async functions (`getScannerResults`, `getOptionChain`, `getMarketBreadth`, ...). Providers are behind an interface just like `MarketDataProvider`, so wiring NSE/Polygon/Twelve later is one factory swap.
- Server functions in `*.functions.ts` for anything AI-powered (AI trade review, AI news summary, AI scanner ranking) using existing `LOVABLE_API_KEY` gateway.

## Technical details

- `supabase--enable` first, then one migration for the whole schema (GRANTs + RLS + trigger + `has_role`).
- `configure_social_auth` for Google in the same turn.
- Sidebar shell: new `src/routes/_authenticated/app/route.tsx` renders `SidebarProvider` + `AppSidebar` + `<Outlet />`.
- Landing `/` stays; header gets a "Open Workstation" CTA → `/app`.
- Lazy-load each page via TanStack Router default splitting (per-file). No manual `React.lazy` needed.
- Mock data lives in each service file as deterministic pseudo-random (same pattern as `mock-provider.ts`) so screenshots are stable.
- Keep existing files untouched except: `Header.tsx` (nav items + workstation link), `__root.tsx` (no changes needed), `routes/index.tsx` (add CTA).

## Scope note

"All of it, thinner" = every feature area gets a real page with working mock data, filters, and interactions — not just placeholders. Deepening (live data wiring, more advanced AI reviews, push notifications, subscription billing) comes in follow-up turns.
