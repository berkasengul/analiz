// ---- Turkish Coffee Lady · film + story sections (injected before the app root) ----
const TclFilmSrc = "./film/bir-fincan-cesaret.mp4",
  TclImg = (n) => `./film/img/${n}.webp`,
  TclFmt = (s) => {
    const m = Math.floor(s / 60),
      r = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  },
  TclChapters = [
    { t: 0, img: "poster", tr: "Prolog", en: "Prologue" },
    { t: 94, img: "cezve", tr: "Bütün kahvelerin anası", en: "The mother of all coffees" },
    { t: 186, img: "child", tr: "Ankara'dan Boston'a", en: "From Ankara to Boston" },
    { t: 420, img: "limo", tr: "Sosisten havyara", en: "From hot dogs to caviar" },
    { t: 612, img: "boston", tr: "“Türkiye, Amerika'nın neresinde?”", en: "“Where in America is Turkey?”" },
    { t: 787, img: "capitol", tr: "Kongre'nin tepesinde bir yüzük", en: "A ring atop the Capitol" },
    { t: 888, img: "embassy", tr: "Büyükelçilikte ilk fincan", en: "The first cup at the embassy" },
    { t: 975, img: "sketch", tr: "A4 kâğıda çizilen kamyon", en: "A truck drawn on A4 paper" },
    { t: 1152, img: "nato", tr: "Bir isim: Turkish Coffee Lady", en: "A name: Turkish Coffee Lady" },
    { t: 1250, img: "baby", tr: "Kızıma bir miras", en: "A legacy for my daughter" },
    { t: 1415, img: "tysons", tr: "Omuz omuza", en: "Shoulder to shoulder" },
    { t: 1490, img: "eclipse", tr: "Bir telefon", en: "One phone call" },
    { t: 1814, img: "healed", tr: "Şükür demeyi öğrendim", en: "Learning gratitude" },
    { t: 1925, img: "house", tr: "Bir kültür evi", en: "A house of culture" },
    { t: 2000, img: "gold", tr: "Miras", en: "Legacy" },
  ],
  TclCopy = {
    tr: {
      filmEyebrow: "Belgesel · 36 dakika",
      filmTitle: "Bir Fincan Cesaret",
      filmQuote: "“Amerika'da kimse Türk kahvesi içmez.”",
      filmLead:
        "Ona ilk söylenen buydu. Gizem Şalcıgil White, namıdiğer Turkish Coffee Lady, sonraki on beş yılını bu cümleyi yanlış çıkarmaya adadı: bir cezve, A4 kâğıda çizilmiş bir kamyon ve hiç bitmeyen bir inatla.",
      watch: "Filmi izle",
      resume: "Devam et",
      chapters: "Bölümler",
      chapter: "Bölüm",
      inFilm: "Filmde izle",
      lang: "Türkçe · orijinal ses",
      journeyEyebrow: "Hikâye",
      journeyTitle: "Bir cezveden bir kutuya",
      journeyLead:
        "Türk kahvesi dünyanın ilk kahve pişirme yöntemi. Bugün Amerika'da içilen her fincanın kökü bir cezveye uzanıyor; ama bu hikâye çoğu zaman tek bir cümleye sığdırıldı. Bold Istanbul'un hikâyesi, o cümleyi büyütmeye karar veren bir kadının hikâyesi.",
      productEyebrow: "Ürünün hikâyesi",
      productTitle: "Bold Istanbul",
      productSub: "Bir fincan cesaret, kutuda.",
      productText: [
        "2012'de Washington sokaklarında bir kamyondan bedavaya dağıtılan fincanlar, bugün İstanbul'un adını taşıyan bir kutuda. Bold Istanbul, Turkish Coffee Lady'nin buzlu Türk kahvesi serisinin ilk kutusu ve ABD lansmanının öncüsü.",
        "İçinde, Türkiye'de üretilen, orta kavrulmuş ve ince öğütülmüş Arabica'dan koyu ve yoğun bir harman var: %100 doğal, sıfır şeker, düşük kalori. Kutunun üzerinde ise hasankale imzalı bir İstanbul: Kız Kulesi, Galata Kulesi, Boğaz'da bir vapur ve uğur getiren nazar.",
        "Toronto'da bir AVM'de, bedava Türk kahvesinin önünden geçip parayla espresso sırasına giren insanları izlerken öğrenilen ders burada: Türk kahvesinin hak ettiği yere varması için bir marka olması gerekiyordu. Bold Istanbul o markanın elde taşınabilen hali.",
      ],
      productFacts: [
        ["250 ml", "8.5 fl oz"],
        ["0 g", "şeker"],
        ["%100", "doğal"],
        ["5 Aralık", "Dünya Türk Kahvesi Günü"],
      ],
      productQuote: "“Türk kahvesini diğer kahvelerle karşılaştırmayacağız. Türk kahvesi her şeyin başlangıç noktası.”",
      join: "Lansman listesine katıl",
      shake: "Shake well. Drink cold.",
    },
    en: {
      filmEyebrow: "Documentary · 36 minutes",
      filmTitle: "A Cup of Courage",
      filmQuote: "“Nobody in America drinks Turkish coffee.”",
      filmLead:
        "That was the first thing she was told. Gizem Şalcıgil White, better known as the Turkish Coffee Lady, spent the next fifteen years proving that sentence wrong: with a cezve, a truck drawn on a sheet of A4 paper, and stubbornness that never ran out.",
      watch: "Watch the film",
      resume: "Resume",
      chapters: "Chapters",
      chapter: "Chapter",
      inFilm: "Watch in the film",
      lang: "In Turkish · original audio",
      journeyEyebrow: "Story",
      journeyTitle: "From a cezve to a can",
      journeyLead:
        "Turkish coffee is the world's first way of brewing coffee. Every cup poured in America today traces back to a cezve, yet that history is usually squeezed into a single sentence. The story of Bold Istanbul is the story of a woman who decided to make that sentence bigger.",
      productEyebrow: "The story of the can",
      productTitle: "Bold Istanbul",
      productSub: "A cup of courage, canned.",
      productText: [
        "In 2012 the cups were handed out for free from a truck on the streets of Washington. Today they come in a can that carries Istanbul's name. Bold Istanbul is the first can of Turkish Coffee Lady's iced Turkish coffee line, and it leads the US launch.",
        "Inside is a dark, rich blend of medium-roasted, finely ground Arabica, produced in Türkiye: 100% natural, zero sugar, low calorie. On the outside, an Istanbul signed by hasankale: the Maiden's Tower, Galata Tower, a ferry on the Bosphorus and the evil eye for good fortune.",
        "In a Toronto mall she watched people walk past free Turkish coffee to pay for espresso, and learned the lesson this can is built on: for Turkish coffee to reach the place it deserves, it had to become a brand. Bold Istanbul is that brand, made to carry in your hand.",
      ],
      productFacts: [
        ["8.5 fl oz", "250 ml"],
        ["0 g", "sugar"],
        ["100%", "natural"],
        ["Dec 5", "World Turkish Coffee Day"],
      ],
      productQuote: "“We won't compare Turkish coffee to other coffees. Turkish coffee is where everything began.”",
      join: "Join the launch list",
      shake: "Shake well. Drink cold.",
    },
  },
  TclActs = [
    {
      img: "boston",
      t: 612,
      tr: {
        kicker: "Boston",
        title: "“Türkiye, Amerika'nın neresinde?”",
        text: "Emerson College'daki ilk haftasında bir Amerikalı ona nereli olduğunu sordu. “Türkiye” cevabını duyunca bir süre düşündü, sonra sordu: “Massachusetts eyaletinin neresindeydi?” Bir ülke markalaşması projesiyle birleşince o an bir pusulaya dönüştü.",
        quote: "Ve aslında benim hayatım o gün değişti.",
      },
      en: {
        kicker: "Boston",
        title: "“Where in America is Turkey?”",
        text: "In her first week at Emerson College an American asked where she was from. Hearing “Turkey”, he thought for a moment, then asked: “Which part of Massachusetts was that again?” Paired with a nation-branding project, that moment became a compass.",
        quote: "And that was the day my life changed.",
      },
    },
    {
      img: "embassy",
      t: 888,
      tr: {
        kicker: "Washington DC",
        title: "Büyükelçilikte ilk fincan",
        text: "Washington Türk Büyükelçiliği'nin basın müşavirliğinde çalışırken büyükelçiye bir fikir sundu: Türk kahvesi etkinlikleri. Radyolar, gazeteciler, tıklım tıklım bir salon… İlgi beklenenin çok ötesindeydi; ama etkinlik bitince her şey de bitiyordu.",
        quote: "Arayanlara yetişemiyoruz.",
      },
      en: {
        kicker: "Washington DC",
        title: "The first cup at the embassy",
        text: "While working in the press office of the Turkish Embassy in Washington, she pitched an idea to the ambassador: Turkish coffee events. Radio stations, reporters, a packed hall… The interest was far beyond expectations, but when the event ended, so did everything else.",
        quote: "We couldn't keep up with the calls.",
      },
    },
    {
      img: "truck",
      img2: "sketch",
      t: 975,
      tr: {
        kicker: "2012 · Washington'dan Harvard'a",
        title: "A4 kâğıda çizilen kamyon",
        text: "Bir öğle arasında bir kamyon çizdi. Kurukahveci Mehmet Efendi sponsor oldu, dernekler ve bağışçılarla bütçe tamamlandı; Mayıs 2012'de o çizim New Jersey'den gelip karşısında durdu. George Washington Üniversitesi, Baltimore, Times Square, Yale, Harvard… Proje ABD Kongresi kayıtlarına geçti.",
        quote: "Sokak sokak dolaşacağım, karış karış Amerika'yı gezeceğim ve binlerce kişiye Türk kahvesi dağıtacağım.",
      },
      en: {
        kicker: "2012 · From Washington to Harvard",
        title: "A truck drawn on A4 paper",
        text: "On a lunch break she drew a truck. Kurukahveci Mehmet Efendi came on as sponsor, associations and donors completed the budget, and in May 2012 the drawing arrived from New Jersey and parked in front of her. George Washington University, Baltimore, Times Square, Yale, Harvard… The project was entered into the US Congressional Record.",
        quote: "I'll go street by street, cross America inch by inch, and pour Turkish coffee for thousands of people.",
      },
    },
    {
      img: "nato",
      t: 1152,
      tr: {
        kicker: "2013 · Avrupa ve Kanada",
        title: "Bir isim: Turkish Coffee Lady",
        text: "Sosyal medyada yayılan tur, Avrupa'dan ve Kanada'dan davetler getirdi; kamyon Amsterdam'a, NATO Genel Merkezi'ne kadar gitti. BBC'de ve Washington Post'ta haber oldu. Bugün bir markanın adı olan unvan da o günlerden kaldı.",
        quote: "Turkish Coffee Lady ismini aslında bana Washington Post verdi.",
      },
      en: {
        kicker: "2013 · Europe and Canada",
        title: "A name: Turkish Coffee Lady",
        text: "As the tour spread on social media, invitations poured in from Europe and Canada; the truck went as far as Amsterdam and NATO headquarters. It made the news on the BBC and in the Washington Post, and the title that is now a brand's name dates from those days.",
        quote: "It was actually the Washington Post that gave me the name Turkish Coffee Lady.",
      },
    },
    {
      img: "baby",
      t: 1250,
      tr: {
        kicker: "Toronto",
        title: "Kızıma bir miras",
        text: "Beş aylık hamileyken Toronto'da bir AVM'de bedava Türk kahvesi dağıtıyordu. Hemen yanında, üç sandalyelik bir köşe kafenin önünde insanlar parayla espresso almak için sıra bekliyordu. O gün gönüllülüğün yetmediğini, Türk kahvesinin bir marka olması gerektiğini anladı.",
        quote: "O gün kızıma ne miras bırakacağımı çok iyi anladım: Turkish Coffee Lady.",
      },
      en: {
        kicker: "Toronto",
        title: "A legacy for my daughter",
        text: "Five months pregnant, she was handing out free Turkish coffee in a Toronto mall. Right next to her, people queued in front of a tiny corner café to pay for espresso. That day she understood that volunteering wasn't enough; Turkish coffee had to become a brand.",
        quote: "That day I knew exactly what I would leave my daughter: Turkish Coffee Lady.",
      },
    },
    {
      img: "eclipse",
      t: 1490,
      tr: {
        kicker: "Tysons Corner → Türkiye",
        title: "Bir telefon",
        text: "Ortağı Ahmet Şerif İzgören'le, Amerika'nın en prestijli AVM'lerinden Tysons Corner Center'ın kalbine bir Türk kahvesi kafesi kurmuştu. Bir sabah kafeyi açmaya giderken telefon çaldı: göğüs kanseri. Tedavi için Türkiye'ye döndü; altı ay sonra iyileşmiş olarak geri geldi.",
        quote: "Beni Türkiye iyileştirdi. Şükür demeyi öğrendim.",
      },
      en: {
        kicker: "Tysons Corner → Türkiye",
        title: "One phone call",
        text: "With her partner Ahmet Şerif İzgören she had opened a Turkish coffee café at the heart of Tysons Corner Center, one of America's most prestigious malls. One morning, on her way to open up, the phone rang: breast cancer. She went back to Türkiye for treatment and returned six months later, healed.",
        quote: "Türkiye healed me. I learned to say thank you.",
      },
    },
    {
      img: "times",
      t: 1830,
      tr: {
        kicker: "Pandemi · Times Meydanı",
        title: "Bir lokasyon kapandı, bir vakıf açıldı",
        text: "Pandemi kafeyi götürdü; en çok da kadın girişimcileri vurdu. Buradan güç alarak Turkish Coffee Lady Vakfı'nı kurdu: Türk kahvesi kültürünü yaşatmak ve kadın girişimcilere rehber olmak için. 5 Aralık Dünya Türk Kahvesi Günü, Times Meydanı'ndaki dev ekranlarda kutlandı.",
        quote: "Bizim misyonumuz bir lokasyondan ibaret değil.",
      },
      en: {
        kicker: "Pandemic · Times Square",
        title: "One location closed, a foundation opened",
        text: "The pandemic took the café, and hit women entrepreneurs hardest of all. Drawing strength from that, she founded the Turkish Coffee Lady Foundation to keep Turkish coffee culture alive and to mentor women entrepreneurs. December 5, World Turkish Coffee Day, was celebrated on the giant screens of Times Square.",
        quote: "Our mission is much bigger than a single location.",
      },
    },
    {
      img: "house",
      img2: "togg",
      t: 1925,
      tr: {
        kicker: "Old Town Alexandria, VA",
        title: "Bir kültür evi",
        text: "Kadın girişimcilere yönelik bir destekle King Street'te yeni bir yer açıldı; 22 Ocak'taki açılışta sıra kapının dışına taşıyordu. Bugün sadece bir kahve evi değil, bir kültür merkezi. Ve üç yıldır Las Vegas'taki dev teknoloji fuarında Togg'un yanında Türk misafirperverliğini yaşatıyor.",
        quote: "Türk kahvesini, inanıyorum, el birliğiyle hak ettiği yere taşıyacağız.",
      },
      en: {
        kicker: "Old Town Alexandria, VA",
        title: "A house of culture",
        text: "With a grant for women entrepreneurs, a new place opened on King Street; on opening day, January 22, the line ran out the door. Today it is not just a coffee house but a cultural center. And for three years it has served Turkish hospitality alongside Togg at the giant tech show in Las Vegas.",
        quote: "I believe that together we will carry Turkish coffee to the place it deserves.",
      },
    },
  ];

function TclToPlayer(el) {
  if (!el) return;
  const off = -Math.max(80, (innerHeight - el.offsetHeight) / 2);
  pr.lenis
    ? pr.lenis.scrollTo(el, { duration: 1.6, offset: off })
    : scrollTo({ top: el.getBoundingClientRect().top + scrollY + off, behavior: "smooth" });
}
function TclReveal(ref, dep) {
  K.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll(".tcl-fx:not(.is-on)");
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("is-on"));
      return;
    }
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          e.isIntersecting && (e.target.classList.add("is-on"), io.unobserve(e.target));
        }),
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [dep]);
}

function TclPlay() {
  return w.jsx("svg", {
    viewBox: "0 0 24 24",
    width: 22,
    height: 22,
    "aria-hidden": !0,
    children: w.jsx("path", { d: "M8 5.5v13l11-6.5z", fill: "currentColor" }),
  });
}

function TclFilm() {
  const { lang: L } = Nn(),
    c = TclCopy[L === "en" ? "en" : "tr"],
    lk = L === "en" ? "en" : "tr",
    root = K.useRef(null),
    frame = K.useRef(null),
    vid = K.useRef(null),
    amb = K.useRef(null),
    rail = K.useRef(null),
    [started, setStarted] = K.useState(!1),
    [cur, setCur] = K.useState(0),
    [active, setActive] = K.useState(0);
  TclReveal(root, L);
  const play = K.useCallback((t) => {
    const v = vid.current;
    if (!v) return;
    setStarted(!0);
    typeof t == "number" && (v.currentTime = t);
    const p = v.play();
    p && p.catch && p.catch(() => {});
  }, []);
  K.useEffect(() => {
    const h = (e) => {
      TclToPlayer(frame.current);
      setTimeout(() => play(e.detail), 450);
    };
    window.addEventListener("tcl-seek", h);
    return () => window.removeEventListener("tcl-seek", h);
  }, [play]);
  K.useEffect(() => {
    const a = amb.current;
    if (!a) return;
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      e.isIntersecting && !started ? a.play().catch(() => {}) : a.pause();
    });
    io.observe(root.current);
    return () => io.disconnect();
  }, [started]);
  const onTime = () => {
    const v = vid.current;
    if (!v) return;
    setCur(v.currentTime);
    let i = 0;
    TclChapters.forEach((ch, k) => v.currentTime >= ch.t - 0.5 && (i = k));
    if (i !== active) {
      setActive(i);
      const el = rail.current && rail.current.children[i];
      el &&
        rail.current.scrollTo({
          left: el.offsetLeft - rail.current.clientWidth / 2 + el.clientWidth / 2,
          behavior: "smooth",
        });
    }
  };
  return w.jsxs("section", {
    id: "film",
    className: "tcl tcl-film",
    ref: root,
    children: [
      w.jsxs("div", {
        className: "tcl-film__bg",
        "aria-hidden": "true",
        children: [
          w.jsx("video", {
            ref: amb,
            src: "./film/loop.mp4",
            muted: !0,
            loop: !0,
            playsInline: !0,
            preload: "metadata",
            poster: TclImg("cezve"),
          }),
          w.jsx("span", { className: "tcl-grain" }),
        ],
      }),
      w.jsxs("header", {
        className: "tcl-film__head",
        children: [
          w.jsx("p", { className: "mono section__eyebrow tcl-fx", children: c.filmEyebrow }),
          w.jsx("h2", { className: "tcl-film__title tcl-fx", children: c.filmTitle }),
          w.jsx("p", { className: "tcl-film__quote tcl-fx", children: c.filmQuote }),
          w.jsx("p", { className: "tcl-film__lead tcl-fx", children: c.filmLead }),
        ],
      }),
      w.jsxs("div", {
        className: `tcl-player tcl-fx${started ? " is-started" : ""}`,
        ref: frame,
        children: [
          w.jsx("video", {
            ref: vid,
            className: "tcl-player__video",
            src: TclFilmSrc,
            poster: TclImg("poster"),
            preload: "none",
            playsInline: !0,
            controls: started,
            onTimeUpdate: onTime,
            "aria-label": c.filmTitle,
          }),
          !started &&
            w.jsxs("button", {
              className: "tcl-player__cover",
              onClick: () => play(cur > 1 ? void 0 : 0),
              children: [
                w.jsx("img", { src: TclImg("poster"), alt: "", loading: "lazy" }),
                w.jsxs("span", {
                  className: "tcl-player__cta",
                  children: [
                    w.jsx("span", { className: "tcl-player__ring", children: w.jsx(TclPlay, {}) }),
                    w.jsxs("span", {
                      className: "tcl-player__label",
                      children: [
                        w.jsx("strong", { children: cur > 1 ? c.resume : c.watch }),
                        w.jsxs("span", { className: "mono", children: ["35:53 · ", c.lang] }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
        ],
      }),
      w.jsxs("div", {
        className: "tcl-chapters tcl-fx",
        children: [
          w.jsxs("div", {
            className: "tcl-chapters__bar",
            children: [
              w.jsx("p", { className: "mono", children: c.chapters }),
              w.jsxs("p", {
                className: "mono tcl-chapters__now",
                children: [
                  String(active + 1).padStart(2, "0"),
                  " / ",
                  String(TclChapters.length).padStart(2, "0"),
                  " · ",
                  TclChapters[active][lk],
                ],
              }),
            ],
          }),
          w.jsx("ol", {
            className: "tcl-chapters__rail",
            ref: rail,
            "data-lenis-prevent": "",
            children: TclChapters.map((ch, i) =>
              w.jsx(
                "li",
                {
                  children: w.jsxs("button", {
                    className: `tcl-chap${i === active && started ? " is-active" : ""}`,
                    onClick: () => {
                      TclToPlayer(frame.current);
                      play(ch.t);
                    },
                    children: [
                      w.jsxs("span", {
                        className: "tcl-chap__img",
                        children: [
                          w.jsx("img", { src: TclImg(ch.img), alt: "", loading: "lazy" }),
                          w.jsx("span", { className: "tcl-chap__time", children: TclFmt(ch.t) }),
                        ],
                      }),
                      w.jsx("span", { className: "mono tcl-chap__num", children: `${c.chapter} ${String(i + 1).padStart(2, "0")}` }),
                      w.jsx("span", { className: "tcl-chap__title", children: ch[lk] }),
                    ],
                  }),
                },
                ch.t,
              ),
            ),
          }),
        ],
      }),
    ],
  });
}

function TclJourney() {
  const { lang: L } = Nn(),
    lk = L === "en" ? "en" : "tr",
    c = TclCopy[lk],
    root = K.useRef(null);
  TclReveal(root, L);
  const seek = (t) => window.dispatchEvent(new CustomEvent("tcl-seek", { detail: t }));
  return w.jsxs("section", {
    id: "journey",
    className: "tcl tcl-journey",
    ref: root,
    children: [
      w.jsxs("header", {
        className: "tcl-journey__head",
        children: [
          w.jsx("p", { className: "mono section__eyebrow tcl-fx", children: c.journeyEyebrow }),
          w.jsx("h2", { className: "section__title tcl-fx", children: c.journeyTitle }),
          w.jsx("p", { className: "tcl-journey__lead tcl-fx", children: c.journeyLead }),
        ],
      }),
      w.jsx("ol", {
        className: "tcl-acts",
        children: TclActs.map((a, i) => {
          const d = a[lk];
          return w.jsxs(
            "li",
            {
              className: `tcl-act${i % 2 ? " is-flip" : ""}`,
              children: [
                w.jsxs("figure", {
                  className: "tcl-act__media tcl-fx",
                  children: [
                    w.jsx("img", { src: TclImg(a.img), alt: d.title.replace(/[“”]/g, ""), loading: "lazy" }),
                    a.img2 &&
                      w.jsx("img", { className: "tcl-act__inset", src: TclImg(a.img2), alt: "", loading: "lazy" }),
                    w.jsxs("button", {
                      className: "tcl-act__watch",
                      onClick: () => seek(a.t),
                      children: [w.jsx(TclPlay, {}), w.jsxs("span", { className: "mono", children: [c.inFilm, " · ", TclFmt(a.t)] })],
                    }),
                  ],
                }),
                w.jsxs("div", {
                  className: "tcl-act__body",
                  children: [
                    w.jsxs("p", {
                      className: "mono tcl-act__kicker tcl-fx",
                      children: [w.jsx("span", { className: "tcl-act__no", children: String(i + 1).padStart(2, "0") }), d.kicker],
                    }),
                    w.jsx("h3", { className: "tcl-act__title tcl-fx", children: d.title }),
                    w.jsx("p", { className: "tcl-act__text tcl-fx", children: d.text }),
                    w.jsx("blockquote", { className: "tcl-act__quote tcl-fx", children: d.quote }),
                  ],
                }),
              ],
            },
            a.img,
          );
        }),
      }),
    ],
  });
}

function TclProduct() {
  const { lang: L } = Nn(),
    lk = L === "en" ? "en" : "tr",
    c = TclCopy[lk],
    root = K.useRef(null),
    can = K.useRef(null);
  TclReveal(root, L);
  K.useEffect(() => {
    const el = root.current,
      img = can.current;
    if (!el || !img) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect(),
        p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight));
      img.style.setProperty("--tcl-y", `${(p * 60).toFixed(1)}px`);
      img.style.setProperty("--tcl-r", `${(p * -6).toFixed(2)}deg`);
    };
    const on = () => raf || (raf = requestAnimationFrame(tick));
    addEventListener("scroll", on, { passive: !0 });
    tick();
    return () => removeEventListener("scroll", on);
  }, []);
  const mail = () => {
    const g = ft.commerce && ft.commerce.showcase;
    g ? iq("Bold Istanbul", lk) : (location.href = "mailto:hello@turkishcoffeelady.com");
  };
  return w.jsxs("section", {
    id: "bold-istanbul",
    className: "tcl tcl-product",
    ref: root,
    children: [
      w.jsx("div", {
        className: "tcl-product__bg",
        "aria-hidden": "true",
        style: { backgroundImage: "url(./fon/bold-istanbul.webp)" },
      }),
      w.jsxs("div", {
        className: "tcl-product__grid",
        children: [
          w.jsxs("div", {
            className: "tcl-product__body",
            children: [
              w.jsx("p", { className: "mono section__eyebrow tcl-fx", children: c.productEyebrow }),
              w.jsx("h2", { className: "section__title tcl-fx", children: c.productTitle }),
              w.jsx("p", { className: "tcl-product__sub tcl-fx", children: c.productSub }),
              c.productText.map((p, i) => w.jsx("p", { className: "tcl-product__text tcl-fx", children: p }, i)),
              w.jsx("blockquote", { className: "tcl-act__quote tcl-fx", children: c.productQuote }),
              w.jsx("ul", {
                className: "tcl-facts tcl-fx",
                children: c.productFacts.map(([a, b], i) =>
                  w.jsxs("li", { children: [w.jsx("strong", { children: a }), w.jsx("span", { className: "mono", children: b })] }, i),
                ),
              }),
              w.jsxs("div", {
                className: "tcl-product__cta tcl-fx",
                children: [
                  w.jsx("button", { className: "tcl-btn tcl-btn--gold", onClick: mail, children: c.join }),
                  w.jsxs("button", {
                    className: "tcl-btn",
                    onClick: () => window.dispatchEvent(new CustomEvent("tcl-seek", { detail: 0 })),
                    children: [w.jsx(TclPlay, {}), c.watch],
                  }),
                ],
              }),
            ],
          }),
          w.jsxs("div", {
            className: "tcl-product__stage tcl-fx",
            children: [
              w.jsx("span", { className: "tcl-product__halo", "aria-hidden": "true" }),
              w.jsx("img", { ref: can, className: "tcl-product__can", src: "./cut/bold-istanbul.webp", alt: "Bold Istanbul" }),
              w.jsx("p", { className: "mono tcl-product__shake", children: c.shake }),
            ],
          }),
        ],
      }),
    ],
  });
}
