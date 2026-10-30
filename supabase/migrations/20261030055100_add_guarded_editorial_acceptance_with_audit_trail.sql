
CREATE OR REPLACE FUNCTION public.hskrc_accept_editorial_review(
 p_record_id uuid, p_reviewer_name text, p_review_notes text, p_attested boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
 v_record public.academic_records%ROWTYPE;
 v_total integer := 0;
 v_supported integer := 0;
 v_disputed integer := 0;
 v_incomplete integer := 0;
 v_missing_sources integer := 0;
BEGIN
 IF NOT coalesce((select public.is_admin()), false) THEN
   RAISE EXCEPTION 'Only a verified HSKRC administrator can approve scholarly dossiers';
 END IF;
 IF p_attested IS DISTINCT FROM true THEN
   RAISE EXCEPTION 'Confirm that a real human editorial review was performed';
 END IF;
 IF length(btrim(coalesce(p_reviewer_name,''))) < 3
   OR length(btrim(coalesce(p_review_notes,''))) < 30 THEN
   RAISE EXCEPTION 'A real reviewer name and detailed review notes (30+ characters) are required';
 END IF;
 SELECT * INTO v_record
 FROM public.academic_records WHERE id = p_record_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Research dossier not found'; END IF;
 IF v_record.editorial_status = 'editorially_checked' THEN
   RAISE EXCEPTION 'This dossier is already editorially accepted';
 END IF;
 IF v_record.rights_status = 'not_audited' THEN
   RAISE EXCEPTION 'Complete the rights and image-permissions audit before editorial acceptance';
 END IF;
 SELECT count(*)::int,
        count(*) FILTER (WHERE verification_status='supported')::int,
        count(*) FILTER (WHERE verification_status='disputed')::int,
        count(*) FILTER (WHERE verification_status IN ('pending','unsupported'))::int,
        count(*) FILTER (WHERE
          (source_id IS NULL AND nullif(btrim(coalesce(other_source_url,'')),'') IS NULL)
          OR (evidence_class IN ('A','B') AND nullif(btrim(coalesce(source_locator,'')),'') IS NULL)
          OR (verification_status='disputed' AND nullif(btrim(coalesce(editor_notes,'')),'') IS NULL)
        )::int
 INTO v_total, v_supported, v_disputed, v_incomplete, v_missing_sources
 FROM public.academic_claims WHERE academic_record_id = p_record_id;
 IF v_total < 1 THEN RAISE EXCEPTION 'At least one documented claim is needed'; END IF;
 IF v_incomplete > 0 THEN
   RAISE EXCEPTION '% pending or unsupported claims must be examined or corrected before acceptance', v_incomplete;
 END IF;
 IF v_missing_sources > 0 THEN
   RAISE EXCEPTION '% claims lack source details, exact locators, or a disputed-claim explanation', v_missing_sources;
 END IF;
 INSERT INTO public.academic_reviews(
   academic_record_id,review_type,reviewer_name,outcome,internal_notes,reviewed_at
 ) VALUES (
   p_record_id,'internal_source_check',btrim(p_reviewer_name),'checked',btrim(p_review_notes),now()
 );
 UPDATE public.academic_records
 SET editorial_status='editorially_checked',
     latest_editorial_check=current_date,
     total_claims=v_total, verified_claims=v_supported, updated_at=now()
 WHERE id=p_record_id;
 INSERT INTO public.academic_revisions(
   academic_record_id,revision_date,summary,review_disclosure,visible
 ) VALUES (
   p_record_id,current_date,
   'Editorial acceptance recorded after an internal review of ' || v_total ||
   ' documented claims (' || v_supported || ' supported; ' || v_disputed || ' disputed, with notes).',
   'Internal HSKRC editorial check only; not independent academic peer review.',
   true
 );
 RETURN jsonb_build_object('record_code',v_record.record_code,
   'editorial_status','editorially_checked','total_claims',v_total,
   'supported_claims',v_supported,'disputed_claims',v_disputed);
END
$$;
REVOKE ALL ON FUNCTION public.hskrc_accept_editorial_review(uuid,text,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hskrc_accept_editorial_review(uuid,text,text,boolean) TO authenticated;
