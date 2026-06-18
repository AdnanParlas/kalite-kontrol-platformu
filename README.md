# Çin Kalite Kontrol Platformu

Türkiye'deki müşterileri Çin'deki kalite kontrol firmalarıyla buluşturan, **sunucusuz** (statik HTML/CSS/JS + Supabase) bir web platformu. GitHub Pages ile yayınlanabilir.

- **Müşteri (Türkiye / Hizmet Alan):** kayıt olur, ürün/fabrika kontrol talebi oluşturur, kayıtlı firmaları görür, gelen teklifleri kabul eder, raporu alır.
- **Firma (Çin / Kalite Kontrol Firması):** kayıt + firma profili oluşturur, açık talepleri görür, teklif verir, kontrolü yapıp rapor teslim eder.

İki rol, giriş sonrası **farklı paneller** görür.

---

## 1) Supabase Kurulumu (ücretsiz)

1. [supabase.com](https://supabase.com) → **New project** oluşturun (parolayı not edin).
2. Proje açılınca sol menüden **SQL Editor → New query**.
3. Bu repodaki [`supabase/schema.sql`](supabase/schema.sql) dosyasının **tamamını** yapıştırıp **Run** edin. (Tablolar + RLS politikaları + trigger + mesajlaşma kurulur.)
   - Şemayı daha önce çalıştırdıysanız ve sadece **mesajlaşmayı** eklemek istiyorsanız [`supabase/messages.sql`](supabase/messages.sql) dosyasını çalıştırmanız yeterli.
4. **Storage → New bucket** → iki bucket oluşturun, ikisi de **Public**:
   - `reports` — rapor dosyaları
   - `verification` — firma doğrulama belgeleri
   Bucket'ları oluşturduktan sonra `schema.sql` içindeki storage politikaları zaten çalışır; çalışmadıysa SQL'in en alt bölümünü tekrar Run edin.
   - Şemayı daha önce çalıştırdıysanız ve sadece **doğrulama akışını** eklemek istiyorsanız [`supabase/verification.sql`](supabase/verification.sql) dosyasını çalıştırın.
5. **Project Settings → API** sayfasından şu ikisini kopyalayın:
   - **Project URL**
   - **anon public** key

### E-posta doğrulaması (opsiyonel ama önerilir test için kapalı)
- **Authentication → Providers → Email** altında, hızlı test için **"Confirm email"** seçeneğini **kapatabilirsiniz** (kayıt sonrası anında giriş). Canlıda açık bırakmanız önerilir.

---

## 2) Projeyi Yapılandırma

[`js/config.js`](js/config.js) dosyasını açın ve değerleri yapıştırın:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://xxxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi....",
};
```

> **Güvenlik:** `anon` anahtar istemcide görünür, bu normaldir. Verileri **RLS** korur. `service_role` anahtarını ASLA buraya koymayın.

---

## 3) Yerelde Çalıştırma

Statik bir sunucu yeterli (dosyayı çift tıklamak `file://` ile çalışmaz, Supabase için `http` gerekir):

```bash
# Python ile
python -m http.server 8000
# veya Node ile
npx serve .
```

Tarayıcıda `http://localhost:8000` açın.

### Test senaryosu
1. **Firma** olarak kayıt olun → panelde firma profilini doldurun.
2. Farklı bir tarayıcıda (veya gizli pencerede) **Müşteri** olarak kayıt olun → firma listesinde o firmayı görün.
3. Müşteri olarak talep oluşturun → Firma panelinde "Açık Talepler"de görün → teklif verin.
4. Müşteri teklifi **kabul etsin** → Firma "İşlerim"de raporu yüklesin → Müşteri raporu görsün.

---

## 4) GitHub Pages ile Yayınlama

1. Bu klasörü bir GitHub deposuna push edin.
2. Depo **Settings → Pages** → **Source: Deploy from a branch** → Branch: `main` / `(root)` → **Save**.
3. Birkaç dakika içinde `https://<kullanıcı-adı>.github.io/<repo>/` adresinde yayında olur.

> `config.js` doldurulmuş şekilde push edilir (anon key gizli değildir). İsterseniz Supabase'de **Authentication → URL Configuration**'a Pages adresinizi ekleyin.

---

## Dosya Yapısı

```
index.html          Tanıtım sayfası (akış + CTA)
auth.html           Kayıt / Giriş (rol seçimi)
dashboard.html      Role göre müşteri veya firma paneli
admin.html          Yönetici: firma doğrulama onay/red
assets/css/styles.css
js/config.js        Supabase URL + anon key (+ opsiyonel AI_ENDPOINT)
js/supabaseClient.js
js/i18n.js          TR/EN arayüz çevirisi
js/auth.js          kayıt/giriş/çıkış/oturum koruması
js/musteri.js       müşteri paneli
js/firma.js         firma paneli
js/messages.js      platform içi mesajlaşma
js/ai.js            çeviri (MyMemory) + akıllı form üreteci
js/admin.js         yönetici doğrulama ekranı
supabase/schema.sql Tablolar + RLS + trigger + mesajlaşma + doğrulama
supabase/messages.sql        (sadece mesajlaşmayı sonradan eklemek için)
supabase/verification.sql    (sadece doğrulama akışını sonradan eklemek için)
supabase/functions/ai/index.ts  (opsiyonel) Claude Edge Function
```

## Özellikler

- **Mesajlaşma:** Müşteri ve firma, bir talep üzerinden birbirine mesaj atabilir (teklif kartlarında ve "İşlerim"de 💬 butonu). Mesajları yalnızca o konuşmanın iki tarafı görür (RLS).
- **Çeviri (TR↔Çince):** Karşı tarafın mesajındaki 🌐 **Çevir** bağlantısı, mesajı sizin dilinize çevirir. Varsayılan olarak ücretsiz, **anahtar gerektirmeyen** [MyMemory](https://mymemory.translated.net) servisini kullanır (günlük limiti vardır).
- **Akıllı Form:** Talep oluştururken 🪄 **Akıllı Form Oluştur** butonu, ürün + kontrol türüne göre profesyonel bir kalite kontrol checklist'ini otomatik üretip notlara ekler. Varsayılan sürüm **kural tabanlıdır** (kurulum gerekmez).

### (Opsiyonel) Gerçek AI — Claude ile
Akıllı formu ve çeviriyi gerçek bir LLM (Claude) ile çalıştırmak isterseniz, anahtarın **gizli** kalması için sunucu tarafı bir Supabase Edge Function kullanılır:

1. [Supabase CLI](https://supabase.com/docs/guides/cli) kurun.
2. `supabase functions deploy ai --no-verify-jwt`
3. `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...` (anahtar yalnızca sunucuda durur).
4. `js/config.js` → `AI_ENDPOINT: "https://<proje>.supabase.co/functions/v1/ai"`.

Fonksiyon kodu: [`supabase/functions/ai/index.ts`](supabase/functions/ai/index.ts). `AI_ENDPOINT` boşsa sistem otomatik olarak ücretsiz çeviri + kural tabanlı forma düşer.

### Firma doğrulama akışı (admin onayı)
- **Firma:** Panelindeki "Doğrulama" bölümünden lisans/sertifika **belgesini yükler** → durum "İnceleniyor" olur.
- **Yönetici (admin):** [`admin.html`](admin.html) sayfasından bekleyen firmaları görür, belgeyi açar, **Onayla** veya **Reddet** der. Onaylanınca firma `verified=true` olur ve kullanıcılara "✓ Doğrulanmış" rozetiyle görünür.

**Bir kullanıcıyı yönetici yapmak için** (Supabase'de bir kez):
```sql
update public.profiles set is_admin = true where id =
  (select id from auth.users where email = 'sizin@eposta.com');
```
Bu kullanıcı giriş yapınca üst menüde "Yönetici" linki çıkar.

## Notlar / Sınırlar
- Doğrulama belgeleri `verification` bucket'ında tutulur. Belgeler hassassa bucket'ı **private** yapıp imzalı URL (`createSignedUrl`) kullanmanız önerilir.
- Platform kontrol sonuçlarından sorumlu değildir (taraflar arası anlaşma).
