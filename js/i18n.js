/* ============================================================
   i18n — Basit TR/EN sözlük + değiştirici
   Kullanım: HTML'de data-i18n="anahtar" ekle.
   ============================================================ */

const I18N = {
  tr: {
    // genel
    brand: "Çin Kalite Kontrol",
    nav_home: "Ana Sayfa",
    nav_login: "Giriş Yap",
    nav_register: "Kayıt Ol",
    nav_dashboard: "Panelim",
    nav_logout: "Çıkış",

    // hero
    hero_title: "Çin Kalite Kontrol Platformu",
    hero_sub: "Türkiye'den Çin'e • Kolay • Güvenli • Profesyonel. Ürünlerinizi Çin'de kalite kontrolünden geçiren güvenilir firmalarla buluşun.",
    hero_cta_customer: "Hizmet Almak İstiyorum",
    hero_cta_firm: "Kalite Kontrol Firmasıyım",
    badge_form: "Kolay Talep Formu",
    badge_match: "Firma Eşleştirme",
    badge_track: "Süreç Takibi",
    badge_report: "Dijital Rapor",
    badge_secure: "Güvenli Yönetim",

    // flow
    flow_title: "Nasıl Çalışır?",
    flow_lead: "İki taraf, tek platform: Türkiye'deki hizmet alanlar ve Çin'deki kalite kontrol firmaları.",
    tr_side: "🇹🇷 Türkiye / Hizmet Alan",
    cn_side: "🇨🇳 Çin / Kalite Kontrol Firması",

    tr_s1_t: "Kayıt & Talep Oluştur",
    tr_s1_d: "Ürün, fabrika, kontrol türü, miktar ve şehir bilgilerini girin.",
    tr_s2_t: "Talebiniz Yayınlanır",
    tr_s2_d: "Talebiniz uygun kalite kontrol firmalarına iletilir.",
    tr_s3_t: "Teklif Alın & Onaylayın",
    tr_s3_d: "Firmalardan gelen fiyat ve tarih tekliflerini değerlendirip onaylayın.",
    tr_s4_t: "Raporu Teslim Alın",
    tr_s4_d: "Kontrol tamamlanır, rapor platform üzerinden size ulaşır.",

    cn_s1_t: "Firma Kaydı & Doğrulama",
    cn_s1_d: "Lisans, sertifika ve firma bilgilerinizi girin.",
    cn_s2_t: "Görevleri Görüntüle",
    cn_s2_d: "Yeni talepleri, detayları ve formları görüntüleyin.",
    cn_s3_t: "Teklif & Onay",
    cn_s3_d: "Görevi kabul edin, tarih/saat önerin, fiyatınızı belirleyin.",
    cn_s4_t: "Kontrolü Gerçekleştir & Rapor",
    cn_s4_d: "Fabrikaya gidin, checklist doldurun, raporu teslim edin.",

    bf_title: "Teslim, İletişim ve Takip",
    bf1_t: "Rapor Teslim", bf1_d: "Rapor Türkiye tarafına platform üzerinden ulaşır.",
    bf2_t: "İletişim", bf2_d: "Platform içi mesajlaşma ile taraflar iletişimde kalır.",
    bf3_t: "Takip & Bildirim", bf3_d: "Tüm süreç anlık olarak takip edilir.",
    bf4_t: "Sorumluluk", bf4_d: "Kontrol sonuçlarından platform sorumlu değildir.",

    // auth
    tab_login: "Giriş Yap",
    tab_register: "Kayıt Ol",
    role_customer: "Müşteri",
    role_customer_d: "Hizmet alan (Türkiye)",
    role_firm: "Firma",
    role_firm_d: "Kalite kontrol firması (Çin)",
    f_fullname: "Ad Soyad / Yetkili",
    f_email: "E-posta",
    f_password: "Şifre",
    f_phone: "Telefon",
    btn_register: "Kayıt Ol",
    btn_login: "Giriş Yap",
    have_account: "Zaten hesabın var mı?",
    no_account: "Hesabın yok mu?",
    register_success: "Kayıt başarılı! Giriş yapabilirsiniz. (E-posta doğrulaması açıksa e-postanızı kontrol edin.)",

    // dashboard - genel
    welcome: "Hoş geldiniz",
    panel_customer: "Müşteri Paneli",
    panel_firm: "Firma Paneli",

    // müşteri
    new_request: "Yeni Talep Oluştur",
    f_product: "Ürün Adı",
    f_factory: "Fabrika Adı",
    f_factory_city: "Fabrika Şehri (Çin)",
    f_control_type: "Kontrol Türü",
    f_quantity: "Miktar (adet)",
    f_notes: "Notlar / Detay",
    ctrl_pre: "Üretim Öncesi (PPI)",
    ctrl_during: "Üretim Sırası (DUPRO)",
    ctrl_final: "Final Kontrol (FRI)",
    ctrl_loading: "Yükleme Kontrolü (LI)",
    ctrl_factory_audit: "Fabrika Denetimi",
    btn_create_request: "Talebi Oluştur",
    request_created: "Talebiniz oluşturuldu.",
    companies_title: "Kayıtlı Kalite Kontrol Firmaları",
    my_requests: "Taleplerim",
    offers_received: "Gelen Teklifler",
    no_companies: "Henüz kayıtlı firma yok.",
    no_requests: "Henüz talep oluşturmadınız.",
    no_offers: "Bu talebe henüz teklif gelmedi.",
    accept: "Kabul Et",
    reject: "Reddet",
    offer_accepted: "Teklif kabul edildi.",
    view_report: "Raporu Görüntüle",
    report_title: "Rapor",
    experience: "Deneyim",
    years: "yıl",
    city: "Şehir",
    rating: "Puan",

    // firma
    company_profile: "Firma Profilim",
    f_company_name: "Firma Adı",
    f_license: "Lisans No",
    f_certificate: "Sertifika Bilgisi",
    f_experience: "Deneyim (yıl)",
    f_services: "Hizmetler (virgülle ayırın)",
    f_description: "Açıklama",
    btn_save_company: "Firmayı Kaydet",
    company_saved: "Firma bilgileri kaydedildi.",
    no_company_yet: "Henüz firma profili oluşturmadınız. Talep almak için profilinizi tamamlayın.",
    open_requests: "Açık Talepler (Görevler)",
    no_open_requests: "Şu anda açık talep yok.",
    make_offer: "Teklif Ver",
    f_price: "Fiyat",
    f_currency: "Para Birimi",
    f_proposed_date: "Önerilen Tarih",
    f_offer_msg: "Mesaj",
    btn_send_offer: "Teklifi Gönder",
    offer_sent: "Teklif gönderildi.",
    my_jobs: "İşlerim",
    upload_report: "Rapor Yükle",
    f_report_summary: "Rapor Özeti",
    f_report_checklist: "Checklist Sonuçları",
    f_report_file: "Rapor Dosyası (PDF/foto)",
    btn_submit_report: "Raporu Teslim Et",
    report_submitted: "Rapor teslim edildi.",
    accepted_offer: "Kabul edilen teklif",
    verified: "Doğrulanmış",
    not_verified: "Doğrulama bekliyor",

    quantity_short: "adet",
    status_label: "Durum",
    loading: "Yükleniyor...",
    config_warning: "⚠️ Supabase ayarları yapılmadı. js/config.js dosyasını doldurun (README'ye bakın). Şu an site demo modunda ve giriş/kayıt çalışmaz.",

    // mesajlaşma
    messages: "Mesajlar",
    msg_send: "Gönder",
    msg_placeholder: "Mesaj yazın...",
    msg_translate: "Çevir",
    msg_translating: "Çevriliyor...",
    msg_empty: "Henüz mesaj yok.",
    msg_with_firm: "Firma ile mesajlaş",
    msg_with_customer: "Müşteri ile mesajlaş",

    // AI form
    ai_generate: "🪄 Akıllı Form Oluştur",
    ai_generating: "Oluşturuluyor...",
    ai_done: "Form önerisi notlara eklendi.",

    // doğrulama (firma)
    ver_section: "Doğrulama",
    ver_status: "Durum",
    ver_status_none: "Doğrulanmamış",
    ver_status_pending: "İnceleniyor",
    ver_status_approved: "Onaylandı",
    ver_status_rejected: "Reddedildi",
    ver_doc: "Doğrulama belgesi (lisans/sertifika, PDF/foto)",
    ver_upload_btn: "Belge Yükle & Doğrulama İste",
    ver_uploaded: "Belge yüklendi, doğrulama bekleniyor.",
    ver_note: "Yönetici notu",
    ver_need_company: "Önce firma profilinizi kaydedin.",

    // admin
    nav_admin: "Yönetici",
    admin_title: "Yönetici — Firma Doğrulama",
    admin_pending: "Doğrulama Bekleyenler",
    admin_all: "Tüm Firmalar",
    admin_none: "Bekleyen doğrulama yok.",
    admin_view_doc: "Belgeyi Gör",
    admin_approve: "Onayla",
    admin_reject: "Reddet",
    admin_approved_msg: "Firma onaylandı.",
    admin_rejected_msg: "Firma reddedildi.",
    admin_reject_prompt: "Red nedeni (opsiyonel):",
    admin_unauthorized: "Bu sayfaya erişim yetkiniz yok.",
  },

  en: {
    brand: "China Quality Control",
    nav_home: "Home",
    nav_login: "Log In",
    nav_register: "Sign Up",
    nav_dashboard: "Dashboard",
    nav_logout: "Log Out",

    hero_title: "China Quality Control Platform",
    hero_sub: "From Türkiye to China • Easy • Secure • Professional. Connect with trusted firms that inspect your products in China.",
    hero_cta_customer: "I Need Inspection",
    hero_cta_firm: "I'm an Inspection Firm",
    badge_form: "Easy Request Form",
    badge_match: "Firm Matching",
    badge_track: "Process Tracking",
    badge_report: "Digital Report",
    badge_secure: "Secure Management",

    flow_title: "How It Works",
    flow_lead: "Two sides, one platform: customers in Türkiye and quality control firms in China.",
    tr_side: "🇹🇷 Türkiye / Customer",
    cn_side: "🇨🇳 China / Inspection Firm",

    tr_s1_t: "Register & Create Request",
    tr_s1_d: "Enter product, factory, inspection type, quantity and city.",
    tr_s2_t: "Your Request Is Published",
    tr_s2_d: "Your request is shared with suitable inspection firms.",
    tr_s3_t: "Receive & Approve Offers",
    tr_s3_d: "Review price and date offers from firms and approve.",
    tr_s4_t: "Receive the Report",
    tr_s4_d: "Inspection is completed; the report reaches you via the platform.",

    cn_s1_t: "Firm Registration & Verification",
    cn_s1_d: "Enter your license, certificate and company details.",
    cn_s2_t: "View Tasks",
    cn_s2_d: "View new requests, details and forms.",
    cn_s3_t: "Offer & Approval",
    cn_s3_d: "Accept the task, propose a date, set your price.",
    cn_s4_t: "Inspect & Report",
    cn_s4_d: "Visit the factory, fill the checklist, deliver the report.",

    bf_title: "Delivery, Communication and Tracking",
    bf1_t: "Report Delivery", bf1_d: "The report reaches the Türkiye side via the platform.",
    bf2_t: "Communication", bf2_d: "Parties stay in touch via in-platform messaging.",
    bf3_t: "Tracking & Alerts", bf3_d: "The whole process is tracked in real time.",
    bf4_t: "Liability", bf4_d: "The platform is not responsible for inspection results.",

    tab_login: "Log In",
    tab_register: "Sign Up",
    role_customer: "Customer",
    role_customer_d: "Service buyer (Türkiye)",
    role_firm: "Firm",
    role_firm_d: "Inspection firm (China)",
    f_fullname: "Full Name / Contact",
    f_email: "Email",
    f_password: "Password",
    f_phone: "Phone",
    btn_register: "Sign Up",
    btn_login: "Log In",
    have_account: "Already have an account?",
    no_account: "Don't have an account?",
    register_success: "Registration successful! You can log in now. (If email confirmation is on, check your inbox.)",

    welcome: "Welcome",
    panel_customer: "Customer Panel",
    panel_firm: "Firm Panel",

    new_request: "Create New Request",
    f_product: "Product Name",
    f_factory: "Factory Name",
    f_factory_city: "Factory City (China)",
    f_control_type: "Inspection Type",
    f_quantity: "Quantity (pcs)",
    f_notes: "Notes / Details",
    ctrl_pre: "Pre-Production (PPI)",
    ctrl_during: "During Production (DUPRO)",
    ctrl_final: "Final Random (FRI)",
    ctrl_loading: "Loading Inspection (LI)",
    ctrl_factory_audit: "Factory Audit",
    btn_create_request: "Create Request",
    request_created: "Your request has been created.",
    companies_title: "Registered Inspection Firms",
    my_requests: "My Requests",
    offers_received: "Offers Received",
    no_companies: "No registered firms yet.",
    no_requests: "You haven't created any requests yet.",
    no_offers: "No offers for this request yet.",
    accept: "Accept",
    reject: "Reject",
    offer_accepted: "Offer accepted.",
    view_report: "View Report",
    report_title: "Report",
    experience: "Experience",
    years: "yrs",
    city: "City",
    rating: "Rating",

    company_profile: "My Company Profile",
    f_company_name: "Company Name",
    f_license: "License No",
    f_certificate: "Certificate Info",
    f_experience: "Experience (years)",
    f_services: "Services (comma separated)",
    f_description: "Description",
    btn_save_company: "Save Company",
    company_saved: "Company details saved.",
    no_company_yet: "You haven't created a company profile yet. Complete it to receive requests.",
    open_requests: "Open Requests (Tasks)",
    no_open_requests: "No open requests at the moment.",
    make_offer: "Make Offer",
    f_price: "Price",
    f_currency: "Currency",
    f_proposed_date: "Proposed Date",
    f_offer_msg: "Message",
    btn_send_offer: "Send Offer",
    offer_sent: "Offer sent.",
    my_jobs: "My Jobs",
    upload_report: "Upload Report",
    f_report_summary: "Report Summary",
    f_report_checklist: "Checklist Results",
    f_report_file: "Report File (PDF/photo)",
    btn_submit_report: "Submit Report",
    report_submitted: "Report submitted.",
    accepted_offer: "Accepted offer",
    verified: "Verified",
    not_verified: "Pending verification",

    quantity_short: "pcs",
    status_label: "Status",
    loading: "Loading...",
    config_warning: "⚠️ Supabase is not configured. Fill js/config.js (see README). The site is in demo mode and auth won't work.",

    messages: "Messages",
    msg_send: "Send",
    msg_placeholder: "Type a message...",
    msg_translate: "Translate",
    msg_translating: "Translating...",
    msg_empty: "No messages yet.",
    msg_with_firm: "Message the firm",
    msg_with_customer: "Message the customer",

    ai_generate: "🪄 Generate Smart Form",
    ai_generating: "Generating...",
    ai_done: "Form suggestion added to notes.",

    ver_section: "Verification",
    ver_status: "Status",
    ver_status_none: "Not verified",
    ver_status_pending: "Under review",
    ver_status_approved: "Approved",
    ver_status_rejected: "Rejected",
    ver_doc: "Verification document (license/certificate, PDF/photo)",
    ver_upload_btn: "Upload Document & Request Verification",
    ver_uploaded: "Document uploaded, awaiting verification.",
    ver_note: "Admin note",
    ver_need_company: "Save your company profile first.",

    nav_admin: "Admin",
    admin_title: "Admin — Firm Verification",
    admin_pending: "Pending Verification",
    admin_all: "All Firms",
    admin_none: "No pending verifications.",
    admin_view_doc: "View Document",
    admin_approve: "Approve",
    admin_reject: "Reject",
    admin_approved_msg: "Firm approved.",
    admin_rejected_msg: "Firm rejected.",
    admin_reject_prompt: "Rejection reason (optional):",
    admin_unauthorized: "You are not authorized to view this page.",
  }
};

function getLang() {
  return localStorage.getItem("ckk_lang") || "tr";
}

function setLang(lang) {
  localStorage.setItem("ckk_lang", lang);
  applyI18n();
  // dil butonlarını güncelle
  document.querySelectorAll(".lang-switch button").forEach(b => {
    b.classList.toggle("active", b.dataset.lang === lang);
  });
  document.documentElement.lang = lang;
}

function t(key) {
  const lang = getLang();
  return (I18N[lang] && I18N[lang][key]) || (I18N.tr[key]) || key;
}

function applyI18n() {
  const lang = getLang();
  const dict = I18N[lang] || I18N.tr;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    const key = el.getAttribute("data-i18n-ph");
    if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
  });
}

// İlk yüklemede dil uygula
document.addEventListener("DOMContentLoaded", () => {
  const lang = getLang();
  document.documentElement.lang = lang;
  applyI18n();
  document.querySelectorAll(".lang-switch button").forEach(b => {
    b.classList.toggle("active", b.dataset.lang === lang);
    b.addEventListener("click", () => setLang(b.dataset.lang));
  });
});

window.i18n = { t, getLang, setLang, applyI18n };
