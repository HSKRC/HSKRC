-- Move callable SECURITY DEFINER implementations out of the exposed public schema.
-- Public RPC wrappers remain SECURITY INVOKER and preserve existing website features.
-- Keep search_path pinned and remove irrelevant table privileges from client roles.

CREATE SCHEMA IF NOT EXISTS hskrc_internal;
REVOKE ALL ON SCHEMA hskrc_internal FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA hskrc_internal TO anon;

CREATE OR REPLACE FUNCTION hskrc_internal.get_foundation_public_project(lookup_code text)
RETURNS TABLE(
  project_code text, title text, program_area text, location text, status text,
  start_date date, end_date date, budget numeric, currency text,
  verified_funds_received numeric, verified_project_spending numeric,
  public_summary text, public_timeline text, public_outcomes text,
  public_financial_note text, public_evidence_note text,
  updated_at timestamp with time zone
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  select
    p.project_code,p.title,p.program_area,p.location,p.status,p.start_date,p.end_date,p.budget,p.currency,
    coalesce((
      select sum(t.amount) from public.foundation_transactions t
      where upper(btrim(t.project_code))=upper(btrim(p.project_code))
        and t.verified=true and t.currency=p.currency and t.transaction_type='Income'
    ),p.verified_funds_received) as verified_funds_received,
    coalesce((
      select greatest(
        coalesce(sum(case when t.transaction_type='Expense' then t.amount else 0 end),0)
        - coalesce(sum(case when t.transaction_type='Refund' then t.amount else 0 end),0), 0
      )
      from public.foundation_transactions t
      where upper(btrim(t.project_code))=upper(btrim(p.project_code))
        and t.verified=true and t.currency=p.currency
        and t.transaction_type in ('Expense','Refund')
      having count(*)>0
    ),p.verified_project_spending) as verified_project_spending,
    p.public_summary,p.public_timeline,p.public_outcomes,p.public_financial_note,p.public_evidence_note,p.updated_at
  from public.foundation_projects p
  where upper(btrim(p.project_code))=upper(btrim(lookup_code))
    and p.public_visibility='Public' and p.governance_approval='Approved'
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION hskrc_internal.hskrc_unsubscribe(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
declare v_count integer;
begin
  update public.profiles
    set email_updates=false,email_consent=false
    where email_unsubscribe_token=p_token;
  get diagnostics v_count=row_count;
  return v_count>0;
end;
$function$;

CREATE OR REPLACE FUNCTION hskrc_internal.submit_foundation_complaint(
  p_complaint_type text, p_contact_name text, p_contact_email text,
  p_contact_phone text, p_description text, p_consent_to_contact boolean DEFAULT false
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
declare ref text; safe_type text;
begin
  if coalesce(length(btrim(p_description)),0) < 20 then
    raise exception 'Description is too short';
  end if;
  if length(btrim(p_description)) > 5000 then
    raise exception 'Description is too long';
  end if;
  safe_type := case
    when p_complaint_type in ('General','Safeguarding','Financial','Privacy','Conduct','Partner','Other')
      then p_complaint_type else 'General' end;
  ref := 'HF-' || to_char(current_date,'YYYYMMDD') || '-' ||
         upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into public.foundation_complaints(
    public_reference, complaint_type, contact_name, contact_email, contact_phone,
    description, consent_to_contact, status, priority
  ) values (
    ref, safe_type, left(nullif(btrim(p_contact_name),''),160),
    left(nullif(btrim(p_contact_email),''),254), left(nullif(btrim(p_contact_phone),''),80),
    btrim(p_description), coalesce(p_consent_to_contact,false), 'Received',
    case when safe_type='Safeguarding' then 'High' else 'Normal' end
  );
  return ref;
end;
$function$;

REVOKE ALL ON FUNCTION hskrc_internal.get_foundation_public_project(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION hskrc_internal.hskrc_unsubscribe(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION hskrc_internal.submit_foundation_complaint(text,text,text,text,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION hskrc_internal.get_foundation_public_project(text) TO anon;
GRANT EXECUTE ON FUNCTION hskrc_internal.hskrc_unsubscribe(uuid) TO anon;
GRANT EXECUTE ON FUNCTION hskrc_internal.submit_foundation_complaint(text,text,text,text,text,boolean) TO anon;

CREATE OR REPLACE FUNCTION public.get_foundation_public_project(lookup_code text)
RETURNS TABLE(
  project_code text, title text, program_area text, location text, status text,
  start_date date, end_date date, budget numeric, currency text,
  verified_funds_received numeric, verified_project_spending numeric,
  public_summary text, public_timeline text, public_outcomes text,
  public_financial_note text, public_evidence_note text,
  updated_at timestamp with time zone
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $function$ SELECT * FROM hskrc_internal.get_foundation_public_project($1); $function$;

CREATE OR REPLACE FUNCTION public.hskrc_unsubscribe(p_token uuid)
RETURNS boolean
LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $function$ SELECT hskrc_internal.hskrc_unsubscribe($1); $function$;

CREATE OR REPLACE FUNCTION public.submit_foundation_complaint(
  p_complaint_type text, p_contact_name text, p_contact_email text,
  p_contact_phone text, p_description text, p_consent_to_contact boolean DEFAULT false
)
RETURNS text
LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $function$ SELECT hskrc_internal.submit_foundation_complaint($1,$2,$3,$4,$5,$6); $function$;

REVOKE EXECUTE ON FUNCTION public.get_foundation_public_project(text) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.hskrc_unsubscribe(uuid) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_foundation_complaint(text,text,text,text,text,boolean) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.get_foundation_public_project(text) TO anon;
GRANT EXECUTE ON FUNCTION public.hskrc_unsubscribe(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_foundation_complaint(text,text,text,text,text,boolean) TO anon;

REVOKE ALL PRIVILEGES ON TABLE public.cloudflare_analytics_lifetime FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.hskrc_notification_deliveries FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.hskrc_notification_events FROM PUBLIC, anon, authenticated;
