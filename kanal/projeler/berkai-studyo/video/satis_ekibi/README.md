# Satış ekibi videosu (13 Kasım 2026)

"Yapay zekâ satış ekibim müşteri buldu, 3D site yaptı, mail attı". Son BerkAİ videosunun (ofis v4) stili: açık krem kartlar, altyazı ve müzik yok, geçişlerde hafif ses, hızlandırma yok (~9,5 dk).

- `senaryo.md`: onaylanan metin (v4 dili + ofis sahneleri + sık sorulanlar).
- `anlatim.json`: bölüm bölüm seslendirilen metin (Claude → Klod, 3D → tri di, Netlify → Netlifay).
- `kartlar.py`: kartlar (şema, kurallar, terminal, mail kartı, Brevo akışı, 5 adım, SSS, hata, özet).
- `render.py`: bölüm bölüm kurgu ve birleştirme (`python3 render.py [n...]`, `python3 render.py son`).
- `cek3.js`: 3D ofis turunu 12,5 kare/sn kaydeder (ofis/index.html?tur=1).
- Görüntü kaynakları (depoya girmez): kullanıcının 3D vitrin kaydı, eski sitenin Playwright kaydı, ofis turu kareleri.
- Ses: HeyGen klon sesi (Berkay), 12 parça. Avatar (HeyGen "Photo Avatar", siyah polar + beyaz tişört) yalnızca giriş, "süslü demo" geçişi, müdür odası, hata ve kapanışta; ses kaydıyla dudak senkronu.
- Not: Markaya giden mail Gmail ekranı taklit edilmez; gerçek taslak kendi mail kartımızda gösterilir.
