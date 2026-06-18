/* ============================================================
   firma.js — Kalite Kontrol Firması paneli
   - Firma profili oluştur/düzenle
   - Açık talepleri gör + teklif ver
   - İşlerim (kabul edilen teklifler) + rapor yükle
   ============================================================ */

(function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function showMsg(el, text, type) { el.textContent = text; el.className = "form-msg show " + type; }
  function ctrlLabel(v) {
    const map = { pre: "ctrl_pre", during: "ctrl_during", final: "ctrl_final", loading: "ctrl_loading", audit: "ctrl_factory_audit" };
    return map[v] ? window.i18n.t(map[v]) : (v || "");
  }

  let sb, profile, company = null;

  window.initFirma = function (p) {
    profile = p;
    sb = window.getSupabase();
    document.getElementById("company-form").addEventListener("submit", onSaveCompany);
    document.getElementById("ver-upload-btn").addEventListener("click", onUploadVerification);
    loadCompany().then(() => {
      loadOpenRequests();
      loadMyJobs();
    });
  };

  // ---------- Doğrulama ----------
  function renderVerification() {
    const tag = document.getElementById("ver-status-tag");
    const note = document.getElementById("ver-note");
    const st = (company && company.verification_status) || "none";
    const map = {
      none:     { cls: "pending",  key: "ver_status_none" },
      pending:  { cls: "matched",  key: "ver_status_pending" },
      approved: { cls: "verified", key: "ver_status_approved" },
      rejected: { cls: "cancelled",key: "ver_status_rejected" },
    };
    const m = map[st] || map.none;
    tag.innerHTML = `<span class="tag ${m.cls}">${window.i18n.t(m.key)}</span>`;
    note.textContent = (company && company.verification_note)
      ? window.i18n.t("ver_note") + ": " + company.verification_note : "";
  }

  async function onUploadVerification() {
    const msg = document.getElementById("ver-msg");
    const fileInput = document.getElementById("ver-file");
    if (!company) { msg.textContent = window.i18n.t("ver_need_company"); return; }
    if (!fileInput.files || !fileInput.files[0]) { return; }
    const btn = document.getElementById("ver-upload-btn");
    btn.disabled = true;
    try {
      const file = fileInput.files[0];
      const path = `${profile.id}/${Date.now()}-${file.name}`;
      const up = await sb.storage.from("verification").upload(path, file, { upsert: true });
      if (up.error) throw up.error;
      const { data: pub } = sb.storage.from("verification").getPublicUrl(path);
      const { data, error } = await sb.from("companies").update({
        verification_doc_url: pub.publicUrl,
        verification_status: "pending",
      }).eq("owner_id", profile.id).select().single();
      if (error) throw error;
      company = data;
      msg.textContent = "✓ " + window.i18n.t("ver_uploaded");
      renderVerification();
    } catch (err) {
      msg.textContent = err.message || "Hata";
    } finally {
      btn.disabled = false;
    }
  }

  // ---------- Firma profili ----------
  async function loadCompany() {
    const { data } = await sb.from("companies").select("*").eq("owner_id", profile.id).maybeSingle();
    company = data || null;
    const form = document.getElementById("company-form");
    const tag = document.getElementById("verify-tag");
    if (company) {
      form.name.value = company.name || "";
      form.city.value = company.city || "";
      form.experience_years.value = company.experience_years || "";
      form.license_no.value = company.license_no || "";
      form.certificate_info.value = company.certificate_info || "";
      form.services.value = company.services || "";
      form.description.value = company.description || "";
      tag.innerHTML = company.verified
        ? `<span class="tag verified">✓ ${window.i18n.t("verified")}</span>`
        : `<span class="tag pending">${window.i18n.t("not_verified")}</span>`;
    } else {
      const msg = document.getElementById("company-msg");
      showMsg(msg, window.i18n.t("no_company_yet"), "error");
    }
    renderVerification();
  }

  async function onSaveCompany(e) {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const msg = document.getElementById("company-msg");
    const btn = form.querySelector("button");
    btn.disabled = true;
    try {
      const payload = {
        owner_id: profile.id,
        name: fd.get("name"),
        city: fd.get("city"),
        experience_years: fd.get("experience_years") ? parseInt(fd.get("experience_years"), 10) : 0,
        license_no: fd.get("license_no"),
        certificate_info: fd.get("certificate_info"),
        services: fd.get("services"),
        description: fd.get("description"),
      };
      // owner_id benzersiz -> upsert ile oluştur/güncelle
      const { data, error } = await sb.from("companies").upsert(payload, { onConflict: "owner_id" }).select().single();
      if (error) throw error;
      company = data;
      showMsg(msg, window.i18n.t("company_saved"), "success");
      loadMyJobs();
    } catch (err) {
      showMsg(msg, err.message || "Hata", "error");
    } finally {
      btn.disabled = false;
    }
  }

  // ---------- Açık talepler ----------
  async function loadOpenRequests() {
    const box = document.getElementById("open-requests-list");
    box.innerHTML = `<div class="loader">${window.i18n.t("loading")}</div>`;

    const { data: reqs, error } = await sb.from("requests")
      .select("*").eq("status", "open").order("created_at", { ascending: false });
    if (error) { box.innerHTML = `<div class="empty">${esc(error.message)}</div>`; return; }
    if (!reqs || !reqs.length) { box.innerHTML = `<div class="empty">${window.i18n.t("no_open_requests")}</div>`; return; }

    // bu firmanın daha önce teklif verdiği talepler
    let myOfferReqIds = new Set();
    if (company) {
      const { data: myOffers } = await sb.from("offers").select("request_id").eq("firm_owner_id", profile.id);
      (myOffers || []).forEach(o => myOfferReqIds.add(o.request_id));
    }

    box.innerHTML = reqs.map(r => {
      const already = myOfferReqIds.has(r.id);
      const offerBtn = !company
        ? `<div class="meta">${window.i18n.t("no_company_yet")}</div>`
        : already
          ? `<div class="meta">✓ ${window.i18n.t("offer_sent")}</div>`
          : `<button class="btn btn-primary btn-sm" data-offer="${r.id}">${window.i18n.t("make_offer")}</button>`;
      return `
        <div class="item-card" data-card="${r.id}">
          <div class="row-top">
            <h3>${esc(r.product_name)}</h3>
            <span class="tag open">${esc(r.status)}</span>
          </div>
          <div class="meta">🏭 ${esc(r.factory_name || "-")} · 📍 ${esc(r.factory_city || "-")} · ${ctrlLabel(r.control_type)}${r.quantity ? ` · ${esc(r.quantity)} ${window.i18n.t("quantity_short")}` : ""}</div>
          ${r.notes ? `<div class="desc">${esc(r.notes)}</div>` : ""}
          <div class="actions-row">
            ${offerBtn}
            <button class="btn btn-light btn-sm fmsg-toggle" data-cust="${esc(r.customer_id)}" data-req="${esc(r.id)}">💬 ${window.i18n.t("msg_with_customer")}</button>
          </div>
          <div class="offer-form-slot"></div>
          <div class="fmsg-slot" data-fslot="${esc(r.id)}"></div>
        </div>`;
    }).join("");

    box.querySelectorAll("[data-offer]").forEach(b =>
      b.addEventListener("click", () => showOfferForm(b.dataset.offer)));
    bindFirmMsgToggles(box);
  }

  // Firma -> müşteri mesaj thread'i (açık talepler ve işlerde ortak)
  function bindFirmMsgToggles(scope) {
    scope.querySelectorAll(".fmsg-toggle").forEach(b => b.addEventListener("click", () => {
      const slot = scope.querySelector(`[data-fslot="${b.dataset.req}"]`);
      if (slot.dataset.open === "1") { slot.innerHTML = ""; slot.dataset.open = "0"; return; }
      slot.dataset.open = "1";
      window.Messages.mount(slot, {
        requestId: b.dataset.req,
        customerId: b.dataset.cust,
        firmOwnerId: profile.id,
        myRole: "firma",
        myId: profile.id,
      });
    }));
  }

  function showOfferForm(requestId) {
    const card = document.querySelector(`[data-card="${requestId}"]`);
    const slot = card.querySelector(".offer-form-slot");
    if (slot.dataset.open === "1") { slot.innerHTML = ""; slot.dataset.open = "0"; return; }
    slot.dataset.open = "1";
    slot.innerHTML = `
      <div class="offer-box">
        <div class="grid-2">
          <div class="field"><label>${window.i18n.t("f_price")}</label><input type="number" class="of-price" min="0" step="0.01"/></div>
          <div class="field"><label>${window.i18n.t("f_currency")}</label>
            <select class="of-curr"><option>USD</option><option>EUR</option><option>CNY</option><option>TRY</option></select></div>
        </div>
        <div class="field"><label>${window.i18n.t("f_proposed_date")}</label><input type="date" class="of-date"/></div>
        <div class="field"><label>${window.i18n.t("f_offer_msg")}</label><textarea class="of-msg"></textarea></div>
        <button class="btn btn-success btn-sm of-send">${window.i18n.t("btn_send_offer")}</button>
        <span class="of-status meta"></span>
      </div>`;
    slot.querySelector(".of-send").addEventListener("click", () => sendOffer(requestId, slot));
  }

  async function sendOffer(requestId, slot) {
    const status = slot.querySelector(".of-status");
    const btn = slot.querySelector(".of-send");
    btn.disabled = true;
    try {
      const { error } = await sb.from("offers").insert({
        request_id: requestId,
        company_id: company.id,
        firm_owner_id: profile.id,
        price: parseFloat(slot.querySelector(".of-price").value) || null,
        currency: slot.querySelector(".of-curr").value,
        proposed_date: slot.querySelector(".of-date").value || null,
        message: slot.querySelector(".of-msg").value,
        status: "pending",
      });
      if (error) throw error;
      status.textContent = "✓ " + window.i18n.t("offer_sent");
      loadOpenRequests();
    } catch (err) {
      status.textContent = err.message || "Hata";
      btn.disabled = false;
    }
  }

  // ---------- İşlerim (kabul edilen teklifler) ----------
  async function loadMyJobs() {
    const box = document.getElementById("my-jobs-list");
    box.innerHTML = `<div class="loader">${window.i18n.t("loading")}</div>`;

    const { data: offers, error } = await sb.from("offers")
      .select("*, requests(*)").eq("firm_owner_id", profile.id).eq("status", "accepted")
      .order("created_at", { ascending: false });
    if (error) { box.innerHTML = `<div class="empty">${esc(error.message)}</div>`; return; }
    if (!offers || !offers.length) { box.innerHTML = `<div class="empty">—</div>`; return; }

    const reqIds = offers.map(o => o.request_id);
    const { data: reports } = await sb.from("reports").select("*").in("request_id", reqIds).eq("firm_owner_id", profile.id);
    const reportByReq = {};
    (reports || []).forEach(r => { reportByReq[r.request_id] = r; });

    box.innerHTML = offers.map(o => {
      const r = o.requests || {};
      const report = reportByReq[o.request_id];
      const reportBlock = report
        ? `<div class="offer-box"><strong>📄 ${window.i18n.t("report_title")}</strong>
             <div class="desc">${esc(report.summary || "")}</div>
             ${report.file_url ? `<a class="btn btn-light btn-sm" target="_blank" href="${esc(report.file_url)}">${window.i18n.t("view_report")}</a>` : ""}
           </div>`
        : `<div class="report-slot"></div>
           <button class="btn btn-primary btn-sm" data-report="${o.request_id}">${window.i18n.t("upload_report")}</button>`;
      return `
        <div class="item-card" data-job="${o.request_id}">
          <div class="row-top">
            <h3>${esc(r.product_name || "-")}</h3>
            <span class="tag accepted">✓ ${window.i18n.t("accepted_offer")}</span>
          </div>
          <div class="meta">🏭 ${esc(r.factory_name || "-")} · 📍 ${esc(r.factory_city || "-")} · ${ctrlLabel(r.control_type)}</div>
          <div class="meta">💰 ${esc(o.price ?? "-")} ${esc(o.currency || "")} · 📅 ${esc(o.proposed_date || "-")}</div>
          <div class="actions-row">
            <button class="btn btn-light btn-sm fmsg-toggle" data-cust="${esc(r.customer_id)}" data-req="${esc(o.request_id)}">💬 ${window.i18n.t("msg_with_customer")}</button>
          </div>
          <div class="fmsg-slot" data-fslot="${esc(o.request_id)}"></div>
          <hr class="divider"/>
          ${reportBlock}
        </div>`;
    }).join("");

    box.querySelectorAll("[data-report]").forEach(b =>
      b.addEventListener("click", () => showReportForm(b.dataset.report, b)));
    bindFirmMsgToggles(box);
  }

  function showReportForm(requestId, btn) {
    const card = document.querySelector(`[data-job="${requestId}"]`);
    const slot = card.querySelector(".report-slot");
    if (slot.dataset.open === "1") { slot.innerHTML = ""; slot.dataset.open = "0"; return; }
    slot.dataset.open = "1";
    slot.innerHTML = `
      <div class="offer-box">
        <div class="field"><label>${window.i18n.t("f_report_summary")}</label><textarea class="rp-summary"></textarea></div>
        <div class="field"><label>${window.i18n.t("f_report_checklist")}</label><textarea class="rp-checklist" placeholder="Adet OK, Etiket OK, Paketleme OK..."></textarea></div>
        <div class="field"><label>${window.i18n.t("f_report_file")}</label><input type="file" class="rp-file" accept=".pdf,image/*"/></div>
        <button class="btn btn-success btn-sm rp-send">${window.i18n.t("btn_submit_report")}</button>
        <span class="rp-status meta"></span>
      </div>`;
    slot.querySelector(".rp-send").addEventListener("click", () => submitReport(requestId, slot));
  }

  async function submitReport(requestId, slot) {
    const status = slot.querySelector(".rp-status");
    const sendBtn = slot.querySelector(".rp-send");
    sendBtn.disabled = true;
    try {
      let fileUrl = null;
      const fileInput = slot.querySelector(".rp-file");
      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const path = `${profile.id}/${requestId}-${Date.now()}-${file.name}`;
        const up = await sb.storage.from("reports").upload(path, file, { upsert: true });
        if (up.error) throw up.error;
        const { data: pub } = sb.storage.from("reports").getPublicUrl(path);
        fileUrl = pub.publicUrl;
      }
      const { error } = await sb.from("reports").insert({
        request_id: requestId,
        company_id: company ? company.id : null,
        firm_owner_id: profile.id,
        summary: slot.querySelector(".rp-summary").value,
        checklist: slot.querySelector(".rp-checklist").value,
        file_url: fileUrl,
      });
      if (error) throw error;
      // talebi tamamlandı yap
      await sb.from("requests").update({ status: "completed" }).eq("id", requestId);
      status.textContent = "✓ " + window.i18n.t("report_submitted");
      loadMyJobs();
    } catch (err) {
      status.textContent = err.message || "Hata";
      sendBtn.disabled = false;
    }
  }
})();
