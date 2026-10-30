
CREATE TABLE IF NOT EXISTS public.academic_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 record_code text NOT NULL UNIQUE CHECK (record_code ~ '^[A-Z]+-[0-9]{2}$'),
 title text NOT NULL,
 page_path text NOT NULL UNIQUE CHECK (page_path NOT LIKE 'http%' AND length(page_path) < 350),
 collection text NOT NULL CHECK (collection IN ('alamut','fatimids','imamat','women','afghanistan')),
 historical_scope text NOT NULL CHECK (historical_scope IN ('nizari','shared_early','fatimid_shared','other_ismaili_branch','cross_branch','local_unverified')),
 work_type text NOT NULL,
 editorial_status text NOT NULL DEFAULT 'queued' CHECK (editorial_status IN ('queued','in_review','needs_more_evidence','editorially_checked')),
 evidence_status text NOT NULL DEFAULT 'unassessed' CHECK (evidence_status IN ('unassessed','primary_document','scholarly_analysis','attributed_community','mixed','lead_only')),
 peer_review_status text NOT NULL DEFAULT 'not_peer_reviewed' CHECK (peer_review_status IN ('not_peer_reviewed','review_invited','under_external_review','externally_reviewed')),
 rights_status text NOT NULL DEFAULT 'not_audited' CHECK (rights_status IN ('not_audited','permission_recorded','restricted','public_domain_confirmed','licence_recorded')),
 verified_claims integer NOT NULL DEFAULT 0 CHECK (verified_claims >= 0),
 total_claims integer CHECK (total_claims IS NULL OR total_claims >= 0),
 latest_editorial_check date,
 external_review_date date,
 public_note text NOT NULL DEFAULT 'Scientific evaluation pending. Publication does not imply independent peer review.',
 published boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT academic_claims_bounds CHECK (total_claims IS NULL OR verified_claims <= total_claims),
 CONSTRAINT academic_review_date CHECK (peer_review_status <> 'externally_reviewed' OR external_review_date IS NOT NULL)
);
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_records FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.academic_records TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.academic_records TO authenticated;
CREATE POLICY "Public see published academic register" ON public.academic_records FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admin inspect unpublished academic records" ON public.academic_records FOR SELECT TO authenticated USING ((select is_admin()));
CREATE POLICY "Admin create academic records" ON public.academic_records FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "Admin edit academic records" ON public.academic_records FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admin remove academic records" ON public.academic_records FOR DELETE TO authenticated USING ((select is_admin()));

CREATE TABLE IF NOT EXISTS public.academic_claims (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 academic_record_id uuid NOT NULL REFERENCES public.academic_records(id) ON DELETE CASCADE,
 claim_text text NOT NULL,
 source_id uuid REFERENCES public.research_sources(id),
 other_source_url text,
 source_locator text,
 evidence_class text NOT NULL DEFAULT 'D' CHECK (evidence_class IN ('A','B','C','D')),
 verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','supported','disputed','unsupported')),
 editor_notes text,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academic_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_claims FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_claims TO authenticated;
CREATE POLICY "Only admins manage scholarly claims" ON public.academic_claims FOR ALL TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));

CREATE TABLE IF NOT EXISTS public.academic_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 academic_record_id uuid NOT NULL REFERENCES public.academic_records(id) ON DELETE CASCADE,
 review_type text NOT NULL CHECK (review_type IN ('internal_source_check','external_peer_review','metadata_audit','rights_audit','correction')),
 reviewer_name text,
 reviewer_affiliation text,
 conflicts_declaration text,
 outcome text NOT NULL CHECK (outcome IN ('pending','changes_requested','accepted_with_revisions','checked','rejected')),
 internal_notes text,
 evidence_link text,
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academic_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_reviews TO authenticated;
CREATE POLICY "Only admins manage internal research reviews" ON public.academic_reviews FOR ALL TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));

CREATE TABLE IF NOT EXISTS public.academic_revisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 academic_record_id uuid NOT NULL REFERENCES public.academic_records(id) ON DELETE CASCADE,
 revision_date date NOT NULL DEFAULT current_date,
 summary text NOT NULL,
 source_reference text,
 review_disclosure text NOT NULL DEFAULT 'Editorial update; not external peer review.',
 visible boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academic_revisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_revisions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.academic_revisions TO anon, authenticated;
GRANT INSERT ON public.academic_revisions TO authenticated;
CREATE POLICY "Public see disclosed revision records" ON public.academic_revisions FOR SELECT TO anon, authenticated USING (visible = true);
CREATE POLICY "Admin inspect unreleased revisions" ON public.academic_revisions FOR SELECT TO authenticated USING ((select is_admin()));
CREATE POLICY "Admin append revision history" ON public.academic_revisions FOR INSERT TO authenticated WITH CHECK ((select is_admin()));

INSERT INTO public.academic_records(record_code,title,page_path,collection,historical_scope,work_type)
VALUES ('ALAMUT-01','Hassan Sabbah / حسن صباح','hassan-sabbah.html','alamut','nizari','historical_profile'),
('ALAMUT-02','Alamut: history and timeline / تاریخ الموت','alamut.html','alamut','nizari','research_dossier'),
('ALAMUT-03','Alamut knowledge base / پایگاه دانش الموت','alamut-knowledge-base.html','alamut','nizari','research_collection'),
('ALAMUT-04','Ismaili Fortresses / قلعه‌های اسماعیلی','ismaili-fortresses.html','alamut','cross_branch','heritage_collection'),
('ALAMUT-05','Alamut Beyond the Legend / الموت فراتر از افسانه','generated-articles/alamut-beyond-the-legend-a-historical-and-research-guide-to-the-nizari-ismaili-centre-1e190925.html','alamut','nizari','research_article'),
('FATIMID-01','The Fatimid Era / دوره فاطمیان','fatimids.html','fatimids','fatimid_shared','research_collection'),
('FATIMID-02','Fatimid Cairo / قاهره فاطمی','fatimid-cairo.html','fatimids','fatimid_shared','heritage_dossier'),
('FATIMID-03','Al-Azhar / الازهر','fatimid-al-azhar.html','fatimids','fatimid_shared','institution_dossier'),
('FATIMID-04','Dar al-Ilm / دارالعلم','fatimid-dar-al-ilm.html','fatimids','fatimid_shared','institution_dossier'),
('IMAM-01','Imam Ali / امام علی','imams-ismaili.html#imam-1','imamat','shared_early','biography'),
('IMAM-02','Imam al-Mustansir / امام مستنصر','imams-ismaili.html#imam-18','imamat','fatimid_shared','biography'),
('IMAM-03','Aga Khan I / آقاخان اول','imams-ismaili.html#imam-46','imamat','nizari','biography'),
('IMAM-04','Aga Khan V / آقاخان پنجم','imams-ismaili.html#imam-50','imamat','nizari','biography'),
('WOMEN-01','Sitt al-Mulk / ست‌الملک','women-ismaili.html#sitt-al-mulk','women','fatimid_shared','biography'),
('WOMEN-02','Queen Arwa al-Sulayhi / ملکه اروى صلیحی','women-ismaili.html#arwa-al-sulayhi','women','other_ismaili_branch','biography'),
('WOMEN-03','Farkhunda Zahra Naderi / فرخنده زهرا نادری','women-ismaili.html#farkhunda-zahra-naderi','women','nizari','biography'),
('AFGHAN-01','Sayed Nuruddin Ronaq Naderi / سید نورالدین رونق نادری','sayed-nuruddin-ronaq-naderi.html','afghanistan','nizari','literary_biography'),
('AFGHAN-02','Lakhshom Qala / قلعه لخشم','lakhshom-qala.html','afghanistan','local_unverified','oral_heritage'),
('AFGHAN-03','Firqah 80 printed source / فهرست شهدا','firqah-80-source.html','afghanistan','local_unverified','source_dossier'),
('AFGHAN-04','Firqah 80 profile 01 / دگروال شاد محمد','firqah-80-001.html','afghanistan','local_unverified','memorial')
ON CONFLICT (record_code) DO NOTHING;
