/* ============================================================
   Supabase Yapılandırması
   ------------------------------------------------------------
   Aşağıdaki iki değeri kendi Supabase projenizden alıp doldurun:
   Supabase Panel > Project Settings > API
     - Project URL  -> SUPABASE_URL
     - anon public key -> SUPABASE_ANON_KEY

   NOT: anon key istemci tarafında görünür, bu normaldir. Güvenlik
   veritabanındaki RLS (Row Level Security) politikalarıyla sağlanır.
   service_role anahtarını ASLA buraya koymayın.
   ============================================================ */

window.APP_CONFIG = {
  SUPABASE_URL: "BURAYA_SUPABASE_URL",
  SUPABASE_ANON_KEY: "BURAYA_SUPABASE_ANON_KEY",

  // (Opsiyonel) Gerçek AI form üretimi / çeviri için Supabase Edge Function URL'i.
  // Boş bırakırsanız: çeviri ücretsiz MyMemory ile, akıllı form yerel şablonla çalışır.
  // Örn: "https://xxxxx.supabase.co/functions/v1/ai"
  AI_ENDPOINT: "",
};

// Yapılandırma yapılmış mı?
window.isConfigured = function () {
  const c = window.APP_CONFIG;
  return c &&
    c.SUPABASE_URL && c.SUPABASE_URL.startsWith("http") &&
    c.SUPABASE_ANON_KEY && c.SUPABASE_ANON_KEY.length > 20;
};
