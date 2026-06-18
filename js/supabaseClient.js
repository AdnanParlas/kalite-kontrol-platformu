/* ============================================================
   Supabase istemcisi (CDN üzerinden yüklenen global `supabase`)
   Bu dosyadan önce HTML'de şu script eklenmelidir:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

   Supabase yapılandırılmamışsa otomatik olarak DEMO (yerel)
   istemcisine düşer (js/localdb.js) -> kayıt/giriş yine çalışır,
   ama veriler yalnızca bu tarayıcıda saklanır.
   ============================================================ */

let _client = null;

window.isLocalMode = function () {
  return !(window.isConfigured && window.isConfigured());
};

window.getSupabase = function () {
  if (_client) return _client;

  // Gerçek Supabase
  if (window.isConfigured && window.isConfigured() &&
      window.supabase && window.supabase.createClient) {
    _client = window.supabase.createClient(
      window.APP_CONFIG.SUPABASE_URL,
      window.APP_CONFIG.SUPABASE_ANON_KEY
    );
    return _client;
  }

  // Demo (yerel) mod
  if (window.getLocalClient) {
    _client = window.getLocalClient();
    return _client;
  }
  return null;
};

// Demo modunda bilgilendirme bandı göster (engellemez, false döner).
window.showConfigWarningIfNeeded = function () {
  if (!window.isLocalMode()) return false;
  if (document.querySelector(".config-warn")) return false;
  const div = document.createElement("div");
  div.className = "config-warn";
  div.setAttribute("data-i18n", "local_mode_warning");
  div.textContent = (window.i18n ? window.i18n.t("local_mode_warning") : "Demo (yerel) mod: veriler bu tarayıcıda saklanır.");
  const main = document.querySelector("main") || document.body;
  main.insertBefore(div, main.firstChild);
  return false; // engelleme yok; sayfa demo modda da çalışır
};
