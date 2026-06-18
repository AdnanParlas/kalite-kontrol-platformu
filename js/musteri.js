/* ============================================================
   musteri.js — Müşteri (Hizmet Alan) paneli
   - Yeni talep oluştur
   - Kayıtlı firmaları listele
   - Taleplerim + gelen teklifler (kabul/red) + rapor görüntüleme
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

  let sb, profile;

  window.initMusteri = function (p) {
    profile = p;
    sb = window.getSupabase();
    document.getElementById("request-form").addEventListener("submit", onCreateRequest);
    document.getElementById("ai-form-btn").addEventListener("click", onGenerateForm);
    loadCompanies();
    loadMyRequests();
  };

  // ---------- Akıllı form üret ----------
  async function onGenerateForm() {
    const form = document.getElementById("request-form");
    const btn = document.getElementById("ai-form-btn");
    const notes = form.querySelector("[name=notes]");
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = window.i18n.t("ai_generating");
    try {
      const text = await window.AI.generateForm({
        product: form.querySelector("[name=product_name]").value,
        controlType: form.querySelector("[name=control_type]").value,
        lang: window.i18n.getLang(),
      });
      notes.value = text + (notes.value ? "\n\n" + notes.value : "");
    } catch (err) {
      alert(err.message || "Hata");
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  }

  // ---------- Yeni talep ----------
  async function onCreateRequest(e) {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const msg = document.getElementById("req-msg");
    const btn = form.querySelector("button");
    btn.disabled = true;
    try {
      const { error } = await sb.from("requests").insert({
        customer_id: profile.id,
        product_name: fd.get("product_name"),
        factory_name: fd.get("factory_name"),
        factory_city: fd.get("factory_city"),
        control_type: fd.get("control_type"),
        quantity: fd.get("quantity") ? parseInt(fd.get("quantity"), 10) : null,
        notes: fd.get("notes"),
        status: "open",
      });
      if (error) throw error;
      showMsg(msg, window.i18n.t("request_created"), "success");
      form.reset();
      loadMyRequests();
    } catch (err) {
      showMsg(msg, err.message || "Hata", "error");
    } finally {
      btn.disabled = false;
    }
  }

  // ---------- Firmalar ----------
  async function loadCompanies() {
    const box = document.getElementById("companies-list");
    box.innerHTML = `<div class="loader">${window.i18n.t("loading")}</div>`;
    const { data, error } = await sb.from("companies").select("*").order("verified", { ascending: false }).order("rating", { ascending: false });
    if (error) { box.innerHTML = `<div class="empty">${esc(error.message)}</div>`; return; }
    if (!data || !data.length) { box.innerHTML = `<div class="empty">${window.i18n.t("no_companies")}</div>`; return; }

    box.innerHTML = data.map(c => {
      const services = (c.services || "").split(",").map(s => s.trim()).filter(Boolean);
      const tag = c.verified
        ? `<span class="tag verified">✓ ${window.i18n.t("verified")}</span>`
        : `<span class="tag pending">${window.i18n.t("not_verified")}</span>`;
      return `
        <div class="item-card">
          <div class="row-top">
            <h3>${esc(c.name)}</h3>
            ${tag}
          </div>
          <div class="meta">📍 ${esc(c.city || "-")} · ${window.i18n.t("experience")}: ${esc(c.experience_years || 0)} ${window.i18n.t("years")}
            ${c.rating ? ` · <span class="rating">★ ${esc(c.rating)}</span>` : ""}</div>
          ${c.description ? `<div class="desc">${esc(c.description)}</div>` : ""}
          ${services.length ? `<div class="chips">${services.map(s => `<span class="chip">${esc(s)}</span>`).join("")}</div>` : ""}
        </div>`;
    }).join("");
  }

  // ---------- Taleplerim + teklifler ----------
  async function loadMyRequests() {
    const box = document.getElementById("my-requests-list");
    box.innerHTML = `<div class="loader">${window.i18n.t("loading")}</div>`;

    const { data: reqs, error } = await sb.from("requests")
      .select("*").eq("customer_id", profile.id).order("created_at", { ascending: false });
    if (error) { box.innerHTML = `<div class="empty">${esc(error.message)}</div>`; return; }
    if (!reqs || !reqs.length) { box.innerHTML = `<div class="empty">${window.i18n.t("no_requests")}</div>`; return; }

    const reqIds = reqs.map(r => r.id);
    // gelen teklifler (firma adıyla)
    const { data: offers } = await sb.from("offers")
      .select("*, companies(name, city, rating, verified)").in("request_id", reqIds);
    // raporlar
    const { data: reports } = await sb.from("reports").select("*").in("request_id", reqIds);

    const offersByReq = {};
    (offers || []).forEach(o => { (offersByReq[o.request_id] ||= []).push(o); });
    const reportByReq = {};
    (reports || []).forEach(r => { reportByReq[r.request_id] = r; });

    box.innerHTML = reqs.map(r => renderRequest(r, offersByReq[r.id] || [], reportByReq[r.id])).join("");

    // event'leri bağla
    box.querySelectorAll("[data-accept]").forEach(b =>
      b.addEventListener("click", () => respondOffer(b.dataset.accept, b.dataset.req, "accepted")));
    box.querySelectorAll("[data-reject]").forEach(b =>
      b.addEventListener("click", () => respondOffer(b.dataset.reject, b.dataset.req, "rejected")));

    // mesaj thread toggle
    box.querySelectorAll(".msg-toggle").forEach(b => b.addEventListener("click", () => {
      const slot = box.querySelector(`[data-slot="${b.dataset.msgFirm}_${b.dataset.req}"]`);
      if (slot.dataset.open === "1") { slot.innerHTML = ""; slot.dataset.open = "0"; return; }
      slot.dataset.open = "1";
      window.Messages.mount(slot, {
        requestId: b.dataset.req,
        customerId: profile.id,
        firmOwnerId: b.dataset.msgFirm,
        myRole: "musteri",
        myId: profile.id,
      });
    }));
  }

  function renderRequest(r, offers, report) {
    const offersHtml = offers.length ? offers.map(o => {
      const comp = o.companies || {};
      const statusTag = `<span class="tag ${o.status}">${o.status === "pending" ? "•" : (o.status === "accepted" ? "✓" : "✕")} ${o.status}</span>`;
      const actions = o.status === "pending"
        ? `<div class="actions-row">
             <button class="btn btn-success btn-sm" data-accept="${o.id}" data-req="${r.id}">${window.i18n.t("accept")}</button>
             <button class="btn btn-outline btn-sm" data-reject="${o.id}" data-req="${r.id}">${window.i18n.t("reject")}</button>
           </div>`
        : "";
      return `
        <div class="offer-box">
          <div class="row-top">
            <strong>${esc(comp.name || "Firma")}</strong> ${statusTag}
          </div>
          <div class="meta">💰 ${esc(o.price ?? "-")} ${esc(o.currency || "")} · 📅 ${esc(o.proposed_date || "-")}</div>
          ${o.message ? `<div class="desc">${esc(o.message)}</div>` : ""}
          ${actions}
          <button class="btn btn-light btn-sm msg-toggle" data-msg-firm="${esc(o.firm_owner_id)}" data-req="${esc(r.id)}">💬 ${window.i18n.t("msg_with_firm")}</button>
          <div class="msg-slot" data-slot="${esc(o.firm_owner_id)}_${esc(r.id)}"></div>
        </div>`;
    }).join("") : `<div class="empty">${window.i18n.t("no_offers")}</div>`;

    const reportHtml = report ? `
      <hr class="divider"/>
      <div>
        <strong>📄 ${window.i18n.t("report_title")}</strong>
        <div class="desc">${esc(report.summary || "")}</div>
        ${report.checklist ? `<div class="meta">${esc(report.checklist)}</div>` : ""}
        ${report.file_url ? `<a class="btn btn-light btn-sm" target="_blank" href="${esc(report.file_url)}">${window.i18n.t("view_report")}</a>` : ""}
      </div>` : "";

    return `
      <div class="item-card">
        <div class="row-top">
          <h3>${esc(r.product_name)}</h3>
          <span class="tag ${r.status}">${esc(r.status)}</span>
        </div>
        <div class="meta">🏭 ${esc(r.factory_name || "-")} · 📍 ${esc(r.factory_city || "-")} · ${ctrlLabel(r.control_type)}${r.quantity ? ` · ${esc(r.quantity)} ${window.i18n.t("quantity_short")}` : ""}</div>
        ${r.notes ? `<div class="desc">${esc(r.notes)}</div>` : ""}
        <hr class="divider"/>
        <div class="meta"><strong>${window.i18n.t("offers_received")}</strong></div>
        ${offersHtml}
        ${reportHtml}
      </div>`;
  }

  async function respondOffer(offerId, requestId, newStatus) {
    try {
      const { error } = await sb.from("offers").update({ status: newStatus }).eq("id", offerId);
      if (error) throw error;
      if (newStatus === "accepted") {
        // talebi matched yap, diğer teklifleri reddet
        await sb.from("requests").update({ status: "matched" }).eq("id", requestId);
        await sb.from("offers").update({ status: "rejected" })
          .eq("request_id", requestId).neq("id", offerId).eq("status", "pending");
      }
      loadMyRequests();
    } catch (err) {
      alert(err.message || "Hata");
    }
  }
})();
