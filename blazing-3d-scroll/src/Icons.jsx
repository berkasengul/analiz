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

export const featureIcons = { bolt: Bolt, leaf: Leaf, cube: Cube, hex: HexB };
