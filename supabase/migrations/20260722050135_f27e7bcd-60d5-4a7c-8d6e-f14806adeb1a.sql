
-- Market cache: allow authenticated read (data is not user-specific)
CREATE POLICY "Authenticated can read market cache" ON public.market_cache
  FOR SELECT TO authenticated USING (true);

-- Revoke EXECUTE from trigger/definer functions that shouldn't be user-callable
REVOKE EXECUTE ON FUNCTION public.sync_profile_plan() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.current_plan(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_min_plan(uuid, text) FROM PUBLIC, anon;

-- Explicit deny-write policies on invoices/payments (writes go through service role which bypasses RLS)
CREATE POLICY "No client writes to invoices" ON public.invoices
  FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "No client writes to payments" ON public.payments
  FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);
