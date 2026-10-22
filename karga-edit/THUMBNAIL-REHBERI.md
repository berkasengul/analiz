# Karga Zihni: "Net" thumbnail stili

> **Kanalın varsayılan thumbnail stili.** Referans: Efe Cpp kanalının video ızgarası. Şablon: `thumbnail_net.py`.

## Formül
1. **Beyaz zemin.** Kenarlara doğru çok hafif griye döner. Karanlık sahne, doku ya da ışık efekti yok.
2. **2–3 kelime.** Yazı başlığı tekrar etmez, onu tamamlayan duyguyu verir
   (Efe: başlık "Oyun Hileleri Nasıl Yapılıyor?", thumbnail "OYUNU KANDIRIYOR!").
3. **İki satır:**
   - 1. satır: **siyah**, dev, sıkışık kalın yazı (Anton).
   - 2. satır: **turuncu kutu** `#FF6B12` içinde **beyaz** yazı, ince siyah kontur, kutu −2° eğik.
4. **Tek nesne, sağda:** laptop ya da tarayıcı içinde sitenin en çarpıcı karesi (kırmızı araç, cephe). Hafif perspektif ve yumuşak gölge.
5. **Karga = Efe'nin yüzü:** Beyaz kenarlıklı çıkartma gibi, gölgeli. Yazının üstüne binmez. Duyguya göre poz seçilir
   (işaret eden, sevinen, şaşıran).
6. **İsteğe bağlı tek işaret:** Turuncu kalın ok ya da büyük imleç. En fazla bir tane.
7. **Her thumbnail'de aynı renk:** Yalnızca turuncu vurgu. Kanal ızgarasında hepsi bir seri gibi görünür.

## Kontrol
- 360×202 önizlemede (`NET_onizleme_kucuk.jpg`) yazı tek bakışta okunuyor mu?
- Yazı alanı solun en fazla %45'i, nesne sağın %55'i.
- Toplam en fazla 3 öğe: yazı, nesne, karga.

## Çalıştırma
```
python3 -I thumbnail_net.py <varlik_klasoru> <cikti_klasoru>
```
Yeni video için `variant_*` fonksiyonlarında yazıyı, ekran görüntüsünü ve karga pozunu değiştirin.
