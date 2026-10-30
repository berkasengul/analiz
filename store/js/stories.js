// Her pijamanın uyku masalı. Ürün sayfasında, SESA Asistan'da ve paketteki karekodlu kartta
// (masal/<spin>/ sayfası) kullanılır. Her masal "uyku vakti" ile biter: pijama giymek bir ritüele dönüşür.
// hero: masalın kahramanı · title: masal adı · text: paragraflar · ask: uyumadan önce çocuğa sorulacak soru
export const STORIES = {
  'KK-01': {
    hero: 'Pamuk', emoji: '🐱', title: 'Pamuk ve Kalp Cebi',
    text: [
      'Pamuk, kasabanın en yumuşak tüylü kedisiydi. Göğsünde küçük bir kalp cebi vardı ve gün boyu o cebe sevgi biriktirirdi: bir kelebeğe gülümseyince bir kalp, düşen bir yaprağı yerine koyunca bir kalp daha.',
      'Akşam olunca Pamuk çatılara tırmanır, cebindeki kalpleri tek tek gökyüzüne üflerdi. Kalpler uçar uçar, uyumakta olan çocukların yastıklarına konardı. Sonra Pamuk da kıvrılır, mırıl mırıl uykuya dalardı. Çünkü kalpler, ancak herkes uyuyunca tatlı rüyalara dönüşürdü.',
    ],
    ask: 'Bugün kalp cebine hangi güzel şeyi koydun?',
  },
  'RK-07': {
    hero: 'Tarçın', emoji: '🌈', title: 'Rengârenk Kedi Çetesi',
    text: [
      'Turuncu Tarçın, mahallenin en meraklı kedi çetesinin başıydı. Çetede her renkten bir kedi vardı: mavi Bulut, yeşil Fesleğen, mor Erik, sarı Limon. Gün boyu bahçe bahçe dolaşır, kayıp topları bulur, kuşlara selam verirlerdi.',
      'Ay doğunca Tarçın bir ıslık çalardı. Kediler kuyruk kuyruğa verip yan yana dizilir, gökyüzüne kocaman bir gökkuşağı köprüsü kurarlardı. O köprüden geçen her çocuk rengârenk bir rüyaya varırdı. Köprünün kapısı tek bir sözle açılırdı: “İyi geceler, çete!”',
    ],
    ask: 'Senin çetende hangi renk sen olurdun?',
  },
  'DM-08': {
    hero: 'Kepçe Kaptan Kemal', emoji: '🚜', title: 'Rüya Yolunu Yapan Kepçe',
    text: [
      'Kepçe Kaptan Kemal, şantiyenin en çalışkan iş makinesiydi. Sabahları kamyon Kamil ile kum taşır, silindir Selim ile yolları dümdüz ederdi. Dama desenli şantiye bayrağı rüzgârda dalgalandıkça herkes bilirdi: Kemal iş başında!',
      'Ama Kemal’in en önemli işi gece başlardı. Herkes yatağına girdiğinde kepçesini usulca kaldırır, yıldızların arasına yumuşacık bir rüya yolu döşerdi. Yol bitince farlarını söndürür, “Yol hazır, uyku vakti!” derdi. Çocuklar da o yoldan rüyalarına doğru yola çıkardı.',
    ],
    ask: 'Bu gece rüya yolun seni nereye götürsün?',
  },
  'AE-09': {
    hero: 'Ayı Bulut', emoji: '🧸', title: 'Ayı Bulut’un Ekose Yorganı',
    text: [
      'Minik Ayı Bulut, ormanın en usta terzisiydi. Her gün bir kare kumaş dikerdi: sabah güneşinden beyaz bir kare, akşam gölgesinden siyah bir kare. Kenarlarına da sevdiği kırmızı ipliği geçirirdi.',
      'Kareler birleştikçe kocaman, sıcacık bir ekose yorgan oldu. Bulut, yorganını kış uykusuna yatan bütün dostlarıyla paylaştı. Tavşan, sincap, kirpi ve kendisi aynı yorganın altında öyle güzel uyudular ki, orman o gece hiç üşümedi.',
    ],
    ask: 'Yorganını bu gece kiminle paylaşmak isterdin?',
  },
  'RC-10': {
    hero: 'Tomurcuk', emoji: '🍓', title: 'Çilek Bahçesinin Sırrı',
    text: [
      'Tomurcuk, çilek bahçesinin en küçük çileğiydi. Ablaları gün boyu güneşten renk toplardı: biri pembe, biri sarı, biri mor. Tomurcuk ise hep merak ederdi: “Bu renkler nereye gidiyor?”',
      'Bir akşam ablalarının peşine takıldı ve sırrı öğrendi. Çilekler renklerini usulca yastıklara bırakıyordu! O gece Tomurcuk da ilk rengini bir çocuğun yastığına koydu. O çocuk, hayatının en rengârenk rüyasını gördü. Tomurcuk da gülümseyip yaprağının altında uykuya daldı.',
    ],
    ask: 'Bu gece rüyan hangi renkte olsun?',
  },
  'PA-11': {
    hero: 'Komiser Bıdık', emoji: '🚓', title: 'Komiser Bıdık’ın Son Devriyesi',
    text: [
      'Şehrin en küçük polis arabası Komiser Bıdık, her akşam son devriyesine çıkardı. Parkta unutulan oyuncak ayıyı sahibine götürür, yolunu kaybeden ateş böceğini evine bırakırdı.',
      'Tam o sırada telsizden bir anons gelirdi: “Tüm birimlerin dikkatine, uyku vakti!” Bıdık sirenini kapatır, farlarını kısar ve garajına süzülürdü. Şehir de onunla birlikte, güvende ve mışıl mışıl uykuya dalardı.',
    ],
    ask: 'Bugün kime yardım ettin, minik komiser?',
  },
  'BE-12': {
    hero: 'Fındık', emoji: '🍯', title: 'Fındık’ın Yıldız Pikniği',
    text: [
      'Bal rengi tüyleriyle Fındık, ormanın en tatlı ayısıydı. Her akşamüstü bej ekose örtüsünü çimenlere serer, arkadaşlarını pikniğe çağırırdı: bal kurabiyesi, ılık süt ve bol bol kahkaha.',
      'Güneş batınca piknik bitmezdi, yalnızca değişirdi. Fındık ve dostları örtünün üstüne sırt üstü uzanır, gökyüzündeki yıldızları sayarlardı. Bir, iki, üç… Kimse on’a kadar sayamazdı, çünkü herkes yıldızların altında çoktan uyumuş olurdu.',
    ],
    ask: 'Gözlerini kapatıp benimle yıldız sayar mısın?',
  },
  'SD-13': {
    hero: 'Zürafa Zeren', emoji: '🦒', title: 'Ay’a İyi Geceler Diyen Zürafa',
    text: [
      'Safarinin en uzun boylusu Zürafa Zeren’di. En yakın arkadaşı Fil Fıstık ise en kısa boylulardandı. İkisi her gün palmiyelerin altında saklambaç oynardı. Zeren hep kazanırdı, çünkü yukarıdan her yeri görürdü.',
      'Ama Zeren’in en sevdiği şey, akşam boynunu uzatıp Ay’a iyi geceler demekti. Bir gece Fıstık “Ben de demek istiyorum!” dedi. Zeren eğildi, Fıstık’ı sırtına aldı. Birlikte uzandılar ve Ay’a aynı anda fısıldadılar: “İyi geceler.” Ay da gülümsedi ve bütün safariye uyku serpti.',
    ],
    ask: 'Ay’a fısıldamak istediğin bir şey var mı?',
  },
  'GZ-14': {
    hero: 'Kaşif Kuzey', emoji: '🪐', title: 'Uzay Kaşifi Kuzey',
    text: [
      'Kuzey’in pijamasındaki yıldızlar, ışıklar kapanınca parlamaya başlardı. Çünkü Kuzey her gece uzaya giden bir kaşifti. Yastığı roketiydi, yorganı da uzay giysisi.',
      'Bir gece Satürn’ün halkasında kaydı, bir gece Mars’ın kırmızı tozunda ayak izi bıraktı, bir gece de Ay’da zıp zıp zıpladı. Ama her yolculuğun sonunda roketini hep aynı yere indirirdi: Dünya’daki sıcacık yatağına. Çünkü bütün evrenin en güzel yeri orasıydı.',
    ],
    ask: 'Bu gece hangi gezegene uçmak istersin?',
  },
  'KE-15': {
    hero: 'Kamp Kaptanı Kerem', emoji: '🏕️', title: 'Kamp Ateşinin Ninnisi',
    text: [
      'Kerem, ormanın kenarındaki küçük kampın kaptanıydı. Kırmızı ekose gömleğini giyer, arkadaşlarıyla çadır kurar, dere kenarında taş sektirirdi. Baykuş Bilge de her akşam ağacın dalından onları izlerdi.',
      'Hava kararınca kamp ateşi yanardı. Çıtır çıtır sesler bir ninniye dönüşür, kıvılcımlar yıldızlara karışırdı. Bilge Baykuş “Hu-hu, uyku vakti” deyince Kerem son bir kez gökyüzüne bakar, çadırına girer ve sıcacık tulumunda mışıl mışıl uyurdu.',
    ],
    ask: 'Kamp ateşinin başında hangi şarkıyı söylerdin?',
  },
  'MC-16': {
    hero: 'Kaptan Deniz', emoji: '⛵', title: 'Kaptan Deniz ve Dalga Beşiği',
    text: [
      'Kaptan Deniz’in mavi-beyaz çizgili küçük bir teknesi vardı. Martı Maviş ile birlikte her gün koy koy dolaşır, balıklara günaydın, deniz kabuklarına merhaba derlerdi.',
      'Akşam güneşi denizi turuncuya boyayınca Deniz demir atardı. Dalgalar tekneyi bir beşik gibi usul usul sallar, Maviş de direğin tepesinde başını kanadının altına sokardı. Deniz yıldızlarla yönünü bulur, dalgaların ninnisiyle gözlerini kapatırdı. “Sabah yeni maceralar bizi bekliyor” diye fısıldardı.',
    ],
    ask: 'Yarın teknenle nereye gitmek istersin?',
  },
  'KC-17': {
    hero: 'Tavşan Lale', emoji: '🐰', title: 'Çilek Reçeli Ninnisi',
    text: [
      'Tavşan Lale’nin büyükannesi, ormanın en güzel çilek reçelini yapardı. Lale her sabah sepetini alır, krem rengi tarlalardan en kırmızı, en sarı, en pembe çilekleri toplardı.',
      'Akşam olunca büyükanne reçeli kaynatır, mutfağa tatlı bir koku yayılırdı. Lale tezgâhın başında beklerken büyükanne bir ninni mırıldanırdı: “Çilek kırmızı, gece mavi, uyusun benim minik tavşanım…” Lale reçeli ancak sabah tadabildi, çünkü ninni bitmeden çoktan uyumuştu.',
    ],
    ask: 'Sabah kahvaltıda ne yemek istersin?',
  },
};

// Kısa masal sayfası adresi (karekod buraya gider): masal/<spin>/
export const storyPath = (p) => `masal/${p.spin}/`;
