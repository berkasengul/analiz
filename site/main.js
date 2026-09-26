import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = () => window.innerWidth < 760;

/* ------------------------------------------------------------------ */
/*  Renderer / scene                                                  */
/* ------------------------------------------------------------------ */
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 10);

// Warm key, fiery rim from behind, cool fill for contrast.
scene.add(new THREE.AmbientLight(0xffffff, 0.15));
const key = new THREE.DirectionalLight(0xffe2c4, 1.6);
key.position.set(3, 4, 5);
scene.add(key);
const rim = new THREE.PointLight(0xff5a14, 60, 20);
rim.position.set(-3, 1.5, -2.5);
scene.add(rim);
const rim2 = new THREE.PointLight(0xffb020, 30, 20);
rim2.position.set(3, -2, -2);
scene.add(rim2);
const fill = new THREE.DirectionalLight(0x6d8bff, 0.35);
fill.position.set(-4, -2, 3);
scene.add(fill);

/* ------------------------------------------------------------------ */
/*  Procedural football                                               */
/*  Truncated-icosahedron pattern = spherical Voronoi of the 12       */
/*  icosahedron vertices (pentagons) + 20 face centres (hexagons).    */
/* ------------------------------------------------------------------ */
function panelCentres() {
  const ico = new THREE.IcosahedronGeometry(1, 0);
  const pos = ico.attributes.position;
  const verts = [];
  const faces = [];
  for (let i = 0; i < pos.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i);
    const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
    const c = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
    faces.push(a.clone().add(b).add(c).normalize());
    for (const v of [a, b, c]) {
      if (!verts.some((u) => u.distanceToSquared(v) < 1e-6)) verts.push(v.clone().normalize());
    }
  }
  return [...verts, ...faces]; // 12 + 20
}

const uniforms = {
  uCentres: { value: panelCentres() },
  uHex: { value: new THREE.Color(0xf4eee6) },
  uPent: { value: new THREE.Color(0x1a0a05) },
  uSeam: { value: new THREE.Color(0x0b0706) },
  uGlow: { value: new THREE.Color(0xff5a14) },
  uTime: { value: 0 },
  uEnergy: { value: 0.6 },
};

const ballMat = new THREE.MeshPhysicalMaterial({
  roughness: 0.38,
  metalness: 0.0,
  clearcoat: 0.8,
  clearcoatRoughness: 0.25,
  sheen: 0.4,
  sheenColor: new THREE.Color(0xff8a3d),
});

ballMat.onBeforeCompile = (shader) => {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vObj;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObj = position;");

  shader.fragmentShader = shader.fragmentShader
    .replace(
      "#include <common>",
      `#include <common>
      varying vec3 vObj;
      uniform vec3 uCentres[32];
      uniform vec3 uHex, uPent, uSeam, uGlow;
      uniform float uTime, uEnergy;`
    )
    .replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      vec3 pn = normalize(vObj);
      float d1 = -2.0, d2 = -2.0; int id = 0;
      for (int i = 0; i < 32; i++) {
        float d = dot(pn, uCentres[i]);
        if (d > d1) { d2 = d1; d1 = d; id = i; } else if (d > d2) { d2 = d; }
      }
      float isPent = id < 12 ? 1.0 : 0.0;
      float seam = smoothstep(0.004, 0.018, d1 - d2);
      diffuseColor.rgb = mix(uSeam, mix(uHex, uPent, isPent), seam);`
    )
    .replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>
      roughnessFactor = mix(0.9, roughnessFactor, seam);`
    )
    .replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      float beat = 0.55 + 0.45 * sin(uTime * 3.2 + float(id) * 0.7);
      // Glowing pentagon cores + hot seams, like cracks of fire.
      float core = smoothstep(0.02, 0.09, d1 - d2);
      totalEmissiveRadiance += uGlow * isPent * core * beat * 1.6 * uEnergy;
      totalEmissiveRadiance += uGlow * (1.0 - seam) * 2.2 * uEnergy;`
    );
};

const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), ballMat);

/* ---- glow sprite behind the ball ---- */
function radialTexture(stops) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([o, col]) => grd.addColorStop(o, col));
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: radialTexture([
      [0, "rgba(255,160,60,0.9)"],
      [0.35, "rgba(255,90,20,0.35)"],
      [1, "rgba(255,40,0,0)"],
    ]),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  })
);
glow.scale.setScalar(5.2);
glow.position.z = -0.8;

/* ---- energy rings ---- */
const ringMat = new THREE.MeshBasicMaterial({ color: 0xff7a18, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.012, 16, 200), ringMat);
const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.006, 16, 200), ringMat.clone());
ring2.material.color.set(0xffd23f);
ring2.material.opacity = 0.6;
ring1.rotation.set(1.2, 0.3, 0);
ring2.rotation.set(1.9, -0.5, 0.4);

const hero = new THREE.Group();
hero.add(glow, ball, ring1, ring2);
scene.add(hero);

/* ---- rising embers ---- */
const EMBERS = isMobile() ? 350 : 800;
const eGeo = new THREE.BufferGeometry();
const ePos = new Float32Array(EMBERS * 3);
const eSeed = new Float32Array(EMBERS);
for (let i = 0; i < EMBERS; i++) {
  ePos[i * 3] = (Math.random() - 0.5) * 22;
  ePos[i * 3 + 1] = (Math.random() - 0.5) * 14;
  ePos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
  eSeed[i] = Math.random();
}
eGeo.setAttribute("position", new THREE.BufferAttribute(ePos, 3));
eGeo.setAttribute("aSeed", new THREE.BufferAttribute(eSeed, 1));
const eMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: { uTime: uniforms.uTime, uScroll: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
  vertexShader: /* glsl */ `
    attribute float aSeed;
    uniform float uTime, uScroll, uPR;
    varying float vA; varying float vS;
    void main() {
      vec3 p = position;
      float speed = 0.35 + aSeed * 0.9;
      p.y = mod(p.y + uTime * speed + uScroll * 6.0 + 7.0, 14.0) - 7.0;
      p.x += sin(uTime * 0.8 + aSeed * 40.0) * 0.35;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = (18.0 + aSeed * 38.0) * uPR / -mv.z;
      vA = smoothstep(-7.0, -4.0, p.y) * (1.0 - smoothstep(4.0, 7.0, p.y));
      vS = aSeed;
    }`,
  fragmentShader: /* glsl */ `
    varying float vA; varying float vS;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      vec3 col = mix(vec3(1.0, 0.25, 0.02), vec3(1.0, 0.82, 0.3), vS);
      gl_FragColor = vec4(col, a * vA * 0.9);
    }`,
});
const embers = new THREE.Points(eGeo, eMat);
scene.add(embers);

/* ------------------------------------------------------------------ */
/*  Scroll choreography                                               */
/*  x/y are in "viewport halves": -1 = left edge, 1 = right edge.     */
/* ------------------------------------------------------------------ */
const keyframes = {
  hero:   { x: 0.42, y: 0.0,  s: 1.0,  energy: 0.6, tilt: 0 },
  stats:  { x: -0.5, y: 0.05, s: 0.8,  energy: 0.9, tilt: 0.6 },
  videos: { x: 0.52, y: -0.05, s: 0.75, energy: 0.7, tilt: -0.5 },
  why:    { x: -0.5, y: 0.0,  s: 0.85, energy: 1.0, tilt: 0.4 },
  final:  { x: 0.0,  y: 0.08, s: 1.1,  energy: 1.4, tilt: 0 },
};
const state = { ...keyframes.hero, spin: 0, intro: reduceMotion ? 1 : 0 };

const sections = [...document.querySelectorAll("[data-scene]")];
sections.slice(1).forEach((sec) => {
  const k = keyframes[sec.dataset.scene];
  gsap.to(state, {
    ...k,
    ease: "power2.inOut",
    immediateRender: false,
    scrollTrigger: { trigger: sec, start: "top bottom", end: "top 20%", scrub: 1.2 },
  });
});

ScrollTrigger.create({
  start: 0,
  end: "max",
  onUpdate: (self) => {
    state.spin = self.progress * Math.PI * 6;
    eMat.uniforms.uScroll.value = self.progress;
  },
});

/* ---- mouse parallax ---- */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener("pointermove", (e) => {
  mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
});

/* ------------------------------------------------------------------ */
/*  Render loop                                                       */
/* ------------------------------------------------------------------ */
function visibleHalfExtents(z = 0) {
  const dist = camera.position.z - z;
  const h = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist;
  return { w: h * camera.aspect, h };
}

const clock = new THREE.Clock();
function tick() {
  const t = clock.getElapsedTime();
  uniforms.uTime.value = t;
  uniforms.uEnergy.value = state.energy;

  mouse.x += (mouse.tx - mouse.x) * 0.05;
  mouse.y += (mouse.ty - mouse.y) * 0.05;

  const { w, h } = visibleHalfExtents();
  const mobile = isMobile();
  // On narrow screens the copy fills the width, so the ball sits low and small.
  const baseX = mobile ? state.x * 0.3 * w : state.x * w;
  const baseY = mobile ? -h * 0.5 + state.y * h : state.y * h;
  const scale = state.s * (mobile ? 0.55 : 1) * Math.min(1, h / 3.2);

  hero.position.x = baseX + mouse.x * 0.25;
  hero.position.y = baseY - mouse.y * 0.2 + Math.sin(t * 1.3) * 0.08;
  hero.scale.setScalar(Math.max(0.001, state.intro) * scale * (1 + Math.sin(t * 3.2) * 0.012 * state.energy));

  const idle = reduceMotion ? 0 : t * 0.35;
  ball.rotation.y = idle + state.spin;
  ball.rotation.x = state.tilt + mouse.y * 0.3 + Math.sin(t * 0.5) * 0.1;
  ball.rotation.z = mouse.x * -0.2;

  ring1.rotation.z = t * 0.6;
  ring2.rotation.z = -t * 0.4;
  ring1.rotation.x = 1.2 + state.tilt * 0.5;
  glow.material.opacity = 0.55 + state.energy * 0.35 + Math.sin(t * 3.2) * 0.05;

  rim.intensity = 40 + state.energy * 40;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  ScrollTrigger.refresh();
});

/* ------------------------------------------------------------------ */
/*  DOM animations                                                    */
/* ------------------------------------------------------------------ */
function animateCounters() {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const fmt = (v) => v.toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    if (reduceMotion) { el.textContent = fmt(target); return; }
    const o = { v: 0 };
    gsap.to(o, {
      v: target,
      duration: 2,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
      onUpdate: () => (el.textContent = fmt(o.v)),
    });
  });
}

function animateReveals() {
  if (reduceMotion) return;
  const heroEls = document.querySelectorAll(".hero .reveal");
  gsap.from(heroEls, { yPercent: 110, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, delay: 0.2 });
  gsap.to(state, { intro: 1, duration: 1.8, ease: "elastic.out(1, 0.55)", delay: 0.1 });

  document.querySelectorAll(".panel:not(.hero)").forEach((panel) => {
    gsap.from(panel.querySelectorAll(".reveal"), {
      y: 60,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      stagger: 0.08,
      scrollTrigger: { trigger: panel, start: "top 70%" },
    });
  });
}

/* ------------------------------------------------------------------ */
/*  Boot                                                              */
/* ------------------------------------------------------------------ */
renderer.compile(scene, camera);
tick();
document.getElementById("loader").classList.add("is-done");
animateCounters();
animateReveals();
