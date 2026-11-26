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

function TclFilm({ start }) {
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
    [active, setActive] = K.useState(0),
    [pend, setPend] = K.useState(start ?? null);
  TclReveal(root, L);
  K.useEffect(() => {
    if (start == null) return;
    setPend(start);
    const h = setTimeout(() => TclToPlayer(frame.current), 350);
    return () => clearTimeout(h);
  }, [start]);
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
              onClick: () => play(pend != null ? pend : cur > 1 ? void 0 : 0),
              children: [
                w.jsx("img", { src: TclImg("poster"), alt: "", loading: "lazy" }),
                w.jsxs("span", {
                  className: "tcl-player__cta",
                  children: [
                    w.jsx("span", { className: "tcl-player__ring", children: w.jsx(TclPlay, {}) }),
                    w.jsxs("span", {
                      className: "tcl-player__label",
                      children: [
                        w.jsx("strong", { children: pend != null ? `${c.watch} · ${TclFmt(pend)}` : cur > 1 ? c.resume : c.watch }),
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
  const seek = (t) => (location.hash = "#/film?t=" + Math.round(t));
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


// ---------------- multi-page shell ----------------
const TclPages = ["urun", "hikaye", "film", "iletisim", "incele"],
  TclPageCopy = {
    tr: {
      homeEyebrow: "Turkish Coffee Lady",
      homeTitle: "Dünyanın ilk kahvesi. Şimdi buzlu.",
      homeLead: "Türk kahvesi, kahvenin ilk pişirme yöntemi. Bold Istanbul onu bir kutuya, soğuk ve sıfır şekerle taşıyor.",
      cards: [
        ["#/urun", "Ürün", "Bold Istanbul", "cut"],
        ["#/hikaye", "Hikâye", "Bir cezveden bir kutuya", "truck"],
        ["#/film", "Film", "Bir Fincan Cesaret · 36 dk", "poster"],
      ],
      more: "Keşfet",
      prodEyebrow: "Buzlu Türk Kahvesi · 250 ml",
      front: "Ön",
      back: "Arka",
      watchFilm: "Filmi izle",
      details: "Kutunun üzerinde",
      ingTitle: "İçindekiler",
      ing: [
        ["İçerik", "Kavrulmuş ve öğütülmüş kahve"],
        ["Çekirdek", "Arabica"],
        ["Kavrum", "Orta"],
        ["Öğütüm", "İnce"],
        ["Menşei", "Türkiye · Türk Gıda Kodeksi'ne uygun"],
      ],
      nutTitle: "Besin değerleri",
      nutNote: "Porsiyon 2 çay kaşığı (10 g) · ambalajda 25 porsiyon",
      nut: [
        ["Enerji", "21,6 kcal"],
        ["Toplam yağ", "1 g"],
        ["Doymuş yağ", "0,5 g"],
        ["Karbonhidrat", "6 g"],
        ["Lif", "5 g"],
        ["Şeker", "0 g"],
        ["Protein", "1 g"],
        ["Sodyum", "1 mg"],
      ],
      canTitle: "Kutu",
      can: [
        ["Hacim", "8.5 fl oz (250 ml)"],
        ["Kullanım", "Çalkala, soğuk iç"],
        ["Kutu çizimi", "hasankale"],
        ["Kuruluş", "2017"],
      ],
      contactEyebrow: "İletişim",
      contactTitle: "Bize yazın",
      contactLead: "Lisanslama, bayilik ve iş birliği için.",
      info: [
        ["E-posta", "hello@turkishcoffeelady.com", "mailto:hello@turkishcoffeelady.com"],
        ["Instagram", "@turkishcoffeelady", "https://www.instagram.com/turkishcoffeelady/"],
        ["Web", "turkishcoffeelady.com", "https://turkishcoffeelady.com/"],
        ["Kültür evi", "Old Town Alexandria, VA", null],
      ],
      name: "Ad soyad",
      email: "E-posta",
      message: "Mesaj",
      send: "Gönder",
      faq: "Sık sorulanlar",
      footNote: "Turkish Coffee Lady için hazırlanmış bağımsız bir konsept demodur; marka sahibiyle bağlantılı değildir.",
    },
    en: {
      homeEyebrow: "Turkish Coffee Lady",
      homeTitle: "The world's first coffee. Now iced.",
      homeLead: "Turkish coffee is the first way coffee was ever brewed. Bold Istanbul carries it in a can, cold and with zero sugar.",
      cards: [
        ["#/urun", "Product", "Bold Istanbul", "cut"],
        ["#/hikaye", "Story", "From a cezve to a can", "truck"],
        ["#/film", "Film", "A Cup of Courage · 36 min", "poster"],
      ],
      more: "Explore",
      prodEyebrow: "Iced Turkish Coffee · 8.5 fl oz",
      front: "Front",
      back: "Back",
      watchFilm: "Watch the film",
      details: "On the can",
      ingTitle: "Ingredients",
      ing: [
        ["Ingredients", "Roasted and ground coffee"],
        ["Bean", "Arabica"],
        ["Roast", "Medium"],
        ["Grind", "Fine"],
        ["Origin", "Türkiye · Turkish Food Codex"],
      ],
      nutTitle: "Nutrition facts",
      nutNote: "Serving size 2 teaspoons (10 g) · 25 servings per container",
      nut: [
        ["Calories", "21.6"],
        ["Total fat", "1 g"],
        ["Saturated fat", "0.5 g"],
        ["Carbohydrate", "6 g"],
        ["Dietary fiber", "5 g"],
        ["Sugars", "0 g"],
        ["Protein", "1 g"],
        ["Sodium", "1 mg"],
      ],
      canTitle: "The can",
      can: [
        ["Volume", "8.5 fl oz (250 ml)"],
        ["Serve", "Shake well, drink cold"],
        ["Art work", "hasankale"],
        ["Established", "2017"],
      ],
      contactEyebrow: "Contact",
      contactTitle: "Write to us",
      contactLead: "For licensing, wholesale and partnerships.",
      info: [
        ["Email", "hello@turkishcoffeelady.com", "mailto:hello@turkishcoffeelady.com"],
        ["Instagram", "@turkishcoffeelady", "https://www.instagram.com/turkishcoffeelady/"],
        ["Web", "turkishcoffeelady.com", "https://turkishcoffeelady.com/"],
        ["Culture house", "Old Town Alexandria, VA", null],
      ],
      name: "Full name",
      email: "Email",
      message: "Message",
      send: "Send",
      faq: "Good questions",
      footNote: "An independent concept demo prepared for Turkish Coffee Lady; not affiliated with the brand owner.",
    },
  };

function TclSubNow() {
  return /^#\/(urun|hikaye|film|iletisim|incele)(\?|$)/.test(location.hash);
}
function TclPageOf(route) {
  const p = (route || "").split("?")[0];
  return TclPages.includes(p) ? p : null;
}
function TclNavItems(nav) {
  return [
    ["#/urun", nav.bold ?? "Bold Istanbul"],
    ["#/hikaye", nav.journey ?? nav.story],
    ["#/film", nav.film ?? "Film"],
    ["#/iletisim", nav.contact],
  ];
}

function TclPage({ route }) {
  const page = TclPageOf(route),
    q = new URLSearchParams((route.split("?")[1] || "")),
    t = q.has("t") ? Number(q.get("t")) || 0 : null;
  K.useLayoutEffect(() => {
    document.documentElement.dataset.tclPage = page;
    pr.lenis ? pr.lenis.scrollTo(0, { immediate: !0, force: !0 }) : scrollTo(0, 0);
    return () => {
      delete document.documentElement.dataset.tclPage;
    };
  }, [page]);
  return w.jsxs("main", {
    className: `tcl-main tcl-main--${page}`,
    children: [
      page === "urun" && w.jsx(TclProductPage, {}),
      page === "hikaye" && w.jsx(TclJourney, {}),
      page === "film" && w.jsx(TclFilm, { start: t }),
      page === "iletisim" && w.jsx(TclContact, {}),
      page === "incele" && w.jsx(TclViewer, {}),
      w.jsx(TclFooter, {}),
    ],
  });
}

function TclArrow() {
  return w.jsx("svg", {
    viewBox: "0 0 24 24",
    width: 16,
    height: 16,
    "aria-hidden": !0,
    children: w.jsx("path", { d: "M5 12h13M13 6l6 6-6 6", fill: "none", stroke: "currentColor", strokeWidth: 1.5 }),
  });
}

function TclHome() {
  const { lang: L } = Nn(),
    c = TclPageCopy[L === "en" ? "en" : "tr"],
    root = K.useRef(null);
  TclReveal(root, L);
  const img = (k) => (k === "cut" ? "./cut/bold-istanbul.webp" : TclImg(k));
  return w.jsxs(w.Fragment, {
    children: [
      w.jsxs("section", {
        className: "tcl tcl-home",
        ref: root,
        children: [
          w.jsxs("header", {
            className: "tcl-home__head",
            children: [
              w.jsx("p", { className: "mono section__eyebrow tcl-fx", children: c.homeEyebrow }),
              w.jsx("h2", { className: "tcl-home__title tcl-fx", children: c.homeTitle }),
              w.jsx("p", { className: "tcl-home__lead tcl-fx", children: c.homeLead }),
            ],
          }),
          w.jsx("ul", {
            className: "tcl-cards",
            children: c.cards.map(([href, k, title, im], i) =>
              w.jsx(
                "li",
                {
                  className: "tcl-fx",
                  style: { transitionDelay: `${i * 0.12}s` },
                  children: w.jsxs("a", {
                    href,
                    className: `tcl-card tcl-card--${im}`,
                    children: [
                      w.jsx("span", { className: "tcl-card__img", children: w.jsx("img", { src: img(im), alt: "", loading: "lazy" }) }),
                      w.jsxs("span", {
                        className: "tcl-card__body",
                        children: [
                          w.jsx("span", { className: "mono", children: k }),
                          w.jsx("strong", { children: title }),
                          w.jsxs("span", { className: "tcl-card__more mono", children: [c.more, w.jsx(TclArrow, {})] }),
                        ],
                      }),
                    ],
                  }),
                },
                href,
              ),
            ),
          }),
        ],
      }),
      w.jsx(TclFooter, {}),
    ],
  });
}

function TclProductPage() {
  const { lang: L } = Nn(),
    lk = L === "en" ? "en" : "tr",
    c = TclCopy[lk],
    p = TclPageCopy[lk],
    root = K.useRef(null),
    [side, setSide] = K.useState("front");
  TclReveal(root, L);
  const join = () => (ft.commerce && ft.commerce.showcase ? iq("Bold Istanbul", lk) : (location.href = "mailto:hello@turkishcoffeelady.com"));
  const list = (title, rows, note) =>
    w.jsxs("div", {
      className: "tcl-spec tcl-fx",
      children: [
        w.jsx("h3", { className: "mono", children: title }),
        w.jsx("dl", {
          children: rows.map(([k, v]) =>
            w.jsxs("div", { children: [w.jsx("dt", { children: k }), w.jsx("dd", { children: v })] }, k),
          ),
        }),
        note && w.jsx("p", { className: "tcl-spec__note", children: note }),
      ],
    });
  return w.jsxs("div", {
    ref: root,
    children: [
      w.jsxs("section", {
        className: "tcl tcl-prod",
        children: [
          w.jsx("div", { className: "tcl-prod__bg", "aria-hidden": "true" }),
          w.jsxs("div", {
            className: "tcl-prod__grid",
            children: [
              w.jsxs("div", {
                className: "tcl-prod__body",
                children: [
                  w.jsx("p", { className: "mono section__eyebrow tcl-fx", children: p.prodEyebrow }),
                  w.jsx("h1", { className: "tcl-prod__title tcl-fx", children: "Bold Istanbul" }),
                  w.jsx("p", { className: "tcl-prod__sub tcl-fx", children: c.productSub }),
                  w.jsx("p", { className: "tcl-prod__text tcl-fx", children: c.productText[0] }),
                  w.jsx("p", { className: "tcl-prod__text tcl-fx", children: c.productText[1] }),
                  w.jsx("ul", {
                    className: "tcl-facts tcl-fx",
                    children: c.productFacts.map(([a, b], i) =>
                      w.jsxs("li", { children: [w.jsx("strong", { children: a }), w.jsx("span", { className: "mono", children: b })] }, i),
                    ),
                  }),
                  w.jsxs("div", {
                    className: "tcl-prod__cta tcl-fx",
                    children: [
                      w.jsx("button", { className: "tcl-btn tcl-btn--gold", onClick: join, children: c.join }),
                      w.jsxs("a", { className: "tcl-btn", href: "#/film", children: [w.jsx(TclPlay, {}), p.watchFilm] }),
                    ],
                  }),
                ],
              }),
              w.jsxs("div", {
                className: "tcl-prod__stage tcl-fx",
                children: [
                  w.jsx("span", { className: "tcl-prod__halo", "aria-hidden": "true" }),
                  w.jsxs("div", {
                    className: `tcl-prod__can is-${side}`,
                    children: [
                      w.jsx("img", { className: "tcl-prod__front", src: "./cut/bold-istanbul.webp", alt: "Bold Istanbul" }),
                      w.jsx("img", { className: "tcl-prod__back", src: "./cut/bold-istanbul-arka.webp", alt: "" }),
                    ],
                  }),
                  w.jsx("div", {
                    className: "tcl-toggle",
                    role: "group",
                    children: [
                      ["front", p.front],
                      ["back", p.back],
                    ].map(([k, label]) =>
                      w.jsx(
                        "button",
                        { className: side === k ? "is-on" : "", "aria-pressed": side === k, onClick: () => setSide(k), children: label },
                        k,
                      ),
                    ),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      w.jsxs("section", {
        className: "tcl tcl-specs",
        children: [
          w.jsx("p", { className: "mono section__eyebrow tcl-fx", children: p.details }),
          w.jsxs("div", {
            className: "tcl-specs__grid",
            children: [list(p.ingTitle, p.ing), list(p.nutTitle, p.nut, p.nutNote), list(p.canTitle, p.can)],
          }),
          w.jsxs("figure", {
            className: "tcl-specs__quote tcl-fx",
            children: [
              w.jsx("blockquote", { children: c.productQuote }),
              w.jsx("figcaption", { className: "mono", children: "Gizem Şalcıgil White · Turkish Coffee Lady" }),
            ],
          }),
        ],
      }),
    ],
  });
}

function TclContact() {
  const { lang: L, faqs } = Nn(),
    lk = L === "en" ? "en" : "tr",
    p = TclPageCopy[lk],
    root = K.useRef(null),
    [open, setOpen] = K.useState(0);
  TclReveal(root, L);
  const send = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      body = `${f.get("message") || ""}\n\n${f.get("name") || ""} · ${f.get("email") || ""}`;
    location.href = `mailto:hello@turkishcoffeelady.com?subject=${encodeURIComponent("Turkish Coffee Lady · Bold Istanbul")}&body=${encodeURIComponent(body)}`;
  };
  return w.jsxs("div", {
    ref: root,
    children: [
      w.jsx("section", {
        className: "tcl tcl-contact",
        children: w.jsxs("div", {
          className: "tcl-contact__grid",
          children: [
            w.jsxs("div", {
              children: [
                w.jsx("p", { className: "mono section__eyebrow tcl-fx", children: p.contactEyebrow }),
                w.jsx("h1", { className: "tcl-page-title tcl-fx", children: p.contactTitle }),
                w.jsx("p", { className: "tcl-page-lead tcl-fx", children: p.contactLead }),
                w.jsx("dl", {
                  className: "tcl-info tcl-fx",
                  children: p.info.map(([k, v, href]) =>
                    w.jsxs(
                      "div",
                      {
                        children: [
                          w.jsx("dt", { className: "mono", children: k }),
                          w.jsx("dd", {
                            children: href
                              ? w.jsx("a", { href, target: href.startsWith("http") ? "_blank" : void 0, rel: "noopener", children: v })
                              : v,
                          }),
                        ],
                      },
                      k,
                    ),
                  ),
                }),
              ],
            }),
            w.jsxs("form", {
              className: "tcl-form tcl-fx",
              onSubmit: send,
              children: [
                w.jsxs("label", { children: [w.jsx("span", { className: "mono", children: p.name }), w.jsx("input", { name: "name", autoComplete: "name" })] }),
                w.jsxs("label", {
                  children: [w.jsx("span", { className: "mono", children: p.email }), w.jsx("input", { name: "email", type: "email", autoComplete: "email" })],
                }),
                w.jsxs("label", { children: [w.jsx("span", { className: "mono", children: p.message }), w.jsx("textarea", { name: "message", rows: 5 })] }),
                w.jsx("button", { className: "tcl-btn tcl-btn--gold", type: "submit", children: p.send }),
              ],
            }),
          ],
        }),
      }),
      w.jsxs("section", {
        className: "tcl tcl-faq",
        children: [
          w.jsx("h2", { className: "tcl-faq__title tcl-fx", children: p.faq }),
          w.jsx("ul", {
            className: "tcl-faq__list tcl-fx",
            children: (faqs || []).map(([q, a], i) =>
              w.jsxs(
                "li",
                {
                  className: open === i ? "is-open" : "",
                  children: [
                    w.jsxs("button", {
                      "aria-expanded": open === i,
                      onClick: () => setOpen(open === i ? -1 : i),
                      children: [w.jsx("span", { children: q }), w.jsx("i", { "aria-hidden": "true" })],
                    }),
                    w.jsx("div", { className: "tcl-faq__a", children: w.jsx("p", { children: a }) }),
                  ],
                },
                q,
              ),
            ),
          }),
        ],
      }),
    ],
  });
}

function TclFooter() {
  const { lang: L, ui } = Nn(),
    p = TclPageCopy[L === "en" ? "en" : "tr"];
  return w.jsxs("footer", {
    className: "tcl tcl-footer",
    children: [
      w.jsxs("div", {
        className: "tcl-footer__top",
        children: [
          w.jsx("a", { href: "#flavors", className: "tcl-footer__logo", children: w.jsx("img", { src: "./brand/logo-cream.png", alt: "Turkish Coffee Lady" }) }),
          w.jsx("nav", {
            children: TclNavItems(ui.nav).map(([h, l]) => w.jsx("a", { href: h, children: l }, h)),
          }),
        ],
      }),
      w.jsxs("div", {
        className: "tcl-footer__bottom",
        children: [w.jsx("p", { className: "mono", children: "Good Coffee. Good Fortune." }), w.jsx("p", { children: p.footNote })],
      }),
    ],
  });
}

// ---------------- scroll opening: bag → can ----------------
const TclOpenSteps = [0, 0.11, 0.237, 0.356, 0.509, 0.678, 0.78, 1],
  TclOpenCopy = {
    tr: {
      labels: ["Başla", "Yırt", "Aç", "Kaşık", "Dönüşüm", "Soğuk", "Hazır"],
      steps: [
        ["Dünyanın ilk kahvesi.", "Bold Istanbul", "Yüz yıllık bir harman, 250 gramlık bir pakette."],
        ["Yırt.", "Kokla.", "Paketi açtığınız an İstanbul'un kahve kokusu odaya yayılır."],
        ["%100 Arabica.", "İnce çekim.", "Orta kavrulmuş, Türk kahvesi için un kıvamında öğütülmüş."],
        ["Bir kaşık", "yeter.", "Fincan başına iki çay kaşığı (10 g). Ritüel hep aynı."],
        ["Aynı harman.", "Şimdi buzlu.", "Yüz yıllık ritüel, soğuk ve sıfır şekerle bir kutuda."],
        ["Çalkala.", "Soğuk iç.", "250 ml Bold Istanbul: koyu ve yoğun, %100 doğal, düşük kalori."],
        ["Aynı İstanbul.", "İki ritüel.", "Bold Istanbul: koyu ve yoğun; pakette geleneksel, kutuda buzlu."],
      ],
      cta: "3D incele",
      film: "Filmi izle",
      tap: "ya da kutuya dokunun",
      scroll: "Kaydır",
    },
    en: {
      labels: ["Start", "Tear", "Open", "Scoop", "Pour", "Chill", "Ready"],
      steps: [
        ["The world's first coffee.", "Bold Istanbul", "A centuries-old blend in a 250 g bag."],
        ["Tear it.", "Breathe it in.", "The moment you open the bag, Istanbul's coffee aroma fills the room."],
        ["100% Arabica.", "Finely ground.", "Medium roasted, ground as fine as flour for Turkish coffee."],
        ["One spoon", "is all it takes.", "Two teaspoons (10 g) a cup. The ritual never changes."],
        ["Same blend.", "Now iced.", "A centuries-old ritual, cold and zero sugar, in a can."],
        ["Shake well.", "Drink cold.", "8.5 fl oz of Bold Istanbul: dark and rich, 100% natural, low calorie."],
        ["One Istanbul.", "Two rituals.", "Bold Istanbul, dark and rich: traditional in the bag, iced in the can."],
      ],
      cta: "Inspect in 3D",
      film: "Watch the film",
      tap: "or tap the can",
      scroll: "Scroll",
    },
  };

function TclOpening() {
  const { lang: L } = Nn(),
    c = TclOpenCopy[L === "en" ? "en" : "tr"],
    sec = K.useRef(null),
    sticky = K.useRef(null),
    stage = K.useRef(null),
    api = K.useRef(null),
    [step, setStep] = K.useState(0),
    [prog, setProg] = K.useState(0),
    [ready, setReady] = K.useState(!1);
  K.useEffect(() => {
    let alive = !0, raf = 0;
    const p3 = ft.products[0].photo3d;
    import(new URL("film/open/opening.js", document.baseURI).href)
      .then((m) =>
        m.mount(stage.current, {
          canTexture: bq,
          rows: p3.rows,
          axis: p3.axis,
          onInspect: () => (location.hash = "#/incele"),
          onReady: () => {
            window.__tclOpenReady = !0;
            alive && setReady(!0);
          },
        }),
      )
      .then((a) => {
        if (!alive) return a.destroy();
        api.current = a;
        tick();
      })
      .catch((e) => {
        window.__tclOpenReady = !0;
        console.warn("opening", e);
      });
    const tick = () => {
      raf = 0;
      const el = sec.current;
      if (!el) return;
      // the last viewport of the section overlaps the hero: the opening dissolves into it
      const r = el.getBoundingClientRect(),
        span = Math.max(1, r.height - innerHeight),
        p = Math.min(1, Math.max(0, -r.top / span)),
        vis = r.bottom > 0 && r.top < innerHeight;
      window.__tclOpenVis = vis;
      const sm = (t) => t * t * (3 - 2 * t), cl = (t) => Math.min(1, Math.max(0, t));
      const lb = sm(cl((p - 0.625) / 0.05)) * (1 - sm(cl((p - 0.775) / 0.04)));
      sticky.current && sticky.current.style.setProperty("--lb", lb.toFixed(3));
      if (api.current) (api.current.setProgress(p), api.current.setVisible(vis));
      let i = 0;
      TclOpenSteps.forEach((s, k) => k < 7 && p >= s - 0.001 && (i = k));
      setStep(i);
      setProg(p);
    };
    const on = () => raf || (raf = requestAnimationFrame(tick));
    addEventListener("scroll", on, { passive: !0 });
    addEventListener("resize", on);
    tick();
    return () => {
      alive = !1;
      window.__tclOpenVis = !1;
      removeEventListener("scroll", on);
      removeEventListener("resize", on);
      cancelAnimationFrame(raf);
      api.current && api.current.destroy();
    };
  }, []);
  const s = c.steps[step];
  return w.jsx("section", {
    id: "acilis",
    className: `tcl-open${ready ? " is-ready" : ""}`,
    ref: sec,
    children: w.jsxs("div", {
      className: "tcl-open__sticky",
      ref: sticky,
      children: [
        w.jsx("span", { className: "tcl-open__lb tcl-open__lb--t", "aria-hidden": "true" }),
        w.jsx("span", { className: "tcl-open__lb tcl-open__lb--b", "aria-hidden": "true" }),
        w.jsx("div", { className: "tcl-open__bg", "aria-hidden": "true" }),
        w.jsx("div", { className: "tcl-open__stage", ref: stage, "aria-hidden": "true" }),
        w.jsxs(
          "div",
          {
            className: "tcl-open__copy",
            children: [
              w.jsx("p", { className: "mono tcl-open__num", children: `${String(step + 1).padStart(2, "0")} / 07` }),
              w.jsxs("h2", { className: "tcl-open__title", children: [s[0], w.jsx("br", {}), w.jsx("em", { children: s[1] })] }),
              w.jsx("p", { className: "tcl-open__lead", children: s[2] }),
              step === 6 &&
                w.jsxs("div", {
                  className: "tcl-open__cta",
                  children: [
                    w.jsxs("a", { className: "tcl-btn tcl-btn--gold", href: "#/incele", children: [c.cta] }),
                    w.jsxs("a", { className: "tcl-btn", href: "#/film", children: [w.jsx(TclPlay, {}), c.film] }),
                    w.jsx("p", { className: "mono tcl-open__tap", children: c.tap }),
                  ],
                }),
            ],
          },
          `${L}-${step}`,
        ),
        w.jsxs("div", {
          className: "tcl-open__bar",
          children: [
            w.jsx("ol", {
              children: c.labels.map((l, i) =>
                w.jsx("li", { className: i === step ? "is-on" : i < step ? "is-done" : "", children: l }, l),
              ),
            }),
            w.jsx("span", { className: "tcl-open__track", children: w.jsx("i", { style: { transform: `scaleX(${prog})` } }) }),
          ],
        }),
        w.jsxs("p", {
          className: `mono tcl-open__hint${prog > 0.02 ? " is-gone" : ""}`,
          children: [c.scroll, w.jsx("span", {})],
        }),
      ],
    }),
  });
}

// the can drops into the hero from above every time the visitor scrolls down into it
function TclHeroDrop(r, n) {
  if (TclSubNow() || typeof nt === "undefined") return;
  if (r.top >= n * 0.98) {
    nt.intro = 0;
    nt.introAt = performance.now() + 1e9;
    nt.__tclArmed = 1;
  } else if (nt.__tclArmed && r.top < n * 0.5) {
    nt.__tclArmed = 0;
    nt.introAt = performance.now() + 60;
  }
}

function TclLoaderReady() {
  return TclSubNow() || !!window.__tclOpenReady;
}

// ---------------- 3D inspect page ----------------
const TclViewerCopy = {
  tr: {
    eyebrow: "3D incele",
    hint: "Sürükleyerek çevirin · kaydırarak yakınlaştırın",
    views: [["front", "Ön"], ["side", "Yan"], ["back", "Arka"]],
    back: "Ana sayfa",
    product: "Ürün sayfası",
    spots: [
      { angle: 0, y: 1.05, title: "Nazar boncuğu", text: "Uğur getiren nazar, her kutuda." },
      { angle: 0.55, y: 0.78, title: "hasankale çizimi", text: "Galata Kulesi, Kız Kulesi ve Boğaz'da bir vapur." },
      { angle: -0.25, y: 0.33, title: "Koyu & yoğun", text: "%100 doğal, sıfır şeker, düşük kalori · 250 ml." },
      { angle: Math.PI - 0.49, y: 0.6, title: "Besin değerleri", text: "Porsiyon 10 g · 21,6 kcal · 0 g şeker." },
      { angle: Math.PI + 0.55, y: 0.42, title: "İçindekiler", text: "Arabica; orta kavrum, ince çekim. Türkiye'de üretildi." },
    ],
  },
  en: {
    eyebrow: "Inspect in 3D",
    hint: "Drag to turn · scroll to zoom",
    views: [["front", "Front"], ["side", "Side"], ["back", "Back"]],
    back: "Home",
    product: "Product page",
    spots: [
      { angle: 0, y: 1.05, title: "Evil eye", text: "Good fortune on every can." },
      { angle: 0.55, y: 0.78, title: "Art by hasankale", text: "Galata Tower, Maiden's Tower and a Bosphorus ferry." },
      { angle: -0.25, y: 0.33, title: "Dark & rich", text: "100% natural, zero sugar, low calorie · 8.5 fl oz." },
      { angle: Math.PI - 0.49, y: 0.6, title: "Nutrition facts", text: "Serving 10 g · 21.6 kcal · 0 g sugar." },
      { angle: Math.PI + 0.55, y: 0.42, title: "Ingredients", text: "Arabica; medium roast, fine grind. Made in Türkiye." },
    ],
  },
};
function TclViewer() {
  const { lang: L } = Nn(),
    c = TclViewerCopy[L === "en" ? "en" : "tr"],
    stage = K.useRef(null),
    api = K.useRef(null),
    [ready, setReady] = K.useState(!1),
    [cur, setCur] = K.useState("front");
  K.useEffect(() => {
    let alive = !0;
    const p3 = ft.products[0].photo3d;
    import(new URL("film/open/viewer.js", document.baseURI).href)
      .then((m) =>
        m.mount(stage.current, { canTexture: bq, rows: p3.rows, axis: p3.axis, hotspots: c.spots, onReady: () => alive && setReady(!0) }),
      )
      .then((a) => (alive ? (api.current = a) : a.destroy()))
      .catch((e) => console.warn("viewer", e));
    return () => {
      alive = !1;
      api.current && api.current.destroy();
      api.current = null;
    };
  }, [L]);
  const go = (v) => (setCur(v), api.current && api.current.view(v));
  return w.jsxs("section", {
    className: `tcl tcl-viewer${ready ? " is-ready" : ""}`,
    children: [
      w.jsx("div", { className: "tcl-open__bg", "aria-hidden": "true" }),
      w.jsx("div", { className: "tcl-viewer__stage", ref: stage, "data-lenis-prevent": "" }),
      w.jsxs("div", {
        className: "tcl-viewer__head",
        children: [
          w.jsx("p", { className: "mono section__eyebrow", children: c.eyebrow }),
          w.jsx("h1", { className: "tcl-page-title", children: "Bold Istanbul" }),
          w.jsx("p", { className: "mono tcl-viewer__hint", children: c.hint }),
        ],
      }),
      w.jsx("div", {
        className: "tcl-viewer__views",
        role: "group",
        children: c.views.map(([k, l]) =>
          w.jsx("button", { className: cur === k ? "is-on" : "", "aria-pressed": cur === k, onClick: () => go(k), children: l }, k),
        ),
      }),
      w.jsxs("div", {
        className: "tcl-viewer__links",
        children: [
          w.jsxs("a", { className: "tcl-btn", href: "#flavors", children: ["← ", c.back] }),
          w.jsx("a", { className: "tcl-btn tcl-btn--gold", href: "#/urun", children: c.product }),
        ],
      }),
    ],
  });
}
