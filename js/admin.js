/* ============================================================
   admin.js — Yönetici: firma doğrulama onay/red
   Sadece profiles.is_admin = true olan kullanıcılar erişebilir
   (RLS: companies_admin_update -> public.is_admin()).
   ============================================================ */

(function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  let sb, profile;

  window.initAdmin = function (p) {
    profile = p;
    sb = window.getSupabase();
    load();
  };

  async function load() {
    const { data, error } = await sb.from("companies").select("*").order("created_at", { ascending: false });
    const pendingBox = document.getElementById("pending-list");
    const allBox = document.getElementById("all-list");
    if (error) { pendingBox.innerHTML = `<div class="empty">${esc(error.message)}</div>`; return; }

    const all = data || [];
    const pending = all.filter(c => c.verification_status === "pending");

    pendingBox.innerHTML = pending.length
      ? pending.map(card).join("")
      : `<div class="empty">${window.i18n.t("admin_none")}</div>`;
    allBox.innerHTML = all.length
      ? all.map(c => card(c, true)).join("")
      : `<div class="empty">—</div>`;

    bind(pendingBox);
    bind(allBox);
  }

  function statusTag(c) {
    const map = {
      none:     { cls: "pending",   key: "ver_status_none" },
      pending:  { cls: "matched",   key: "ver_status_pending" },
      approved: { cls: "verified",  key: "ver_status_approved" },
      rejected: { cls: "cancelled", key: "ver_status_rejected" },
    };
    const m = map[c.verification_status] || map.none;
    return `<span class="tag ${m.cls}">${window.i18n.t(m.key)}</span>`;
  }

  function card(c, compact) {
    const doc = c.verification_doc_url
      ? `<a class="btn btn-light btn-sm" target="_blank" href="${esc(c.verification_doc_url)}">${window.i18n.t("admin_view_doc")}</a>`
      : "";
    const actions = `
      <div class="actions-row">
        ${doc}
        <button class="btn btn-success btn-sm" data-approve="${esc(c.id)}">${window.i18n.t("admin_approve")}</button>
        <button class="btn btn-outline btn-sm" data-reject="${esc(c.id)}">${window.i18n.t("admin_reject")}</button>
      </div>`;
    return `
      <div class="item-card">
        <div class="row-top">
          <h3>${esc(c.name)} ${c.verified ? "✓" : ""}</h3>
          ${statusTag(c)}
        </div>
        <div class="meta">📍 ${esc(c.city || "-")} · ${window.i18n.t("experience")}: ${esc(c.experience_years || 0)} ${window.i18n.t("years")}</div>
        ${c.license_no ? `<div class="meta">${window.i18n.t("f_license")}: ${esc(c.license_no)}</div>` : ""}
        ${c.certificate_info ? `<div class="meta">${window.i18n.t("f_certificate")}: ${esc(c.certificate_info)}</div>` : ""}
        ${c.verification_note ? `<div class="meta">${window.i18n.t("ver_note")}: ${esc(c.verification_note)}</div>` : ""}
        ${actions}
      </div>`;
  }

  function bind(scope) {
    scope.querySelectorAll("[data-approve]").forEach(b =>
      b.addEventListener("click", () => approve(b.dataset.approve)));
    scope.querySelectorAll("[data-reject]").forEach(b =>
      b.addEventListener("click", () => reject(b.dataset.reject)));
  }

  async function approve(id) {
    const { error } = await sb.from("companies").update({
      verified: true, verification_status: "approved", verification_note: null,
    }).eq("id", id);
    if (error) { alert(error.message); return; }
    load();
  }

  async function reject(id) {
    const note = window.prompt(window.i18n.t("admin_reject_prompt")) || "";
    const { error } = await sb.from("companies").update({
      verified: false, verification_status: "rejected", verification_note: note,
    }).eq("id", id);
    if (error) { alert(error.message); return; }
    load();
  }
})();
