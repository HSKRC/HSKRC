/* HSKRC academic acceptance workflow. Editorial acceptance is NOT external peer review. */
window.addEventListener("load", async function () {
  "use strict";
  const BASE = "https://uwuklryzxexpofcxrbnm.supabase.co";
  const KEY = "sb_publishable_pC4zCrTiZLb0hW0oXqt0tg_i1vjIoW2";
  const el = id => document.getElementById(id);
  const access = el("access"), desk = el("desk");
  const db = window.supabase?.createClient(BASE, KEY);
  const formValues = form => Object.fromEntries(new FormData(form).entries());
  let rows = [], current = null, claimList = [], reviewList = [];
  let requestSerial = 0, saving = false;

  function message(value, good = true) {
    access.textContent = value;
    access.style.borderColor = good ? "#7a927a" : "#b75d5d";
    access.setAttribute("aria-live", "polite");
  }
  function busy(form, value) {
    saving = value;
    for (const button of form.querySelectorAll("button")) button.disabled = value;
  }
  function optionValue(form, key, value) {
    const field = form.elements.namedItem(key);
    if (field) field.value = value ?? "";
  }
  function displayItems(container, items, draw) {
    container.replaceChildren();
    if (!items.length) { container.textContent = "No records yet. / هنوز ثبت نشده"; return; }
    items.forEach(item => container.append(draw(item)));
  }
  function clearClaimEditor() {
    const f = el("claimForm");
    f.reset();
    optionValue(f, "claim_id", "");
    el("save-claim").textContent = "Add claim / ثبت ادعا";
    el("cancel-claim").hidden = true;
  }
  function getReadiness() {
    const reasons = [];
    if (!current) return ["Choose a dossier."];
    if (current.rights_status === "not_audited") reasons.push("Rights and image permissions have not been assessed. Save a truthful rights status first.");
    if (claimList.length === 0) reasons.push("At least one documented historical claim is required.");
    const incomplete = claimList.filter(c => c.verification_status === "pending" || c.verification_status === "unsupported");
    if (incomplete.length) reasons.push(incomplete.length + " pending/unsupported claim(s) still require source checking or correction.");
    const missing = claimList.filter(c => (!c.source_id && !(c.other_source_url || "").trim()) ||
      (["A", "B"].includes(c.evidence_class) && !(c.source_locator || "").trim()) ||
      (c.verification_status === "disputed" && !(c.editor_notes || "").trim()));
    if (missing.length) reasons.push(missing.length + " claim(s) lack traceable references, exact locators or disputed-claim explanations.");
    if (current.editorial_status === "editorially_checked") reasons.push("Already accepted; change the underlying dossier to reopen the check.");
    return reasons;
  }
  function readinessUI() {
    const reasons = getReadiness();
    const block = el("accept-readiness");
    block.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = reasons.length ? "Not ready for editorial acceptance / هنوز آماده تأیید نیست" :
      "Evidence prerequisites met / شرایط اولیه بررسی تکمیل است";
    block.append(title);
    if (reasons.length) {
      const list = document.createElement("ul");
      reasons.forEach(reason => { const li = document.createElement("li"); li.textContent = reason; list.append(li); });
      block.append(list);
    } else {
      const p = document.createElement("p");
      p.textContent = "A real editor must now personally review the work and sign the notes below. This is NOT independent academic peer review.";
      block.append(p);
    }
    el("accept-btn").disabled = reasons.length > 0;
  }

  async function getRows(preferredId) {
    const {data, error} = await db.from("academic_records").select("*").order("record_code");
    if (error) throw error;
    rows = data || [];
    const select = el("record");
    const keep = preferredId || select.value;
    select.replaceChildren();
    for (const r of rows) select.add(new Option(r.record_code + " · " + r.title, r.id));
    if (keep && rows.some(r => r.id === keep)) select.value = keep;
    const waiting = rows.filter(r => r.editorial_status !== "editorially_checked");
    el("queue-count").textContent = waiting.length + " queued / pending editorial decisions";
    displayItems(el("queue-list"), waiting, r => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "queue-item";
      button.textContent = r.record_code + " · " + r.title + " — " + r.editorial_status;
      button.addEventListener("click", async () => { select.value = r.id; await loadCurrent(); });
      return button;
    });
    await loadCurrent();
  }
  async function loadCurrent() {
    const wanted = el("record").value;
    const id = ++requestSerial;
    current = rows.find(r => r.id === wanted);
    if (!current) return;
    const r = current;
    el("record-overview").textContent = r.record_code + " · " + r.historical_scope +
      " · editorial status: " + r.editorial_status + " · external: " + r.peer_review_status;
    el("record-link").replaceChildren();
    const link = document.createElement("a");
    link.href = r.page_path;
    link.textContent = "View published dossier / مشاهده پروفایل →";
    el("record-link").append(link);
    for (const key of ["evidence_status", "rights_status", "public_note"]) optionValue(el("editForm"), key, r[key]);
    el("metadata-status").textContent = "Current editorial status: " + r.editorial_status;
    clearClaimEditor();
    const [claims, reviews] = await Promise.all([
      db.from("academic_claims").select("id,claim_text,source_id,other_source_url,source_locator,evidence_class,verification_status,editor_notes,created_at").eq("academic_record_id", wanted).order("created_at"),
      db.from("academic_reviews").select("review_type,outcome,reviewer_name,created_at").eq("academic_record_id", wanted).order("created_at", {ascending: false})
    ]);
    if (id !== requestSerial) return;
    if (claims.error || reviews.error) {
      message("Unable to load evidence records: " + (claims.error?.message || reviews.error?.message), false);
      claimList = []; reviewList = [];
      readinessUI();
      return;
    }
    claimList = claims.data || [];
    reviewList = reviews.data || [];
    el("record-counts").textContent = "Claims: " + claimList.length +
      " · supported: " + claimList.filter(c => c.verification_status === "supported").length +
      " · pending: " + claimList.filter(c => c.verification_status === "pending").length +
      " · review records: " + reviewList.length;
    displayItems(el("claims"), claimList, claim => {
      const article = document.createElement("article");
      const text = document.createElement("p");
      text.textContent = claim.evidence_class + " / " + claim.verification_status +
        " — " + claim.claim_text + " (" + (claim.source_locator || "missing locator") + ")";
      article.append(text);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Edit evidence / اصلاح ادعا";
      btn.addEventListener("click", () => {
        const form = el("claimForm");
        for (const field of ["claim_text", "source_id", "other_source_url", "source_locator", "evidence_class", "verification_status", "editor_notes"]) {
          optionValue(form, field, claim[field]);
        }
        optionValue(form, "claim_id", claim.id);
        el("save-claim").textContent = "Save corrected claim / ذخیره اصلاح";
        el("cancel-claim").hidden = false;
        form.scrollIntoView({behavior: "smooth", block: "start"});
      });
      article.append(btn);
      return article;
    });
    displayItems(el("reviews"), reviewList, review => {
      const article = document.createElement("article");
      article.textContent = review.review_type + " · " + review.outcome + " · " +
        (review.reviewer_name || "Internal reviewer") + " · " + review.created_at.slice(0, 10);
      return article;
    });
    readinessUI();
  }
  if (!db) { message("The authentication client could not be loaded.", false); return; }
  try {
    const {data: {session}, error: sessionError} = await db.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) { message("Login required / ابتدا وارد حساب مدیر شوید", false); return; }
    const {data: allowed, error: authError} = await db.rpc("is_admin");
    if (authError || allowed !== true) { message("Access denied / فقط مدیر تأییدشده دسترسی دارد", false); return; }
    desk.classList.remove("hidden");
    message("Administrator verified / دسترسی مدیر تأیید شد");
    const {data: sourceRows, error: sourceError} = await db.from("research_sources").select("id,source_code,title").order("source_code");
    if (sourceError) throw sourceError;
    for (const source of sourceRows || []) el("source_id").add(new Option(source.source_code + " · " + source.title, source.id));
    await getRows();
  } catch (e) { message("Unable to open academic desk: " + e.message, false); return; }

  el("record").addEventListener("change", loadCurrent);
  el("cancel-claim").addEventListener("click", clearClaimEditor);

  el("editForm").addEventListener("submit", async event => {
    event.preventDefault(); if (!current || saving) return;
    const id = current.id, form = event.currentTarget;
    busy(form, true);
    try {
      const values = formValues(form);
      const {data, error} = await db.from("academic_records").update({
        evidence_status: values.evidence_status,
        rights_status: values.rights_status,
        public_note: values.public_note.trim(),
        updated_at: new Date().toISOString()
      }).eq("id", id).select("id");
      if (error) throw error;
      if (!data?.length) throw Error("No record changed; check admin access.");
      await getRows(id);
      message("Metadata saved / اطلاعات ثبت شد");
    } catch (e) { message(e.message, false); } finally { busy(form, false); }
  });

  async function setReviewState(next, label) {
    if (!current || saving) return;
    const previous = current.editorial_status, id = current.id;
    const {data, error} = await db.from("academic_records").update({
      editorial_status: next,
      latest_editorial_check: next === "editorially_checked" ? current.latest_editorial_check : null,
      updated_at: new Date().toISOString()
    }).eq("id", id).select("id");
    if (error || !data?.length) { message(error?.message || "Status update did not save.", false); return; }
    if (previous === "editorially_checked") {
      const change = await db.from("academic_revisions").insert({
        academic_record_id: id,
        summary: "Earlier editorial acceptance reopened for renewed research checking.",
        review_disclosure: "Review status reopened; no independent peer review is implied.",
        visible: true
      });
      if (change.error) message("Status changed, but public history could not be saved: " + change.error.message, false);
    }
    await getRows(id);
    message(label + " / وضعیت ذخیره شد");
  }
  el("start-review").addEventListener("click", () => setReviewState("in_review", "Review started"));
  el("needs-evidence").addEventListener("click", () => setReviewState("needs_more_evidence", "Evidence requested"));
  el("back-to-queue").addEventListener("click", () => setReviewState("queued", "Returned to queue"));

  el("claimForm").addEventListener("submit", async event => {
    event.preventDefault(); if (!current || saving) return;
    const id = current.id, form = event.currentTarget, values = formValues(form);
    if (!values.source_id && !values.other_source_url) { message("Source record or URL is required.", false); return; }
    if (["A", "B"].includes(values.evidence_class) && !values.source_locator.trim()) {
      message("Exact page, folio or document locator is required for source A/B.", false); return;
    }
    if (values.verification_status === "supported" && values.evidence_class === "D") {
      message("An unverified D-class lead cannot be marked supported without reclassification.", false); return;
    }
    if (values.verification_status === "disputed" && !values.editor_notes.trim()) {
      message("Explain the conflicting sources in private editor notes.", false); return;
    }
    busy(form, true);
    try {
      const body = {
        claim_text: values.claim_text.trim(),
        source_id: values.source_id || null,
        other_source_url: values.other_source_url || null,
        source_locator: values.source_locator.trim() || null,
        evidence_class: values.evidence_class,
        verification_status: values.verification_status,
        editor_notes: values.editor_notes.trim() || null
      };
      let query = values.claim_id ?
        db.from("academic_claims").update(body).eq("id", values.claim_id).eq("academic_record_id", id) :
        db.from("academic_claims").insert({...body, academic_record_id: id});
      const result = await query.select("id");
      if (result.error) throw result.error;
      if (!result.data?.length) throw Error("Claim was not saved.");
      const countQuery = await db.from("academic_claims").select("verification_status").eq("academic_record_id", id);
      if (countQuery.error) throw countQuery.error;
      const all = countQuery.data || [];
      const wasAccepted = current.editorial_status === "editorially_checked";
      const recordUpdate = await db.from("academic_records").update({
        total_claims: all.length,
        verified_claims: all.filter(c => c.verification_status === "supported").length,
        ...(wasAccepted ? {editorial_status: "in_review", latest_editorial_check: null} : {}),
        updated_at: new Date().toISOString()
      }).eq("id", id).select("id");
      if (recordUpdate.error || !recordUpdate.data?.length) throw Error(recordUpdate.error?.message || "Counts could not be updated.");
      if (wasAccepted) {
        const update = await db.from("academic_revisions").insert({
          academic_record_id: id,
          summary: "Prior editorial acceptance reopened because a claim or cited evidence was changed.",
          review_disclosure: "New source verification required; this is not independent peer review.",
          visible: true
        });
        if (update.error) message("Evidence saved; public reopen note failed: " + update.error.message, false);
      }
      await getRows(id);
      message(values.claim_id ? "Claim corrected / ادعا اصلاح شد" : "Claim added / ادعا ثبت شد");
    } catch (e) { message(e.message, false); } finally { busy(form, false); }
  });

  el("acceptForm").addEventListener("submit", async event => {
    event.preventDefault(); if (!current || saving) return;
    const reasons = getReadiness();
    if (reasons.length) { message("Not ready: " + reasons.join(" "), false); return; }
    const form = event.currentTarget, data = formValues(form);
    if (!el("accept-attest").checked) {
      message("Confirm you personally completed a real internal editorial review.", false); return;
    }
    if ((data.reviewer_name || "").trim().length < 3 || (data.review_notes || "").trim().length < 30) {
      message("Enter your real name and at least 30 characters of review findings.", false); return;
    }
    busy(form, true);
    try {
      const result = await db.rpc("hskrc_accept_editorial_review", {
        p_record_id: current.id,
        p_reviewer_name: data.reviewer_name.trim(),
        p_review_notes: data.review_notes.trim(),
        p_attested: true
      });
      if (result.error) throw result.error;
      form.reset();
      await getRows(current.id);
      message("Accepted after documented INTERNAL editorial review / تأیید تحریریه ثبت شد. NOT externally peer-reviewed.");
    } catch (e) { message("Acceptance failed: " + e.message, false); } finally { busy(form, false); }
  });

  el("reviewForm").addEventListener("submit", async event => {
    event.preventDefault(); if (!current || saving) return;
    const form = event.currentTarget, values = formValues(form), id = current.id;
    const external = values.review_type === "external_peer_review";
    if (external && (!values.reviewer_name?.trim() || !values.conflicts_declaration?.trim() ||
      !values.evidence_link?.trim() || !el("real-review").checked)) {
      message("External peer review requires a real reviewer, conflict declaration and actual report.", false); return;
    }
    busy(form, true);
    try {
      const payload = {
        academic_record_id: id,
        review_type: values.review_type,
        outcome: values.outcome,
        reviewer_name: values.reviewer_name.trim() || null,
        reviewer_affiliation: values.reviewer_affiliation.trim() || null,
        conflicts_declaration: values.conflicts_declaration.trim() || null,
        evidence_link: values.evidence_link || null,
        internal_notes: values.internal_notes.trim() || null,
        reviewed_at: values.outcome === "checked" ? new Date().toISOString() : null
      };
      const result = await db.from("academic_reviews").insert(payload).select("id");
      if (result.error || !result.data?.length) throw Error(result.error?.message || "Review not saved.");
      if (external) {
        const peerStatus = values.outcome === "checked" ? "externally_reviewed" : "under_external_review";
        const changed = await db.from("academic_records").update({
          peer_review_status: peerStatus,
          ...(peerStatus === "externally_reviewed" ? {external_review_date: new Date().toISOString().slice(0, 10)} : {}),
          updated_at: new Date().toISOString()
        }).eq("id", id).select("id");
        if (changed.error || !changed.data?.length) throw Error("Review logged, but public status failed to update.");
      }
      form.reset();
      await getRows(id);
      message("Review event saved / گزارش بررسی ثبت شد");
    } catch (e) { message(e.message, false); } finally { busy(form, false); }
  });

  el("revisionForm").addEventListener("submit", async event => {
    event.preventDefault(); if (!current || saving) return;
    const form = event.currentTarget, values = formValues(form);
    busy(form, true);
    try {
      const {data, error} = await db.from("academic_revisions").insert({
        academic_record_id: current.id, summary: values.summary.trim(),
        source_reference: values.source_reference.trim() || null,
        review_disclosure: values.review_disclosure.trim(), visible: true
      }).select("id");
      if (error || !data?.length) throw Error(error?.message || "Revision could not be saved.");
      form.reset();
      message("Public correction appended / اصلاح عمومی ثبت شد");
    } catch (e) { message(e.message, false); } finally { busy(form, false); }
  });
});
