# HSKRC publication email notifications

Status: backend queue, secure Edge Function and 15-minute pg_cron job deployed in the HSKRC Supabase project. Member settings and unsubscribe page are live in the GitHub main source. **Outbound email remains disabled until the Edge Function secret `RESEND_API_KEY` is configured.**

## What triggers a message

A new row inserted as `published=true` or a row changed from unpublished to published in `public.books`, `public.articles`, or `public.updates` creates one `hskrc_notification_events` record. Previous publications are **not** backfilled. Duplicate publications are prevented with a unique (source_type,source_id) constraint.

At publication time, deliveries are generated only for confirmed users with both `profiles.email_consent=true` and `profiles.email_updates=true`. The worker checks the same preferences again when claiming deliveries. Old members who checked the signup consent box were migrated to `email_updates=true`; users without consent remain excluded. New signups use their explicit email checkbox.

## Delivery

- Function: Supabase Edge Function `send-content-updates`.
- Schedule: Supabase pg_cron job `hskrc-publication-email-worker` runs every 15 minutes.
- Authentication: a random key is stored in Supabase Vault and verified server-side; no public dispatch access.
- Provider: Resend, from `HSKRC Updates <updates@hskrc.org>`.
- Every message contains a direct publication link and unsubscribe URL.
- Max. 10 sends per invocation; delivery IDs are used as Resend idempotency keys; failed sends are retried a limited number of times.
- Private queue tables are protected by RLS, with no public policies.

## Finish setup (administrator)

1. Create a **sending-only** API key restricted to `hskrc.org` in Resend, if one is not already available.
2. Open Supabase project > Edge Functions > Secrets and set `RESEND_API_KEY` to that key. **Never put the key in GitHub or a public web page.**
3. The scheduled worker will pick it up automatically; monitor Function Logs and Cron Logs.
4. Publish a test article while one confirmed test account is opted in, then verify the message and its unsubscribe link.

## Site controls

- `account.html` — bilingual member opt-in/out controls.
- `auth.html` — optional explicit signup email consent.
- `unsubscribe.html` — token-based unsubscribe without a login; requires button confirmation, protecting against automated link previews.

To turn off automated dispatch while troubleshooting:

```sql
select cron.unschedule('hskrc-publication-email-worker');
```

To inspect status without exposing addresses:

```sql
select status, count(*) from public.hskrc_notification_deliveries group by status;
```

Do not mail everyone in `auth.users`. Follow applicable consent, sender identification and unsubscribe requirements.
