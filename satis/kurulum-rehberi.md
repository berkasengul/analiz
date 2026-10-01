# 3D vitrini müşterinin alan adında yayına alma

Müşterinin alan adı müşteride kalır, ana sitesi (ikas vb.) olduğu gibi çalışır. 3D vitrin bizim barındırma
hesabımızda (Netlify) durur ve müşterinin alan adının bir alt adresinde açılır: `vitrin.markaadi.com.tr`.
Müşteri bize şifre vermez; kendi panelinde tek bir DNS kaydı ekler.

## Kavramlar

- **Alan adı (domain):** `cakirparfumeri.com.tr`. Müşterinin satın aldığı ve kendi panelinde yönettiği ad.
- **Barındırma (hosting):** Sitenin dosyalarının durduğu bilgisayar. Ana site ikas'ın sunucularında, 3D vitrin
  Netlify'da durur.
- **DNS:** Alan adının telefon rehberi. "Bu adı yazan kişiyi hangi sunucuya göndereyim?" sorusunun cevabı.
- **Alt alan adı (subdomain):** Ana adın önüne eklenen kısım: `vitrin.cakirparfumeri.com.tr`. Ana adreste
  (`cakirparfumeri.com.tr`) hiçbir şey değişmez.
- **CNAME kaydı:** "Bu alt adı şu adrese yönlendir" diyen DNS kaydı. Örnek:
  `vitrin.cakirparfumeri.com.tr` → `cakir-vitrin.netlify.app`.
- **SSL (https):** Adres çubuğundaki kilit. Netlify, kayıt çalışmaya başlayınca ücretsiz ve otomatik verir.

Benzetme: Alan adı bir apartmanın adresi, ikas apartmandaki mağaza. Biz aynı apartmanda "vitrin" adlı yeni bir
daire açıyoruz; müşteri kapıcıya (DNS) "vitrin dairesine gelenleri şu adrese yönlendir" diyor. Mağazaya
dokunulmuyor.

## 1. Netlify'da siteyi oluştur (bizim tarafımız, bir kez)

1. app.netlify.com'a kendi hesabınla gir.
2. **Add new site → Deploy manually**. `demolar/<marka>-Netlify.zip` dosyasının içindekileri sürükleyip bırak.
   (Zip'i olduğu gibi bırakmak da çalışır; açılmış klasörü bırakmak daha güvenli.)
3. **Site configuration → Change site name**: `cakir-vitrin` gibi bir ad ver. Site artık
   `https://cakir-vitrin.netlify.app` adresinde açılır. Telefonda ve bilgisayarda kontrol et.
4. **Domain management → Add a domain**: `vitrin.cakirparfumeri.com.tr` yaz, onayla. Netlify alan adının
   müşteride olduğunu görür ve "DNS kaydı bekleniyor" der; gösterdiği CNAME değerini not al (genelde
   `cakir-vitrin.netlify.app`).

Menü adları Netlify'ın arayüzü değiştikçe küçük farklılık gösterebilir.

## 2. Müşteri DNS kaydını ekler (müşterinin tarafı, bir kez, ~2 dakika)

Müşterinin alan adının DNS'ini nerede yönettiğini bulması gerekir: alan adını aldığı firma (Natro, Turhost,
GoDaddy…), Cloudflare ya da ikas'ın alan adı ayarları. Bilmiyorsa: alan adını aldığı firmanın paneli ya da
ikas'ın alan adı bölümü. (ikas'taki menünün tam adını doğrulamadım; ekran paylaşımıyla birlikte bakılır.)

Eklenecek kayıt:

| Alan | Değer |
|---|---|
| Tür (Type) | CNAME |
| Ad (Name / Host) | `vitrin` |
| Değer (Value / Target) | `cakir-vitrin.netlify.app` |
| TTL | varsayılan (Auto) |

Dikkat:
- Mevcut kayıtlara (A, `www`, MX/e-posta) **dokunulmaz**. Sadece yeni bir satır eklenir.
- Bazı paneller "Ad" alanına tam adı ister (`vitrin.cakirparfumeri.com.tr`), çoğu sadece `vitrin` ister.
- DNS Cloudflare'deyse kaydı ilk kurulumda "DNS only" (gri bulut) yap; turuncu bulut SSL'i geciktirebilir.

Müşteriye gönderilecek mesaj:

> Kurulum için sizden sadece bir şey gerekiyor: alan adınızı yönettiğiniz panelde şu kaydı eklemek:
> Tür: CNAME · Ad: vitrin · Değer: cakir-vitrin.netlify.app
> Mevcut kayıtlarınıza dokunmanız gerekmiyor, şifre paylaşmanıza da gerek yok. Nasıl ekleneceğini bilmezseniz
> ekran paylaşımıyla 5 dakikada birlikte yaparız.

## 3. Çalıştığını kontrol et

- Kayıt genelde birkaç dakikada, en geç 24–48 saatte her yere yayılır.
- Kontrol: dnschecker.org'a `vitrin.cakirparfumeri.com.tr` yaz, CNAME seç; sonuç `cakir-vitrin.netlify.app`
  göstermeli. Ya da bilgisayarda `nslookup vitrin.cakirparfumeri.com.tr`.
- Netlify **Domain management** sayfasında alan adının yanındaki uyarı kalkar; **HTTPS** bölümünde sertifika
  otomatik gelir (kayıt çalıştıktan sonra genelde bir saat içinde).
- `https://vitrin.cakirparfumeri.com.tr` aç; bir ürünü sepete ekle, ikas'taki ürün sayfasına geçtiğini gör.

## 4. Müşterinin sitesinden vitrine bağlantı

Müşteri ikas panelinden menüsüne ya da ana sayfasına bir bağlantı ekler: "3D Koleksiyon" →
`https://vitrin.cakirparfumeri.com.tr`. Instagram profilindeki link ve WhatsApp mesajlarında da bu adres kullanılır.

## 5. Güncelleme (bizim tarafımız, her seferinde)

1. Değişiklik (fiyat, metin, yeni koku) `demo-fabrikasi/markalar/<marka>.json` dosyasında yapılır,
   `yeni-demo.py` ile yeni zip üretilir.
2. Netlify'da sitenin **Deploys** sekmesine yeni klasör/zip sürükle bırak. Adres aynı kalır, müşterinin
   hiçbir şey yapması gerekmez.
3. İleride: fiyatları müşterinin sitesinden okuyup her gün otomatik derleyen ve Netlify'a yükleyen bir görev
   kurulabilir (Netlify erişim anahtarı gerekir).

## 6. Müşteri ayrılırsa (teslim)

Zip dosyası (sitenin tamamı) müşteriye verilir. Müşteri onu istediği barındırmaya (Netlify, Vercel, kendi
hosting'i) yükler ve CNAME kaydını yeni adrese çevirir. Bizim hesapta site silinir.

## Neden müşterinin kendi hosting'i değil?

Vitrin müşterinin hosting'ine konursa her güncelleme için onun FTP ya da panel şifresine ihtiyaç olur;
otomatik güncelleme de kurulamaz. Bizim hesapta durması hem müşteri için şifresiz, hem bizim için hızlı.

## Maliyet

Netlify'ın ücretsiz planı bu boyutta bir vitrin için genelde yeterli. Planların kapsamı değişebildiği için
müşteri sitesi koymadan önce Netlify'ın güncel plan sayfasına bak. Alan adı ücreti müşteride, bize ek maliyet yok.
