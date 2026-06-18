/* ============================================================
   ai.js — Çeviri (TR↔Çince) ve Akıllı Form üreteci
   ------------------------------------------------------------
   - translate(): varsayılan olarak ücretsiz, anahtarsız MyMemory
     API'sini kullanır. İstersen APP_CONFIG.AI_ENDPOINT ayarlarsan
     (Supabase Edge Function) onun üzerinden çalışır.
   - generateForm(): ürün + kontrol türüne göre profesyonel bir
     kalite kontrol checklist'i üretir. APP_CONFIG.AI_ENDPOINT
     varsa gerçek LLM'e (Claude) yönlendirilir.
   ============================================================ */

(function () {
  const endpoint = () => (window.APP_CONFIG && window.APP_CONFIG.AI_ENDPOINT) || null;

  async function callEndpoint(payload) {
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("AI endpoint hatası: " + res.status);
    return await res.json();
  }

  // ---------- Çeviri ----------
  async function translate(text, source, target) {
    if (!text || !text.trim()) return "";
    if (source === target) return text;

    // Opsiyonel kendi endpoint'in
    if (endpoint()) {
      try {
        const out = await callEndpoint({ action: "translate", text, source, target });
        if (out && out.translatedText) return out.translatedText;
      } catch (e) { /* fallback MyMemory */ }
    }

    // Ücretsiz, anahtarsız MyMemory
    const url = "https://api.mymemory.translated.net/get?q="
      + encodeURIComponent(text) + "&langpair=" + encodeURIComponent(source + "|" + target);
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    throw new Error("Çeviri alınamadı");
  }

  // ---------- Akıllı Form (checklist) üreteci ----------
  const CTRL_TITLES = {
    tr: { pre: "Üretim Öncesi (PPI)", during: "Üretim Sırası (DUPRO)", final: "Final Kontrol (FRI)", loading: "Yükleme Kontrolü (LI)", audit: "Fabrika Denetimi" },
    en: { pre: "Pre-Production (PPI)", during: "During Production (DUPRO)", final: "Final Random (FRI)", loading: "Loading Inspection (LI)", audit: "Factory Audit" },
  };

  const COMMON = {
    tr: [
      "Genel görünüm ve işçilik kontrolü",
      "Ölçü / ebat doğrulaması (örnek ölçüm)",
      "Renk ve malzeme uygunluğu (onaylı numune ile)",
      "Fonksiyon / kullanım testi",
      "Etiket, barkod ve marka bilgileri",
      "Ambalaj ve koli içi adet kontrolü",
      "Adet sayımı ve sipariş miktarına uygunluk",
    ],
    en: [
      "Overall appearance & workmanship",
      "Dimension / size verification (sample measurement)",
      "Color & material conformity (vs approved sample)",
      "Function / usage test",
      "Label, barcode and brand info",
      "Packaging and pcs-per-carton check",
      "Quantity count vs order",
    ],
  };

  const SPECIFIC = {
    pre: { tr: ["Hammadde ve bileşen uygunluğu", "İlk numune (golden sample) onayı", "Üretim planı ve kapasite teyidi"],
           en: ["Raw material & component conformity", "Golden sample approval", "Production plan & capacity check"] },
    during: { tr: ["Üretim hattı süreç kontrolü", "İlk parti çıktı kalitesi", "Hata oranı ve düzeltici aksiyon takibi"],
              en: ["Production line process control", "First batch output quality", "Defect rate & corrective action tracking"] },
    final: { tr: ["AQL örnekleme planı (II. seviye)", "Kritik / majör / minör kusur sınıflandırması", "Rastgele kutu açma kontrolü"],
             en: ["AQL sampling plan (Level II)", "Critical / major / minor defect classification", "Random carton opening check"] },
    loading: { tr: ["Konteyner temizlik ve uygunluk", "Yükleme adedi ve istifleme", "Yükleme fotoğraf/video kaydı"],
               en: ["Container cleanliness & suitability", "Loaded quantity & stacking", "Loading photo/video record"] },
    audit: { tr: ["Fabrika lisans ve sertifikaları", "Üretim kapasitesi ve makine parkı", "Kalite yönetim sistemi (ISO vb.)"],
             en: ["Factory licenses & certificates", "Production capacity & machinery", "Quality management system (ISO etc.)"] },
  };

  function localForm({ product, controlType, lang }) {
    const L = (lang === "en") ? "en" : "tr";
    const title = (CTRL_TITLES[L][controlType] || controlType || "");
    const head = (L === "en")
      ? `Quality Control Checklist — ${product || "Product"} (${title})`
      : `Kalite Kontrol Formu — ${product || "Ürün"} (${title})`;
    const items = COMMON[L].concat((SPECIFIC[controlType] && SPECIFIC[controlType][L]) || []);
    const lines = items.map((it, i) => `${i + 1}. [ ] ${it}`);
    const foot = (L === "en")
      ? "\nResult: [ ] PASS  [ ] FAIL  [ ] PENDING\nNotes:"
      : "\nSonuç: [ ] GEÇTİ  [ ] KALDI  [ ] BEKLEMEDE\nNotlar:";
    return head + "\n" + lines.join("\n") + "\n" + foot;
  }

  async function generateForm({ product, controlType, lang }) {
    if (endpoint()) {
      try {
        const out = await callEndpoint({ action: "generate_form", product, controlType, lang });
        if (out && out.text) return out.text;
      } catch (e) { /* fallback local */ }
    }
    return localForm({ product, controlType, lang });
  }

  window.AI = { translate, generateForm };
})();
