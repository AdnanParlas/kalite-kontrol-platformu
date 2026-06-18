/* ============================================================
   localdb.js — Supabase olmadan çalışan DEMO (yerel) backend
   ------------------------------------------------------------
   Supabase JS istemcisinin kullandığımız kısmını taklit eder:
   auth (signUp/signIn/signOut/getSession/getUser), from(table)
   sorgu kurucu (select/insert/update/upsert/eq/in/neq/order/
   single/maybeSingle) ve storage (upload/getPublicUrl).

   Veriler tarayıcının localStorage'ında saklanır -> yalnızca
   bu tarayıcıda görünür. config.js'e Supabase anahtarları
   girilince bu mod otomatik devre dışı kalır.
   ============================================================ */

(function () {
  const DB_KEY = "ckk_db";
  const USERS_KEY = "ckk_users";
  const SESSION_KEY = "ckk_session";
  const TABLES = ["profiles", "companies", "requests", "offers", "reports", "messages"];

  const fileStore = {}; // path -> dataURL (oturum içi; ayrıca kayda dataURL yazılır)

  function uid() {
    return (crypto.randomUUID && crypto.randomUUID()) ||
      ("id-" + Date.now() + "-" + Math.random().toString(16).slice(2));
  }
  function loadDB() {
    let db;
    try { db = JSON.parse(localStorage.getItem(DB_KEY)) || {}; } catch { db = {}; }
    TABLES.forEach(t => { if (!Array.isArray(db[t])) db[t] = []; });
    return db;
  }
  function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
  function loadUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; } }
  function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
  function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } }
  function setSession(s) { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); }

  function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }

  // ---- Sorgu kurucu ----
  function Query(table) {
    this.table = table;
    this.op = "select";
    this.cols = "*";
    this.payload = null;
    this.upsertOpts = null;
    this.filters = [];   // {type:'eq'|'in'|'neq', col, val}
    this.orders = [];    // {col, asc}
    this._single = false;
    this._maybe = false;
  }
  Query.prototype.select = function (cols) { if (this.op === "select") { this.cols = cols || "*"; } else { this._returnSelect = true; this.cols = cols || "*"; } return this; };
  Query.prototype.insert = function (payload) { this.op = "insert"; this.payload = payload; return this; };
  Query.prototype.update = function (payload) { this.op = "update"; this.payload = payload; return this; };
  Query.prototype.upsert = function (payload, opts) { this.op = "upsert"; this.payload = payload; this.upsertOpts = opts || {}; return this; };
  Query.prototype.delete = function () { this.op = "delete"; return this; };
  Query.prototype.eq = function (col, val) { this.filters.push({ type: "eq", col, val }); return this; };
  Query.prototype.neq = function (col, val) { this.filters.push({ type: "neq", col, val }); return this; };
  Query.prototype.in = function (col, vals) { this.filters.push({ type: "in", col, vals }); return this; };
  Query.prototype.order = function (col, opts) { this.orders.push({ col, asc: !(opts && opts.ascending === false) }); return this; };
  Query.prototype.single = function () { this._single = true; return this; };
  Query.prototype.maybeSingle = function () { this._maybe = true; return this; };

  function matchRow(row, filters) {
    return filters.every(f => {
      if (f.type === "eq") return row[f.col] === f.val;
      if (f.type === "neq") return row[f.col] !== f.val;
      if (f.type === "in") return f.vals.includes(row[f.col]);
      return true;
    });
  }

  function attachRelations(table, cols, rows, db) {
    if (!cols || cols.indexOf("(") === -1) return rows;
    return rows.map(r => {
      const o = clone(r);
      if (cols.includes("companies(") && o.company_id != null) {
        o.companies = clone(db.companies.find(c => c.id === o.company_id)) || null;
      }
      if (cols.includes("requests(") && o.request_id != null) {
        o.requests = clone(db.requests.find(rq => rq.id === o.request_id)) || null;
      }
      if (cols.includes("profiles(") && o.id != null) {
        o.profiles = clone(db.profiles.find(p => p.id === o.id)) || null;
      }
      return o;
    });
  }

  Query.prototype._run = function () {
    const db = loadDB();
    const list = db[this.table] || (db[this.table] = []);
    let result = { data: null, error: null };

    try {
      if (this.op === "select") {
        let rows = list.filter(r => matchRow(r, this.filters));
        this.orders.forEach(o => {
          rows = rows.slice().sort((a, b) => {
            const av = a[o.col], bv = b[o.col];
            if (av === bv) return 0;
            const cmp = (av > bv ? 1 : -1);
            return o.asc ? cmp : -cmp;
          });
        });
        rows = attachRelations(this.table, this.cols, rows, db);
        if (this._single) {
          if (rows.length === 0) return { data: null, error: { message: "No rows" } };
          return { data: clone(rows[0]), error: null };
        }
        if (this._maybe) return { data: rows.length ? clone(rows[0]) : null, error: null };
        return { data: clone(rows), error: null };
      }

      if (this.op === "insert") {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        const inserted = items.map(it => {
          const row = Object.assign({ id: uid(), created_at: new Date().toISOString() }, it);
          if (row.id == null) row.id = uid();
          list.push(row);
          return row;
        });
        saveDB(db);
        if (this._single) return { data: clone(inserted[0]), error: null };
        if (this._returnSelect) return { data: clone(inserted), error: null };
        return { data: null, error: null };
      }

      if (this.op === "update") {
        const matched = list.filter(r => matchRow(r, this.filters));
        matched.forEach(r => Object.assign(r, this.payload));
        saveDB(db);
        if (this._single) return { data: matched.length ? clone(matched[0]) : null, error: matched.length ? null : { message: "No rows" } };
        if (this._returnSelect) return { data: clone(matched), error: null };
        return { data: null, error: null };
      }

      if (this.op === "upsert") {
        const key = (this.upsertOpts && this.upsertOpts.onConflict) || "id";
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        const out = items.map(it => {
          let existing = it[key] != null ? list.find(r => r[key] === it[key]) : null;
          if (existing) { Object.assign(existing, it); return existing; }
          const row = Object.assign({ id: uid(), created_at: new Date().toISOString() }, it);
          if (row.id == null) row.id = uid();
          list.push(row);
          return row;
        });
        saveDB(db);
        if (this._single) return { data: clone(out[0]), error: null };
        return { data: clone(out), error: null };
      }

      if (this.op === "delete") {
        db[this.table] = list.filter(r => !matchRow(r, this.filters));
        saveDB(db);
        return { data: null, error: null };
      }
    } catch (e) {
      return { data: null, error: { message: String(e && e.message || e) } };
    }
    return result;
  };
  // thenable -> await ile çalışır
  Query.prototype.then = function (resolve, reject) {
    return Promise.resolve(this._run()).then(resolve, reject);
  };

  // ---- Auth ----
  const auth = {
    async signUp(opts) {
      const users = loadUsers();
      const email = (opts.email || "").toLowerCase();
      if (users.find(u => u.email === email)) {
        return { data: { session: null, user: null }, error: { message: "Bu e-posta zaten kayıtlı." } };
      }
      const meta = (opts.options && opts.options.data) || {};
      const user = { id: uid(), email, password: opts.password, user_metadata: meta };
      users.push(user);
      saveUsers(users);

      // profil satırı (yerel modda admin: e-posta admin@ ile başlıyorsa)
      const db = loadDB();
      db.profiles.push({
        id: user.id,
        role: meta.role || "musteri",
        full_name: meta.full_name || "",
        phone: meta.phone || "",
        is_admin: email.startsWith("admin@"),
        created_at: new Date().toISOString(),
      });
      saveDB(db);

      const session = { user: pubUser(user) };
      setSession(session);
      return { data: { session, user: pubUser(user) }, error: null };
    },
    async signInWithPassword(opts) {
      const users = loadUsers();
      const email = (opts.email || "").toLowerCase();
      const user = users.find(u => u.email === email);
      if (!user || user.password !== opts.password) {
        return { data: { session: null, user: null }, error: { message: "E-posta veya şifre hatalı." } };
      }
      const session = { user: pubUser(user) };
      setSession(session);
      return { data: { session, user: pubUser(user) }, error: null };
    },
    async signOut() { setSession(null); return { error: null }; },
    async getSession() { return { data: { session: getSession() } }; },
    async getUser() { const s = getSession(); return { data: { user: s ? s.user : null } }; },
  };
  function pubUser(u) { return { id: u.id, email: u.email, user_metadata: u.user_metadata }; }

  // ---- Storage ----
  function storageFrom(bucket) {
    return {
      async upload(path, file) {
        try {
          const dataUrl = await new Promise((res, rej) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result);
            fr.onerror = rej;
            fr.readAsDataURL(file);
          });
          fileStore[bucket + "/" + path] = dataUrl;
          return { data: { path }, error: null };
        } catch (e) {
          return { data: null, error: { message: "Dosya okunamadı" } };
        }
      },
      getPublicUrl(path) {
        return { data: { publicUrl: fileStore[bucket + "/" + path] || ("local://" + bucket + "/" + path) } };
      },
    };
  }

  // Demo modunda örnek (sahte) firmalar — companies tablosu boşsa eklenir.
  function seedIfEmpty() {
    const db = loadDB();
    if (db.companies.length > 0) return;
    const now = new Date().toISOString();
    const seeds = [
      { name: "Shenzhen QC Inspection", city: "Shenzhen", latitude: 22.5431, longitude: 114.0579,
        experience_years: 8, rating: 4.9, services: "PPI, DUPRO, FRI, Yükleme Kontrolü",
        description: "Elektronik ve aksesuar ürünlerinde uzman, hızlı raporlama." },
      { name: "Ningbo Quality Service", city: "Ningbo", latitude: 29.8683, longitude: 121.5440,
        experience_years: 10, rating: 5.0, services: "FRI, Fabrika Denetimi, Yükleme Kontrolü",
        description: "Ev ürünleri ve mobilyada geniş tecrübe." },
      { name: "Yiwu Trade Inspection", city: "Yiwu", latitude: 29.3068, longitude: 120.0760,
        experience_years: 6, rating: 4.8, services: "FRI, DUPRO",
        description: "Yiwu pazarındaki küçük ürünlerde hızlı kontrol." },
      { name: "Guangzhou Control Group", city: "Guangzhou", latitude: 23.1291, longitude: 113.2644,
        experience_years: 12, rating: 4.7, services: "Fabrika Denetimi, PPI, FRI",
        description: "Tekstil ve ayakkabı denetiminde lider." },
      { name: "Shanghai Audit Co.", city: "Shanghai", latitude: 31.2304, longitude: 121.4737,
        experience_years: 9, rating: 4.6, services: "Fabrika Denetimi, DUPRO, Yükleme Kontrolü",
        description: "ISO uyumlu fabrika denetimleri." },
    ];
    seeds.forEach((s, i) => {
      db.companies.push(Object.assign({
        id: uid(),
        owner_id: "seed-" + (i + 1),
        verified: true,
        verification_status: "approved",
        verification_doc_url: null,
        verification_note: null,
        created_at: now,
      }, s));
    });
    saveDB(db);
  }

  window.getLocalClient = function () {
    seedIfEmpty();
    return {
      __local: true,
      auth,
      from(table) { return new Query(table); },
      storage: { from: storageFrom },
    };
  };
})();
