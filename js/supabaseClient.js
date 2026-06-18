/* ============================================================
   Supabase istemcisi (CDN üzerinden yüklenen global `supabase`)
   Bu dosyadan önce HTML'de şu script eklenmelidir:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ============================================================ */

let _client = null;

window.getSupabase = function () {
  if (_client) return _client;
  if (!window.isConfigured || !window.isConfigured()) return null;
  if (!window.supabase || !window.supabase.createClient) return null;
  _client = window.supabase.createClient(
    window.APP_CONFIG.SUPABASE_URL,
    window.APP_CONFIG.SUPABASE_ANON_KEY
  );
  return _client;
};

// Yapılandırma yoksa sayfada uyarı göster
window.showConfigWarningIfNeeded = function () {
  if (window.isConfigured && window.isConfigured()) return false;
  const div = document.createElement("div");
  div.className = "config-warn";
  div.setAttribute("data-i18n", "config_warning");
  div.textContent = (window.i18n ? window.i18n.t("config_warning") : "Supabase ayarları yapılmadı (js/config.js).");
  const main = document.querySelector("main") || document.body;
  main.insertBefore(div, main.firstChild);
  return true;
};
