/* ============================================================
   messages.js — Platform içi mesajlaşma (yeniden kullanılabilir)
   Bir konuşma = (requestId + customerId + firmOwnerId).
   Kullanım:
     window.Messages.mount(containerEl, {
       requestId, customerId, firmOwnerId, myRole // 'musteri' | 'firma'
     });
   ============================================================ */

(function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function fmtTime(ts) {
    try { return new Date(ts).toLocaleString(); } catch { return ts || ""; }
  }

  async function load(container, ctx) {
    const sb = window.getSupabase();
    const list = container.querySelector(".msg-list");
    list.innerHTML = `<div class="loader">${window.i18n.t("loading")}</div>`;

    const { data, error } = await sb.from("messages").select("*")
      .eq("request_id", ctx.requestId)
      .eq("customer_id", ctx.customerId)
      .eq("firm_owner_id", ctx.firmOwnerId)
      .order("created_at", { ascending: true });

    if (error) { list.innerHTML = `<div class="empty">${esc(error.message)}</div>`; return; }
    if (!data || !data.length) { list.innerHTML = `<div class="empty">${window.i18n.t("msg_empty")}</div>`; return; }

    list.innerHTML = data.map(m => {
      const mine = m.sender_id === ctx.myId;
      const canTranslate = !mine; // karşı tarafın mesajını çevir
      return `
        <div class="msg-bubble ${mine ? "mine" : "theirs"}">
          <div class="msg-body">${esc(m.body)}</div>
          <div class="msg-meta">${fmtTime(m.created_at)}
            ${canTranslate ? ` · <a href="#" class="msg-tr" data-text="${esc(m.body)}" data-role="${esc(m.sender_role)}">🌐 ${window.i18n.t("msg_translate")}</a>` : ""}
          </div>
          <div class="msg-tr-result"></div>
        </div>`;
    }).join("");
    list.scrollTop = list.scrollHeight;

    // çeviri butonları
    list.querySelectorAll(".msg-tr").forEach(a => {
      a.addEventListener("click", async (e) => {
        e.preventDefault();
        const resultEl = a.closest(".msg-bubble").querySelector(".msg-tr-result");
        resultEl.textContent = window.i18n.t("msg_translating");
        // gönderen firma ise kaynak Çince, müşteri ise Türkçe
        const source = a.dataset.role === "firma" ? "zh-CN" : "tr";
        const target = ctx.myRole === "firma" ? "zh-CN" : "tr";
        try {
          const tr = await window.AI.translate(a.dataset.text, source, target);
          resultEl.innerHTML = `<span class="msg-tr-text">🌐 ${esc(tr)}</span>`;
        } catch (err) {
          resultEl.textContent = err.message || "Çeviri hatası";
        }
      });
    });
  }

  window.Messages = {
    mount(container, ctx) {
      const sb = window.getSupabase();
      ctx.myId = ctx.myId || (window.currentUserId || null);
      container.innerHTML = `
        <div class="msg-thread">
          <div class="msg-list"></div>
          <form class="msg-form">
            <input type="text" class="msg-input" placeholder="${window.i18n.t("msg_placeholder")}" />
            <button type="submit" class="btn btn-primary btn-sm">${window.i18n.t("msg_send")}</button>
          </form>
        </div>`;

      load(container, ctx);

      container.querySelector(".msg-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = container.querySelector(".msg-input");
        const body = input.value.trim();
        if (!body) return;
        input.value = "";
        const { error } = await sb.from("messages").insert({
          request_id: ctx.requestId,
          customer_id: ctx.customerId,
          firm_owner_id: ctx.firmOwnerId,
          sender_id: ctx.myId,
          sender_role: ctx.myRole,
          body,
        });
        if (error) { alert(error.message); return; }
        load(container, ctx);
      });
    }
  };
})();
