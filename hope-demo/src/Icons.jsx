import { BRAND_ICON } from "./data";

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const Flame = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="22" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M12.6 1.5c.4 3.1-1.2 5-2.9 6.9C7.9 10.3 6 12.4 6 15.6 6 19.2 8.7 22 12 22s6-2.6 6-6.3c0-2.4-1.1-4.1-2.4-5.4.1 1.5-.4 2.8-1.6 3.4.5-3.7-.6-7.8-1.4-12.2Zm-.3 12.1c1 1.3 1.9 2.3 1.9 3.8A2.2 2.2 0 0 1 12 19.6a2.2 2.2 0 0 1-2.2-2.3c0-1.5 1.3-2.5 2.5-3.7Z"
    />
  </svg>
);

export const Bolt = () => (
  <svg {...base}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
);

export const Leaf = () => (
  <svg {...base}>
    <path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" />
    <path d="M5 19c3-4 6-7 10-9" />
  </svg>
);

export const Cube = () => (
  <svg {...base}>
    <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z" />
    <path d="M3.5 7 12 11.5 20.5 7M12 11.5v10" />
  </svg>
);

export const HexB = () => (
  <svg {...base}>
    <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z" />
    <path d="M10 8.5h2.6a1.7 1.7 0 0 1 0 3.4H10m0 0h3a1.8 1.8 0 0 1 0 3.6h-3V8.5Z" />
  </svg>
);

export const Close = () => (
  <svg {...base} width="16" height="16">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const Arrow = ({ dir = "right" }) => (
  <svg {...base} width="16" height="16" style={{ transform: dir === "left" ? "scaleX(-1)" : undefined }}>
    <path d="M4 12h16m-6-6 6 6-6 6" />
  </svg>
);

export const Bag = () => (
  <svg {...base} width="18" height="18">
    <path d="M5 8h14l-1 12.5H6L5 8Z" />
    <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
  </svg>
);

export const Plus = () => (
  <svg {...base} width="14" height="14">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Minus = () => (
  <svg {...base} width="14" height="14">
    <path d="M5 12h14" />
  </svg>
);

export const Bean = () => (
  <svg {...base} width="20" height="20">
    <ellipse cx="12" cy="12" rx="6.5" ry="9" transform="rotate(30 12 12)" />
    <path d="M15.5 4.8c-3.5 3-1 6.5-4 9.2-1.6 1.4-3.2 2-4 4" />
  </svg>
);

export const Drop = () => (
  <svg {...base}>
    <path d="M12 3.5s6 6.6 6 10.8a6 6 0 0 1-12 0c0-4.2 6-10.8 6-10.8Z" />
  </svg>
);

export const Cup = () => (
  <svg {...base}>
    <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9Z" />
    <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M3 21h16M9 3c-.8 1 .8 2 0 3M12 3c-.8 1 .8 2 0 3" />
  </svg>
);

export const Pin = () => (
  <svg {...base}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export const Fal = () => (
  <svg {...base}>
    <path d="M7 5h10l-1.5 9h-7L7 5Z" />
    <path d="M4 17h16M9 20h6M12 1.5v1.5M4.5 4l1 1M19.5 4l-1 1" />
  </svg>
);

export const Star = () => (
  <svg {...base}>
    <path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7L12 3Z" />
  </svg>
);

// Parfüm şişesi: marka simgesi.
export const Bottle = () => (
  <svg {...base}>
    <path d="M9.5 2.5h5v3.5h-5zM10.5 6v1.8M13.5 6v1.8" />
    <rect x="5.5" y="8" width="13" height="13.5" rx="3" />
    <path d="M12 11.5c-1.6 0-2.5 1.2-2.5 2.6 0 1.8 2.5 3.6 2.5 3.6s2.5-1.8 2.5-3.6c0-1.4-.9-2.6-2.5-2.6Z" />
  </svg>
);

// Markanın simgesi content.json → icon ile seçilir.
export const BrandIcon = (props) => (BRAND_ICON === "leaf" ? <LeafMark {...props} /> : <Bottle {...props} />);

// Zeytin dalı simgesi.
export const LeafMark = () => (
  <svg {...base}>
    <path d="M5 20c4-4 8-9 13-16" />
    <path d="M9.5 15.5c-3 .2-4.8-1.3-5-3.6 2.8-.3 4.6.9 5 3.6ZM12.8 11.3c.2-3 2-4.6 4.3-4.6.1 2.8-1.3 4.5-4.3 4.6ZM14.8 8.6c-2.6-.8-3.5-2.6-3-4.6 2.6.6 3.6 2.4 3 4.6Z" />
  </svg>
);

export const featureIcons = { star: Star, bottle: Bottle,  bolt: Bolt, leaf: Leaf, cube: Cube, hex: HexB, bean: Bean, drop: Drop, cup: Cup, pin: Pin, fal: Fal };
