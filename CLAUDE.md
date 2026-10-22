# Karga Zihni: çalışma kuralları

## Video kurgusu: varsayılan stil "Akış"
Karga Zihni videolarının hepsi **Akış stili** ile kurgulanır. Kurallar `karga-edit/STIL-AKIS.md`, motor `karga-edit/render_akis.py`.
Eski sinematik/koyu stil (`karga-edit/STIL-REHBERI.md`, `edit_showroom.py`) yalnızca arşivdir; kanal sahibi açıkça istemedikçe kullanılmaz.

Özet:
- Açık krem zemin `#F6F4EF`, turuncu `#FF741E` vurgu, lacivert `#1A1F36` üst düğümler.
- Inter Tight ExtraBold + Instrument Serif Italic. Anahtar kelime italik turuncu.
- Yazılar kelime kelime, anlatımın kelime zamanlarına (`transcribe.py`) senkron, blur-in ile gelir.
- Kesme yok: tek tuval, kamera kayar. Bölüm arası kısa kararma.
- Ekran kaydı tarayıcı veya laptop çerçevesinin içinde durur.
- Sonda abone ol hapı ve "kuşlar seni bekliyor, *uç.*"

## Ses kuralları (kanal sahibinin isteği)
- **Whoosh, darbe/boom, riser ve gürültü tabanlı geçiş efektleri kullanılmaz.** Patlama gibi duyuluyor.
- Yalnızca kısık ve kısa efektler: pop, tık, kısa zil, tuş sesi.
- En yüksek ses her zaman anlatım olur. Müzik konuşmanın altında kısılır.
- Her teslimde iki sürüm verilir: hafif müzikli ve müziksiz.

## Thumbnail: varsayılan stil "Net"
Bütün thumbnail'ler `karga-edit/THUMBNAIL-REHBERI.md` kurallarıyla, `karga-edit/thumbnail_net.py` şablonundan üretilir:
beyaz zemin, 2–3 kelime (siyah satır + turuncu kutuda beyaz satır, Anton), sağda tek temiz nesne, çıkartma gibi karga.
Koyu, kalabalık, çok yazılı thumbnail yapılmaz. Her yeni video için 3 A/B varyantı ve başlık eşleşmesi verilir.
