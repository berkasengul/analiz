// On tat, halkadaki sırasıyla. `ink`, kutu üzerindeki yazıların rengi.
export const flavors = [
  {
    name: "Chrome",
    color: "#8e9399",
    ink: "#141416",
    tagline: "Polished, never quiet.",
    notes: ["Citrus peel", "Ginseng"],
    description: "Our original. Bright citrus over a clean ginseng backbone, finished cold and dry.",
  },
  {
    name: "Cherry",
    color: "#c0121f",
    ink: "#fff4f4",
    tagline: "Heat, bottled.",
    notes: ["Black cherry", "Pink pepper"],
    description: "Dark cherry with a flicker of pink pepper. Sweet up front, warm on the way down.",
  },
  {
    name: "Lime",
    color: "#6a9418",
    ink: "#0f1504",
    tagline: "Sharp, electric.",
    notes: ["Key lime", "Yuzu"],
    description: "Key lime cut with yuzu for a sour snap that wakes up every part of your tongue.",
  },
  {
    name: "Ice",
    color: "#1fb4e4",
    ink: "#04161d",
    tagline: "Voltage, sub-zero.",
    notes: ["Glacier mint", "Blue raspberry"],
    description: "Glacier mint and blue raspberry. The coldest can in the lineup, even at room temperature.",
  },
  {
    name: "Night",
    color: "#1c1838",
    ink: "#c9c6de",
    tagline: "After hours, still on.",
    notes: ["Blackcurrant", "Concord grape"],
    description: "Blackcurrant and concord grape, deep and a little tart. Built for the late shift.",
  },
  {
    name: "Mango",
    color: "#f06510",
    ink: "#1f0b01",
    tagline: "Sunrise, carbonated.",
    notes: ["Alphonso mango", "Blood orange"],
    description: "Alphonso mango brightened with blood orange. Thick, juicy, and loud.",
  },
  {
    name: "Wave",
    color: "#1b2ea6",
    ink: "#d5dbff",
    tagline: "Tidal, tart.",
    notes: ["Blueberry", "Sea salt"],
    description: "Wild blueberry with a pinch of sea salt, so it tastes like the last swim of summer.",
  },
  {
    name: "Gold",
    color: "#a8760f",
    ink: "#1a1203",
    tagline: "Honeyed, high voltage.",
    notes: ["Pineapple", "Wildflower honey"],
    description: "Roasted pineapple and a drop of wildflower honey. Rich, without the sugar.",
  },
  {
    name: "Pitaya",
    color: "#df1476",
    ink: "#fff1f7",
    tagline: "Neon, after dark.",
    notes: ["Dragon fruit", "Lychee", "Rose"],
    description: "Dragon fruit and lychee, lifted by a soft rose-petal finish.",
  },
  {
    name: "Onyx",
    color: "#121214",
    ink: "#76767e",
    tagline: "Blackout, full charge.",
    notes: ["Black grape", "Acai"],
    description: "Black grape and acai in a matte-black can. The boldest-tasting of the ten.",
  },
];

export const specs = "Zero sugar — 160 mg caffeine";

// Detay görünümündeki özellik hikâyeleri. `pose`, kutunun o özellikte
// nasıl duracağı: rotY = arka etiketi göstermek için döndürme.
export const features = [
  {
    icon: "bolt",
    short: "Clean energy",
    kicker: "No",
    struck: "Sugar crash",
    title: "Clean energy",
    text: "160 mg of caffeine from green coffee beans and guarana. It builds over twenty minutes and holds for hours, instead of spiking and dropping you.",
    pose: { rotY: 0.12, y: -1.5, scale: 3.1 },
  },
  {
    icon: "leaf",
    short: "Natural flavours",
    kicker: "No",
    struck: "Artificial flavours",
    title: "Natural flavours",
    text: "Every flavour is built from fruit juice concentrate and botanical extracts. The ingredient list on the back is short enough to read in one breath.",
    pose: { rotY: Math.PI + 0.1, y: 1.3, scale: 3.0 },
  },
  {
    icon: "cube",
    short: "Zero sugar",
    kicker: "Zero",
    struck: "Added sugar",
    title: "Zero sugar",
    text: "Sweetened with stevia and the fruit itself. Under half a gram of sugar per can, so the lift arrives without a comedown.",
    pose: { rotY: Math.PI - 0.05, y: -0.3, scale: 2.5 },
  },
  {
    icon: "hex",
    short: "B-vitamin complex",
    kicker: "Plus",
    struck: "Empty calories",
    title: "Vitamin B complex",
    text: "B2, B3, B6 and B12 at 100% of your daily value. They help your body turn food into energy, which is the whole point.",
    pose: { rotY: Math.PI - 0.25, y: -1.2, scale: 3.4 },
  },
];

// Ritual bölümündeki adımlar. Kutu her adımda farklı bir poza geçer.
export const ritual = [
  {
    title: "Chill",
    flavor: 3,
    text: "Fridge-cold, 4 °C. The colder the can, the sharper the first sip.",
    stat: "4 °C",
  },
  {
    title: "Crack",
    flavor: 1,
    text: "Wait for the hiss. Pour it over ice, or drink it straight from the can.",
    stat: "220 ml",
  },
  {
    title: "Ignite",
    flavor: 5,
    text: "Twenty minutes later it kicks in, and it stays with you through the afternoon.",
    stat: "160 mg",
  },
];

export const packs = [
  { size: 6, price: 15.9, label: "Try it" },
  { size: 12, price: 28.9, label: "Most popular" },
  { size: 24, price: 52.9, label: "Best value" },
];

export const SUB_DISCOUNT = 0.15;
export const FREE_SHIPPING = 40;
export const SHIPPING = 4.9;
export const VARIETY = "variety";
export const DEFAULT_SHOP_FLAVOR = 5; // Mango

export const stockists = [
  ["Istanbul", "Kadıköy, Beşiktaş, Karaköy", 128],
  ["Berlin", "Kreuzberg, Neukölln, Mitte", 94],
  ["London", "Shoreditch, Peckham, Soho", 86],
  ["Paris", "Le Marais, Belleville, Pigalle", 77],
  ["Barcelona", "El Born, Gràcia, Poblenou", 52],
  ["Amsterdam", "De Pijp, Jordaan, Noord", 41],
];

export const faqs = [
  [
    "How much caffeine is in a can?",
    "160 mg in a 220 ml can, roughly the same as a large filter coffee. We don't recommend more than two cans a day.",
  ],
  [
    "What is it sweetened with?",
    "Stevia leaf extract and the fruit juice in each flavour. There is no added sugar and no aspartame or sucralose.",
  ],
  [
    "Who shouldn't drink Blazing?",
    "It's high in caffeine, so it isn't suitable for children, or for anyone pregnant or breastfeeding.",
  ],
  [
    "How fast do you ship?",
    "Orders placed before 2 pm ship the same day and arrive in 1–3 working days across the EU. Shipping is free over €40.",
  ],
  [
    "How does the subscription work?",
    "You save 15% and a new box ships every four weeks. You can skip, change flavours or cancel up to two days before it ships.",
  ],
  ["Is it vegan?", "Yes. All ten flavours are vegan and gluten-free."],
];

export function flavorName(id) {
  return id === VARIETY ? "Variety" : flavors[id].name;
}

export function packPrice(size, plan) {
  const pack = packs.find((p) => p.size === size);
  return pack.price * (plan === "sub" ? 1 - SUB_DISCOUNT : 1);
}

const fmt = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
export const money = (n) => fmt.format(n);
