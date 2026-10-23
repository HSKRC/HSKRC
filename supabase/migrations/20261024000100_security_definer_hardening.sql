-- Applied to Supabase project uwuklryzxexpofcxrbnm on 2026-10-24.
-- Restrict SECURITY DEFINER RPCs to the roles required by public website flows,
-- pin search_path, and index the notification delivery user foreign key.

ALTER FUNCTION public.get_foundation_public_project(text) SET search_path = '';
ALTER FUNCTION public.submit_foundation_complaint(text, text, text, text, text, boolean) SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.get_foundation_public_project(text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.get_foundation_public_project(text) TO anon;

REVOKE EXECUTE ON FUNCTION public.hskrc_unsubscribe(uuid) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.hskrc_unsubscribe(uuid) TO anon;

REVOKE EXECUTE ON FUNCTION public.submit_foundation_complaint(text, text, text, text, text, boolean) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_foundation_complaint(text, text, text, text, text, boolean) TO anon;

CREATE INDEX IF NOT EXISTS idx_hskrc_notification_deliveries_user_id
  ON public.hskrc_notification_deliveries (user_id);
