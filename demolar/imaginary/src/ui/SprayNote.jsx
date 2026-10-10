import { useEffect, useState } from "react";

import { useT } from "../i18n";
import { SPRAY, SPRAY_SLOW, sceneState } from "../shared";
import { FAM as KEYS, low } from "./Finder";

// Parfümü sıkınca buğunun ardından kokunun nasıl koktuğu belirir (sağdaki nota listesinin yerinde): notalardan
// hesaplanan koku profili (ferah, çiçeksi, tatlı, odunsu-baharatlı akorları; baskınlığına göre dolan altın çubuklar, sayı yok) ve
// markanın nota piramidi ("Üst: …", "Kalp: …", "Dip: …") satır satır sisin içinden netleşir; birkaç saniye sonra
// buğuyla birlikte dağılır. Bütün bilgi ürünün kendi notalarından.
const SHOW = 6; // saniye
const FAM = {
  tr: { title: "Koku profili", fresh: "Ferah", floral: "Çiçeksi", sweet: "Tatlı", warm: "Odunsu ve baharatlı" },
  en: { title: "Scent profile", fresh: "Fresh", floral: "Floral", sweet: "Sweet", warm: "Woody & spicy" },
};

// Koku profili: her nota bir kez sayılır (katmanlarda tekrar eden nota ağırlığı bozmasın); markanın kendi
// açıklamasındaki koku kelimeleri ("gül ve armut şerbeti", "pamuk şeker") de katılır.
function scentProfile(f) {
  const notes = new Set();
  (f.composition ?? []).forEach((c) => (c.includes(": ") ? c.split(": ")[1] : c).split(/,\s*/).forEach((n) => n && notes.add(low(n))));
  (f.notes ?? []).forEach((n) => notes.add(low(n)));
  const text = low(`${f.tagline ?? ""} ${f.description ?? ""}`);
  const v = {};
  for (const [fam, keys] of Object.entries(KEYS)) {
    let n = 0;
    notes.forEach((note) => keys.some((k) => note.includes(k)) && (n += 1));
    keys.forEach((k) => k.length > 3 && new RegExp(`(^|[^a-zçğıöşü])${k}`).test(text) && (n += 0.5));
    v[fam] = n;
  }
  const sum = Object.values(v).reduce((a, b) => a + b, 0) || 1;
  for (const k in v) v[k] /= sum;
  return v;
}

export default function SprayNote() {
  const t = useT();
  const [note, setNote] = useState(null);

  useEffect(() => {
    let last = sceneState.spray.t0;
    let hide;
    let show;
    const id = setInterval(() => {
      const sp = sceneState.spray;
      if (sp.t0 === last || sp.flavor < 0) return;
      last = sp.t0;
      clearTimeout(hide);
      clearTimeout(show);
      // Buğu çıkınca (başlığa basıldıktan hemen sonra) profil gelir.
      show = setTimeout(() => {
        setNote({ key: sp.t0, flavor: sp.flavor, out: false });
        hide = setTimeout(() => setNote((n) => n && { ...n, out: true }), SHOW * 1000 * SPRAY_SLOW);
      }, SPRAY.emit * SPRAY_SLOW * 1000 + 200);
    }, 90);
    return () => {
      clearInterval(id);
      clearTimeout(hide);
      clearTimeout(show);
    };
  }, []);

  // Profil ekrandayken sağdaki nota listesi (ve detaydaki kartlar) çekilir.
  useEffect(() => {
    document.documentElement.classList.toggle("is-spraying", !!note && !note.out);
    return () => document.documentElement.classList.remove("is-spraying");
  }, [note]);

  if (!note) return null;
  const f = t.flavor(note.flavor);
  const L = { ...(FAM[t.lang === "en" ? "en" : "tr"]), ...(t.ui.sprayNote ?? {}) };
  const vec = scentProfile(f);
  const acc = Object.entries(vec)
    .filter(([, v]) => v >= 0.12)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const comp = f.composition ?? [];
  // Her katmanda ilk dört nota (satır kısa kalsın).
  const short = (v) => {
    const n = v.split(/,\s*/);
    return n.length > 4 ? `${n.slice(0, 4).join(", ")}…` : v;
  };
  const layers = comp.some((c) => c.includes(": ")) ? comp.map((c) => c.split(": ")).slice(0, 3).map(([k, v]) => [k, short(v)]) : [];
  if (!acc.length && !layers.length) return null;

  return (
    <div key={note.key} className={`spn${note.out ? " is-out" : ""}`} aria-live="polite" onAnimationEnd={(e) => note.out && e.target === e.currentTarget && setNote(null)}>
      <p className="spn__title mono" style={{ "--k": 0 }}>
        {L.title}
      </p>
      {acc.map(([k, v], i) => (
        <div key={k} className="spn__acc" style={{ "--k": i + 1, "--v": v / acc[0][1] }}>
          <span className="spn__accName">{L[k]}</span>
          <i />
        </div>
      ))}
      {layers.map(([k, v], i) => (
        <p key={k} className="spn__line" style={{ "--k": acc.length + 1 + i }}>
          <span className="mono">{k}</span>
          {v}
        </p>
      ))}
    </div>
  );
}
