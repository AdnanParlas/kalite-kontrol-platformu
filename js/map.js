/* ============================================================
   map.js — Kayıtlı firmaların konumlarını Leaflet haritasında
   gösterir (ücretsiz OpenStreetMap, anahtar gerektirmez).
   Firma koordinatı: company.latitude/longitude varsa onu,
   yoksa şehir adından (CHINA_CITIES) bulur.
   ============================================================ */

(function () {
  // Yaygın Çin şehirleri -> [enlem, boylam]
  const CHINA_CITIES = {
    "shenzhen": [22.5431, 114.0579], "shenzen": [22.5431, 114.0579],
    "ningbo": [29.8683, 121.5440],
    "yiwu": [29.3068, 120.0760],
    "guangzhou": [23.1291, 113.2644], "kanton": [23.1291, 113.2644],
    "shanghai": [31.2304, 121.4737], "şanghay": [31.2304, 121.4737],
    "beijing": [39.9042, 116.4074], "pekin": [39.9042, 116.4074],
    "hangzhou": [30.2741, 120.1551],
    "dongguan": [23.0207, 113.7518],
    "foshan": [23.0218, 113.1219],
    "qingdao": [36.0671, 120.3826],
    "xiamen": [24.4798, 118.0894],
    "tianjin": [39.3434, 117.3616],
    "suzhou": [31.2989, 120.5853],
    "wuhan": [30.5928, 114.3055],
    "chengdu": [30.5728, 104.0668],
    "chongqing": [29.4316, 106.9123],
    "wenzhou": [27.9938, 120.6993],
    "fuzhou": [26.0745, 119.2965],
    "nanjing": [32.0603, 118.7969],
    "zhongshan": [22.5176, 113.3928],
    "quanzhou": [24.8741, 118.6757],
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function coordsFor(c) {
    if (c.latitude != null && c.longitude != null) return [Number(c.latitude), Number(c.longitude)];
    const key = (c.city || "").trim().toLowerCase();
    return CHINA_CITIES[key] || null;
  }

  async function loadCompanies() {
    const sb = window.getSupabase();
    if (!sb) return [];
    try {
      const { data, error } = await sb.from("companies").select("*");
      if (error) return [];
      return data || [];
    } catch (e) { return []; }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const el = document.getElementById("firmMap");
    if (!el || !window.L) return;
    const t = (k) => (window.i18n ? window.i18n.t(k) : k);

    const map = L.map(el).setView([30.5, 114.5], 4); // Çin geneli
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    const companies = await loadCompanies();
    const bounds = [];
    companies.forEach(c => {
      const co = coordsFor(c);
      if (!co) return;
      const services = (c.services || "").split(",").map(s => s.trim()).filter(Boolean);
      const popup =
        `<strong>${esc(c.name)}</strong><br>` +
        `📍 ${esc(c.city || "-")}<br>` +
        `★ ${esc(c.rating || 0)} · ${esc(c.experience_years || 0)} ${esc(t("years"))}` +
        (c.verified ? `<br>✓ ${esc(t("verified"))}` : "") +
        (services.length ? `<br><small>${esc(services.join(", "))}</small>` : "");
      L.marker(co).addTo(map).bindPopup(popup);
      bounds.push(co);
    });

    const emptyEl = document.getElementById("map-empty");
    if (bounds.length) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
      if (emptyEl) emptyEl.classList.add("hidden");
    } else if (emptyEl) {
      emptyEl.classList.remove("hidden");
    }
    setTimeout(() => map.invalidateSize(), 200);
  });
})();
