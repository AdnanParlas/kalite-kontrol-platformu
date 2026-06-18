/* ============================================================
   auth.js — Kayıt / Giriş / Çıkış / Oturum koruması
   Supabase Auth (e-posta + şifre) kullanır. Rol user_metadata'da
   ve profiles tablosunda tutulur.
   ============================================================ */

const Auth = {
  async signUp({ email, password, role, full_name, phone }) {
    const sb = window.getSupabase();
    if (!sb) throw new Error("Supabase yapılandırılmadı (js/config.js).");
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name, phone },
        emailRedirectTo: window.location.origin + window.location.pathname.replace(/auth\.html$/, "auth.html"),
      },
    });
    if (error) throw error;
    return data;
  },

  async signIn({ email, password }) {
    const sb = window.getSupabase();
    if (!sb) throw new Error("Supabase yapılandırılmadı (js/config.js).");
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const sb = window.getSupabase();
    if (sb) await sb.auth.signOut();
    window.location.href = "index.html";
  },

  async getSession() {
    const sb = window.getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session;
  },

  async getUser() {
    const sb = window.getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getUser();
    return data.user;
  },

  // profiles tablosundan rol bilgisini çek; yoksa user_metadata'dan üret
  async getProfile() {
    const sb = window.getSupabase();
    if (!sb) return null;
    const user = await this.getUser();
    if (!user) return null;

    let { data, error } = await sb.from("profiles").select("*").eq("id", user.id).single();

    // Trigger henüz işlememişse profili user_metadata'dan oluştur
    if (error || !data) {
      const meta = user.user_metadata || {};
      const fallback = {
        id: user.id,
        role: meta.role || "musteri",
        full_name: meta.full_name || "",
        phone: meta.phone || "",
      };
      const ins = await sb.from("profiles").upsert(fallback).select().single();
      data = ins.data || fallback;
    }
    data.email = user.email;
    return data;
  },

  // Oturum yoksa auth sayfasına yönlendir; varsa profili döndür
  async requireAuth() {
    const session = await this.getSession();
    if (!session) {
      window.location.href = "auth.html";
      return null;
    }
    return await this.getProfile();
  },
};

window.Auth = Auth;
