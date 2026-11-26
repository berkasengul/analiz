// Bold Istanbul · scroll-driven opening: bag → tear → open → scoop → grains swirl into the can → cold → ready.
// Every visual is a pure function of the scroll progress p (0..1), so scrubbing works both ways.
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (p, a, b) => clamp((p - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// step boundaries (shared with the page text)
export const STEPS = [0, 0.13, 0.28, 0.42, 0.6, 0.8, 0.92, 1];

// ---------- bag geometry ----------
const BAG = { W: 1.0, H: 2.4, D: 0.2, seal: 0.1 };
function bagHalfDepth(y, open) {
  const { H, D, seal } = BAG;
  const top = H - seal;
  // pillow taper towards the sealed top
  const taper = 1 - smooth(clamp((y - (top - 0.55)) / 0.55));
  let b = D * (0.12 + 0.88 * taper);
  if (y > top) b = 0.012;
  // open mouth
  const m = smooth(clamp((y - (top - 0.75)) / 0.75)) * open;
  b = lerp(b, 0.23 + 0.03 * Math.sin(Math.PI * clamp((y - (top - 0.75)) / 0.75)), m);
  if (y < 0.05) b *= 0.9 + 2 * y;
  return b;
}
function bagHalfWidth(y, open) {
  const top = BAG.H - BAG.seal;
  const m = smooth(clamp((y - (top - 0.6)) / 0.6)) * open;
  return (BAG.W / 2) * (1 - 0.1 * m);
}
// superellipse cross section, side = +1 front / -1 back
function bagPoint(u, y, side, open, out) {
  const n = 5;
  const phi = (u - 0.5) * Math.PI; // -pi/2..pi/2 across the panel
  const c = Math.sin(phi), s = Math.cos(phi);
  const a = bagHalfWidth(y, open), b = bagHalfDepth(y, open);
  const x = a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
  const z = b * Math.pow(Math.abs(s), 2 / n);
  const top = BAG.H - BAG.seal;
  const m = smooth(clamp((y - (top - 0.35)) / 0.35)) * open;
  const wave = m * (0.018 * Math.sin(phi * 5.0 + side) + 0.012 * Math.sin(phi * 11.0));
  out.set(x * side, y + m * 0.03 * Math.cos(phi * 2.0), (z + wave) * side);
  return out;
}
function makeBagPanel(side, segU = 48, segV = 96) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array((segU + 1) * (segV + 1) * 3);
  const uv = new Float32Array((segU + 1) * (segV + 1) * 2);
  const idx = [];
  const tmp = new THREE.Vector3();
  for (let j = 0; j <= segV; j++)
    for (let i = 0; i <= segU; i++) {
      const k = j * (segU + 1) + i;
      bagPoint(i / segU, BAG.H * 0.5, side, 0, tmp);
      uv[k * 2] = clamp(side > 0 ? 0.5 + tmp.x / BAG.W : 0.5 - tmp.x / BAG.W);
      uv[k * 2 + 1] = j / segV;
    }
  for (let j = 0; j < segV; j++)
    for (let i = 0; i < segU; i++) {
      const a = j * (segU + 1) + i, b = a + 1, c = a + segU + 1, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  g.setIndex(idx);
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.userData = { segU, segV, side, top: 1 };
  return g;
}
const _p = new THREE.Vector3();
function updateBagPanel(g, open, topFrac) {
  const { segU, segV, side } = g.userData;
  const pos = g.attributes.position.array;
  const yMax = BAG.H * topFrac;
  for (let j = 0; j <= segV; j++) {
    const y = (j / segV) * yMax;
    for (let i = 0; i <= segU; i++) {
      bagPoint(i / segU, y, side, open, _p);
      const k = (j * (segU + 1) + i) * 3;
      pos[k] = _p.x; pos[k + 1] = _p.y; pos[k + 2] = _p.z;
    }
  }
  // uv v follows the visible height so the label stays put when the strip is torn
  const uv = g.attributes.uv.array;
  for (let j = 0; j <= segV; j++) for (let i = 0; i <= segU; i++) uv[(j * (segU + 1) + i) * 2 + 1] = (j / segV) * topFrac;
  g.attributes.uv.needsUpdate = true;
  g.attributes.position.needsUpdate = true;
  g.computeVertexNormals();
}

// ---------- can (lathe halves from the real silhouette, projected label like the main site) ----------
function makeCan(rows, axis, tex, height) {
  const valid = rows.map((r, i) => [r, (i + 0.5) / rows.length]).filter(([r]) => r > 0);
  const vTop = valid[0][1], vBot = valid[valid.length - 1][1];
  const k = height / (vBot - vTop);
  const mats = [];
  const group = new THREE.Group();
  const seg = 48;
  for (const back of [false, true]) {
    const pos = [], uv = [], idx = [];
    valid.forEach(([r, v], j) => {
      for (let i = 0; i <= seg; i++) {
        const th = -Math.PI / 2 + (i / seg) * Math.PI;
        const A = Math.sin(th) * r * (back ? -1 : 1);
        const P = Math.cos(th) * r;
        pos.push(A * k, (vBot - v) * k, (back ? -P : P) * k);
        const z = axis + A * 0.97;
        uv.push(back ? 0.5 + 0.5 * (1 - z) : 0.5 * z, 1 - v);
      }
    });
    for (let j = 0; j < valid.length - 1; j++)
      for (let i = 0; i < seg; i++) {
        const a = j * (seg + 1) + i, b = a + 1, c = a + seg + 1, d = c + 1;
        back ? idx.push(a, c, b, b, c, d) : idx.push(a, b, c, b, d, c);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({
      map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.5,
      color: 0x8a8a8a, roughness: 0.28, metalness: 0.15, transparent: true, side: THREE.DoubleSide,
    });
    dissolve(m);
    mats.push(m);
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = true;
    group.add(mesh);
  }
  // lid
  const rTop = valid[2][0] * k * 0.92;
  const lid = new THREE.Mesh(
    new THREE.CircleGeometry(rTop, 48),
    new THREE.MeshStandardMaterial({ color: 0xc9ccd2, metalness: 1, roughness: 0.25, transparent: true }),
  );
  lid.rotation.x = -Math.PI / 2;
  lid.position.y = height - 0.004;
  dissolve(lid.material);
  mats.push(lid.material);
  group.add(lid);
  const radius = Math.max(...valid.map(([r]) => r)) * k;
  return { group, mats, radius, height };
}
// noise dissolve: uniform uReveal 0..1
function dissolve(m) {
  m.userData.reveal = { value: 0 };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uReveal = m.userData.reveal;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWp;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWp = (modelMatrix * vec4(transformed,1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
         varying vec3 vWp; uniform float uReveal;
         float h3(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
         float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
           return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
                      mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }`,
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
         float nn = n3(vWp*18.0)*0.6 + n3(vWp*5.0)*0.4;
         float edge = uReveal*1.25 - 0.12;
         if (nn > edge) discard;
         float glow = smoothstep(edge-0.06, edge, nn);
         gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.85,0.55,0.25), glow*0.9);`,
      );
  };
}

// ---------- textures ----------
function coffeeTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d");
  x.fillStyle = "#2a1a10";
  x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26000; i++) {
    const l = 18 + Math.random() * 42;
    x.fillStyle = `hsl(${22 + Math.random() * 10},${35 + Math.random() * 20}%,${l * 0.55}%)`;
    const s = Math.random() * 2.2 + 0.6;
    x.fillRect(Math.random() * 512, Math.random() * 512, s, s);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function softSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
function makeEnv(renderer) {
  // small studio: dark room + soft boxes (stand-in for RoomEnvironment)
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x1a2238);
  const box = (w, h, x, y, z, c, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  box(6, 3, 0, 6, 4, 0xfff1dc, 3.2);
  box(3, 6, -6, 2, 1, 0xffffff, 1.6);
  box(3, 6, 6, 1, -2, 0xbfd3ff, 1.4);
  box(8, 1, 0, -4, 3, 0xe8c79a, 0.8);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.04);
  pm.dispose();
  return rt.texture;
}

function makeSpoon(envMap, coffeeTex) {
  // a classic polished silver teaspoon: thick elliptical bowl, flat tapering handle, teardrop finial
  const outer = new THREE.Group();
  const rig = new THREE.Group();
  rig.rotation.order = "YXZ";
  outer.add(rig);
  const silver = new THREE.MeshPhysicalMaterial({
    color: 0xe3e1dc, metalness: 1, roughness: 0.13, clearcoat: 0.5, clearcoatRoughness: 0.08, envMap, envMapIntensity: 1.6,
  });
  // bowl: lathe of a shallow cup with real wall thickness, squeezed into an ellipse
  const prof = [];
  const N = 18;
  for (let i = 0; i <= N; i++) { const t = i / N; prof.push(new THREE.Vector2(t, -0.36 * (1 - t * t) + 0.02)); } // inner surface
  prof.push(new THREE.Vector2(1.04, 0.03), new THREE.Vector2(1.06, 0.0));
  for (let i = N; i >= 0; i--) { const t = i / N; prof.push(new THREE.Vector2(t * 1.06, -0.42 * (1 - t * t) - 0.02)); } // outer
  const bowlGeo = new THREE.LatheGeometry(prof.reverse(), 64);
  bowlGeo.scale(0.085, 0.13, 0.125);
  const bowl = new THREE.Mesh(bowlGeo, silver);
  bowl.material.side = THREE.DoubleSide;
  rig.add(bowl);
  // handle: flat tapered outline, bevelled, bent upward from the neck
  const sh = new THREE.Shape();
  const half = (z) => {
    // z from 0 (neck) to 1 (tip): narrow neck, slim shaft, teardrop finial
    const neck = 0.012 + 0.01 * Math.exp(-z * 30);
    const shaft = 0.012 + 0.008 * z;
    const fin = 0.036 * Math.exp(-Math.pow((z - 0.88) / 0.08, 2));
    const w = Math.max(neck, shaft) + fin;
    return w * Math.sqrt(clamp((1 - z) / 0.07)) + 0.0005;
  };
  const L = 0.78, steps = 60;
  for (let i = 0; i <= steps; i++) { const z = i / steps; sh.lineTo(half(z), z * L); }
  for (let i = steps; i >= 0; i--) { const z = i / steps; sh.lineTo(-half(z), z * L); }
  const hGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 3, curveSegments: 4, steps: 1 });
  // shape is in XY, extrude along Z -> lay it flat (XZ), handle along -z
  hGeo.rotateX(Math.PI / 2);
  hGeo.rotateY(Math.PI);
  const hp = hGeo.attributes.position;
  for (let i = 0; i < hp.count; i++) {
    const z = -hp.getZ(i); // 0..L along the handle
    const t = z / L;
    hp.setY(i, hp.getY(i) + 0.03 * smooth(clamp(t / 0.25)) + 0.045 * t * t);
    hp.setZ(i, hp.getZ(i) - 0.1);
  }
  hGeo.computeVertexNormals();
  const handle = new THREE.Mesh(hGeo, silver);
  handle.position.y = 0.012;
  rig.add(handle);
  // a little engraved band at the neck
  // heap of coffee in the bowl
  const heap = new THREE.Mesh(
    new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: coffeeTex, roughness: 0.95, color: 0xffffff }),
  );
  heap.scale.set(0.075, 0.045, 0.11);
  heap.position.y = 0.0;
  rig.add(heap);
  rig.traverse((o) => o.isMesh && (o.castShadow = true));
  rig.scale.setScalar(1.18);
  return { group: outer, rig, heap };
}

// ---------- studio: same language as the hero (ogee arch, fluted marble plinth, blue haze, bokeh) ----------
function marbleTexture() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 512;
  const x = c.getContext("2d");
  x.fillStyle = "#f1eee9"; x.fillRect(0, 0, 1024, 512);
  x.globalAlpha = 0.5;
  for (let k = 0; k < 26; k++) {
    x.strokeStyle = `rgba(${150 + Math.random() * 40},${150 + Math.random() * 30},${150 + Math.random() * 30},${0.25 + Math.random() * 0.35})`;
    x.lineWidth = 0.6 + Math.random() * 2.2;
    x.beginPath();
    let px = Math.random() * 1024, py = Math.random() * 512;
    x.moveTo(px, py);
    for (let i = 0; i < 14; i++) { px += (Math.random() - 0.3) * 120; py += (Math.random() - 0.5) * 80; x.lineTo(px, py); }
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function glowTexture(inner, outer) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
function shaftTexture() {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 256;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 64, 0);
  g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 256);
  const v = x.createLinearGradient(0, 0, 0, 256);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(0.25, "rgba(0,0,0,1)"); v.addColorStop(1, "rgba(0,0,0,0.0)");
  x.globalCompositeOperation = "destination-in"; x.fillStyle = v; x.fillRect(0, 0, 64, 256);
  return new THREE.CanvasTexture(c);
}
function makeStudio(envMap, center) {
  const g = new THREE.Group();
  const silver = new THREE.MeshStandardMaterial({ color: 0xc9d2e8, metalness: 1, roughness: 0.3, envMap, envMapIntensity: 0.9, emissive: 0x1c2550, emissiveIntensity: 0.25, fog: true });
  // pointed (ogee) arch outline
  const archPts = (w, h, spring) => {
    const pts = [];
    for (let i = 0; i <= 10; i++) pts.push(V(-w, (i / 10) * spring, 0));
    for (let i = 1; i <= 40; i++) {
      const t = i / 40;
      const ang = Math.PI - t * (Math.PI / 2 - 0.0);
      const x = -w + w * (1 - Math.cos((t * Math.PI) / 2)) ;
      const y = spring + (h - spring) * Math.sin((t * Math.PI) / 2) ** 1.4;
      pts.push(V(x * (1 - 0.0 * ang), y, 0));
    }
    const right = pts.slice(0, -1).reverse().map((p) => V(-p.x, p.y, 0));
    return pts.concat(right);
  };
  const W = 2.05, Hh = 5.6, SP = 3.5;
  for (const [s, r] of [[1, 0.014], [0.92, 0.009]]) {
    const pts = archPts(W * s, Hh - (1 - s) * 0.5, SP);
    const curve = new THREE.CatmullRomCurve3(pts);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 240, r, 8, false), silver));
  }
  // eight-point stars between the two lines
  const star = new THREE.Shape();
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, rr = i % 2 ? 0.018 : 0.04; i ? star.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : star.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  const starGeo = new THREE.ExtrudeGeometry(star, { depth: 0.008, bevelEnabled: false });
  const midCurve = new THREE.CatmullRomCurve3(archPts(W * 0.96, Hh - 0.2, SP));
  const n = 58;
  const stars = new THREE.InstancedMesh(starGeo, silver, n);
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { const p = midCurve.getPointAt((i + 0.5) / n); m.makeTranslation(p.x, p.y, 0); stars.setMatrixAt(i, m); }
  g.add(stars);
  // crescent finial
  const cres = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 10, 40, Math.PI * 1.35), silver);
  cres.position.set(0, Hh + 0.22, 0);
  cres.rotation.z = Math.PI * 0.82;
  g.add(cres);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 8), silver);
  rod.position.set(0, Hh + 0.06, 0);
  g.add(rod);
  // blue haze inside the arch + light shaft
  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 7.0),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(120,150,235,0.75)", "rgba(30,45,110,0)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  haze.position.set(0, 2.8, -0.05);
  g.add(haze);
  const shaft = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 6.5),
    new THREE.MeshBasicMaterial({ map: shaftTexture(), color: 0xbfd0ff, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  shaft.position.set(0, 3.4, 0.0);
  g.add(shaft);
  g.position.set(center.x, -0.3, center.z - 2.9);

  // fluted marble plinth (top at y = 0)
  const plinth = new THREE.Group();
  const R = 1.28, Hp = 0.95;
  const col = new THREE.CylinderGeometry(R, R, Hp, 144, 1, true);
  const cp = col.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const x = cp.getX(i), z = cp.getZ(i), a = Math.atan2(z, x);
    const k = 1 - 0.02 * Math.pow(Math.abs(Math.cos(a * 16)), 0.6);
    cp.setX(i, x * k); cp.setZ(i, z * k);
  }
  col.computeVertexNormals();
  const marble = new THREE.MeshStandardMaterial({ map: marbleTexture(), color: 0xc9ccd6, roughness: 0.42, metalness: 0.0, envMap, envMapIntensity: 0.45 });
  const colM = new THREE.Mesh(col, marble);
  colM.position.y = -Hp / 2 - 0.08;
  colM.receiveShadow = true;
  plinth.add(colM);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.07, R + 0.07, 0.08, 96), marble);
  top.position.y = -0.04;
  top.receiveShadow = true;
  plinth.add(top);
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8b26e, metalness: 1, roughness: 0.25, envMap, envMapIntensity: 1.4 });
  const navy = new THREE.MeshStandardMaterial({ color: 0x1d2d63, metalness: 0.3, roughness: 0.4, envMap });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(R + 0.07, 0.012, 10, 120), gold);
  ring1.rotation.x = Math.PI / 2; ring1.position.y = -0.002;
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(R - 0.12, 0.016, 10, 120), navy);
  ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.002;
  const ring3 = new THREE.Mesh(new THREE.TorusGeometry(R + 0.075, 0.012, 10, 120), gold);
  ring3.rotation.x = Math.PI / 2; ring3.position.y = -0.08;
  plinth.add(ring1, ring2, ring3);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.55, R + 0.62, 0.14, 96), marble);
  base.position.y = -Hp - 0.15;
  base.receiveShadow = true;
  plinth.add(base);
  const ring4 = new THREE.Mesh(new THREE.TorusGeometry(R + 0.56, 0.014, 10, 140), gold);
  ring4.rotation.x = Math.PI / 2; ring4.position.y = -Hp - 0.08;
  plinth.add(ring4);
  plinth.position.set(center.x, 0, center.z);
  const plinthMats = [];
  plinth.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; plinthMats.push(o.material); } });

  // floor glow
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(5, 64),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(150,175,255,0.35)", "rgba(20,30,70,0)"), transparent: true, depthWrite: false }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(center.x, -Hp - 0.22, center.z);

  // bokeh
  const bokehTex = glowTexture("rgba(210,225,255,0.9)", "rgba(210,225,255,0)");
  const bokeh = new THREE.Group();
  for (let i = 0; i < 38; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bokehTex, transparent: true, depthWrite: false, opacity: 0.08 + Math.random() * 0.16, blending: THREE.AdditiveBlending }));
    const sc = 0.12 + Math.random() * 0.45;
    s.scale.set(sc, sc, 1);
    s.userData = { x: center.x + (Math.random() - 0.5) * 9, y: -0.5 + Math.random() * 5.5, z: center.z - 2.5 - Math.random() * 3, sp: 0.05 + Math.random() * 0.12, ph: Math.random() * 6 };
    bokeh.add(s);
  }
  // slim fluted pedestal for the finale (same language as the hero shot)
  const ped = new THREE.Group();
  const PR = 0.5, PH = 1.7;
  const pc = new THREE.CylinderGeometry(PR, PR * 1.03, PH, 120, 1, true);
  const pp = pc.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    const x = pp.getX(i), z = pp.getZ(i), a = Math.atan2(z, x);
    const k = 1 - 0.035 * Math.pow(Math.abs(Math.cos(a * 11)), 0.7);
    pp.setX(i, x * k); pp.setZ(i, z * k);
  }
  pc.computeVertexNormals();
  const pm = new THREE.Mesh(pc, marble);
  pm.position.y = -PH / 2 - 0.07;
  pm.receiveShadow = true;
  ped.add(pm);
  const ptop = new THREE.Mesh(new THREE.CylinderGeometry(PR + 0.07, PR + 0.07, 0.07, 96), marble);
  ptop.position.y = -0.035;
  ptop.receiveShadow = true;
  ped.add(ptop);
  const pr1 = new THREE.Mesh(new THREE.TorusGeometry(PR + 0.07, 0.01, 10, 96), gold);
  pr1.rotation.x = Math.PI / 2; pr1.position.y = -0.002;
  const pr2 = new THREE.Mesh(new THREE.TorusGeometry(PR - 0.06, 0.012, 10, 96), navy);
  pr2.rotation.x = Math.PI / 2; pr2.position.y = 0.002;
  const pr3 = new THREE.Mesh(new THREE.TorusGeometry(PR + 0.072, 0.01, 10, 96), gold);
  pr3.rotation.x = Math.PI / 2; pr3.position.y = -0.07;
  ped.add(pr1, pr2, pr3);
  const pbase = new THREE.Mesh(new THREE.CylinderGeometry(PR + 0.26, PR + 0.32, 0.13, 96), marble);
  pbase.position.y = -PH - 0.13;
  ped.add(pbase);
  const pglow = new THREE.Mesh(
    new THREE.CircleGeometry(PR + 0.4, 48),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(190,210,255,0.9)", "rgba(120,150,255,0)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
  );
  pglow.rotation.x = -Math.PI / 2;
  pglow.position.y = 0.01;
  ped.add(pglow);
  ped.visible = false;
  return { arch: g, plinth, floor, bokeh, haze, shaft, ped, pglow, plinthMats };
}

// ---------- particles: coffee grains that swirl into the can ----------
function makeGrains(count, canPos, canR, canH) {
  const g = new THREE.BufferGeometry();
  const target = new Float32Array(count * 3), seed = new Float32Array(count * 4), col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const th = Math.random() * Math.PI * 2, y = Math.random() * canH * 0.96 + canH * 0.02;
    target[i * 3] = Math.cos(th);
    target[i * 3 + 1] = y;
    target[i * 3 + 2] = Math.sin(th);
    seed.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    const l = 0.12 + Math.random() * 0.22;
    col.set([l * 1.25, l * 0.82, l * 0.55], i * 3);
  }
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute("target", new THREE.BufferAttribute(target, 3));
  g.setAttribute("seed", new THREE.BufferAttribute(seed, 4));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uT: { value: 0 }, uFade: { value: 1 }, uTip: { value: V(0, 0, 0) },
      uCan: { value: canPos.clone() }, uR: { value: canR }, uScale: { value: 1 },
    },
    vertexShader: `
      attribute vec3 target; attribute vec4 seed; attribute vec3 color;
      uniform float uT, uFade, uR, uScale; uniform vec3 uTip, uCan;
      varying vec3 vC; varying float vA;
      void main(){
        float rel = seed.x * 0.5;
        float l = clamp((uT - rel) / 0.5, 0.0, 1.0);
        float a = clamp(l / 0.4, 0.0, 1.0);
        float b = clamp((l - 0.4) / 0.6, 0.0, 1.0);
        b = b*b*(3.0-2.0*b);
        // entry point of the vortex
        float ang0 = seed.y * 6.2831;
        float R0 = uR * (2.2 + seed.z * 1.2);
        float yE = target.y * 0.7 + uCan.y + 0.35;
        vec3 E = uCan + vec3(cos(ang0) * R0, yE - uCan.y, sin(ang0) * R0);
        // fall from the spoon tip (parabola)
        vec3 jitter = (seed.wzy - 0.5) * 0.06;
        vec3 A = mix(uTip + jitter, E, a) + vec3(0.0, sin(a * 3.14159) * 0.25, 0.0);
        // spiral onto the can surface
        float angT = atan(target.z, target.x);
        float ang = mix(ang0 + 9.0 + seed.w * 3.0, angT, b);
        float r = mix(R0, uR * 1.01, b);
        vec3 B = uCan + vec3(cos(ang) * r, mix(yE - uCan.y, target.y, b), sin(ang) * r);
        vec3 p = l < 0.4 ? A : B;
        if (l <= 0.0) p = uTip + jitter * 0.3;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float vis = step(0.0001, l) * uFade;
        gl_PointSize = (2.0 + seed.z * 2.6) * uScale * vis / -mv.z * 3.0;
        vC = color; vA = vis;
      }`,
    fragmentShader: `
      varying vec3 vC; varying float vA;
      void main(){ vec2 d = gl_PointCoord - 0.5; if (dot(d,d) > 0.25) discard; gl_FragColor = vec4(vC, vA); }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  return pts;
}

export async function mount(el, { canTexture, rows, axis, onReady, onInspect }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  let env = makeEnv(renderer);
  try {
    const hdr = await new RGBELoader().loadAsync(new URL("../../assets/potsdamer_platz_0.256k-Nbnl77fg.hdr", import.meta.url).href);
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(renderer);
    env = pm.fromEquirectangular(hdr).texture;
    pm.dispose();
    hdr.dispose();
  } catch (e) {}
  scene.environment = env;
  scene.fog = new THREE.Fog(0x0c1530, 7, 16);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);

  scene.add(new THREE.HemisphereLight(0xe9efff, 0x1b2550, 0.75));
  const key = new THREE.DirectionalLight(0xfff0dc, 2.1);
  key.position.set(-2.5, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -3, right: 4, top: 4, bottom: -1, near: 0.5, far: 15 });
  key.shadow.radius = 6;
  key.shadow.bias = -0.0005;
  key.shadow.camera.bottom = -3.4;
  key.shadow.camera.top = 3.5;
  key.shadow.camera.updateProjectionMatrix();
  scene.add(key);
  const sweep = new THREE.SpotLight(0xfff3e0, 0, 6, 0.32, 0.6, 1.2);
  scene.add(sweep, sweep.target);
  const rim = new THREE.DirectionalLight(0x9fb9ff, 1.8);
  rim.position.set(3, 3, -4);
  scene.add(rim);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.3, 64), new THREE.ShadowMaterial({ opacity: 0.32 }));
  floor.position.set(0.42, 0.001, 0.42);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const studio = makeStudio(env, V(0.42, 0, 0.42));
  scene.add(studio.arch, studio.plinth, studio.floor, studio.bokeh, studio.ped);
  const ARCH0 = studio.arch.position.clone();
  const FLOOR0 = studio.floor.position.y;
  const plinthMats = studio.plinthMats;
  let finale = 0;

  const loader = new THREE.TextureLoader();
  const load = (u) =>
    new Promise((res) =>
      loader.load(u, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        res(t);
      }),
    );
  const base = new URL("./", import.meta.url).href;
  const [front, back, canTex] = await Promise.all([load(base + "bag-front.webp"), load(base + "bag-back.webp"), load(canTexture)]);
  const coffee = coffeeTexture();

  // bag
  const bag = new THREE.Group();
  const bagMat = (map) => {
    const m = new THREE.MeshStandardMaterial({ map, roughness: 0.38, metalness: 0.05, side: THREE.DoubleSide, envMapIntensity: 0.7 });
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace(
        "#include <map_fragment>",
        "#include <map_fragment>\n if(!gl_FrontFacing){ diffuseColor.rgb = vec3(0.74,0.75,0.78); }",
      );
    };
    m.transparent = true;
    bagMats.push(m);
    return m;
  };
  const gF = makeBagPanel(1), gB = makeBagPanel(-1);
  const bagMats = [];
  const mF = new THREE.Mesh(gF, bagMat(front)), mB = new THREE.Mesh(gB, bagMat(back));
  mF.castShadow = mB.castShadow = true;
  bag.add(mF, mB);
  // bottom cap
  const capShape = new THREE.Shape();
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    const x = 0.5 * Math.sign(c) * Math.pow(Math.abs(c), 0.4), z = 0.18 * Math.sign(s) * Math.pow(Math.abs(s), 0.4);
    i ? capShape.lineTo(x, z) : capShape.moveTo(x, z);
  }
  const cap = new THREE.Mesh(new THREE.ShapeGeometry(capShape), new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.5 }));
  cap.rotation.x = Math.PI / 2;
  cap.position.y = 0.002;
  bag.add(cap);
  // coffee surface inside
  const fillY = BAG.H * 0.8;
  const fillShape = new THREE.Shape();
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    const x = 0.47 * Math.sign(c) * Math.pow(Math.abs(c), 0.4), z = 0.19 * Math.sign(s) * Math.pow(Math.abs(s), 0.4);
    i ? fillShape.lineTo(x, z) : fillShape.moveTo(x, z);
  }
  const fill = new THREE.Mesh(new THREE.ShapeGeometry(fillShape, 24), new THREE.MeshStandardMaterial({ map: coffee, roughness: 1 }));
  coffee.repeat.set(1.5, 1.5);
  fill.rotation.x = -Math.PI / 2;
  fill.position.y = fillY;
  bag.add(fill);
  const inner = new THREE.PointLight(0xffd9a8, 0, 2.2, 1.6);
  inner.position.set(0, BAG.H + 0.35, 0.15);
  bag.add(inner);
  // tear strip (top seal)
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(BAG.W, BAG.seal, 0.026),
    new THREE.MeshStandardMaterial({ color: 0xf1f1ee, emissive: 0x77766f, roughness: 0.35, metalness: 0.05 }),
  );
  strip.geometry.translate(BAG.W / 2, 0, 0);
  const stripPivot = new THREE.Group();
  stripPivot.position.set(-BAG.W / 2, BAG.H - BAG.seal / 2, 0);
  stripPivot.add(strip);
  bag.add(stripPivot);
  scene.add(bag);

  // can
  const CAN_POS = V(1.05, 0, 0.85);
  const can = makeCan(rows, axis, canTex, 1.32);
  can.group.position.copy(CAN_POS);
  scene.add(can.group);
  // droplets
  const dropGeo = new THREE.SphereGeometry(1, 10, 8);
  const dropMat = new THREE.MeshStandardMaterial({ color: 0xdfe8f5, roughness: 0.03, metalness: 0.35, transparent: true, opacity: 0.42, envMapIntensity: 3.5 });
  const DROPS = 1400;
  const drops = new THREE.InstancedMesh(dropGeo, dropMat, DROPS);
  const dropData = [];
  for (let i = 0; i < DROPS; i++) {
    const th = (Math.random() - 0.5) * Math.PI * 1.15, y = 0.12 + Math.random() * (can.height - 0.3);
    dropData.push({ th, y, r: 0.0016 + Math.pow(Math.random(), 4) * 0.0055, d: Math.random() });
  }
  can.group.add(drops);
  const mist = new THREE.Group();
  const sprite = softSprite();
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite, transparent: true, opacity: 0, depthWrite: false, color: 0xdfe9ff }));
    s.userData = { o: Math.random(), x: (Math.random() - 0.5) * 0.5 };
    mist.add(s);
  }
  can.group.add(mist);

  // spoon
  const spoon = makeSpoon(env, coffee);
  scene.add(spoon.group);

  // grains
  const grains = makeGrains(9000, CAN_POS, can.radius, can.height);
  scene.add(grains);

  // ---------- timeline ----------
  const S = STEPS;
  const camKeys = [
    // p, position, target
    [0.0, V(0.35, 0.82, 5.8), V(0.05, 1.24, 0)],
    [0.07, V(0.3, 0.92, 5.3), V(0.04, 1.3, 0)],
    [S[1], V(0.7, 1.75, 3.5), V(0.0, 1.95, 0)],
    [S[2], V(0.45, 2.85, 2.6), V(0.0, 2.15, 0)],
    [S[3], V(0.1, 4.25, 1.25), V(0.0, 2.2, 0)],
    [0.52, V(0.3, 3.9, 1.9), V(0.1, 2.3, 0)],
    [S[4], V(0.95, 2.4, 5.0), V(0.75, 1.45, 0.3)],
    [0.72, V(1.2, 1.15, 4.0), V(0.98, 0.85, 0.7)],
    [S[5], V(1.22, 0.72, 4.25), V(1.05, 0.66, 0.85)],
    [0.86, V(1.05, 0.68, 4.05), V(1.05, 0.66, 0.85)],
    [S[6], V(1.05, 0.7, 4.5), V(1.05, 0.7, 0.85)],
    [1.0, V(1.05, 0.72, 5.25), V(1.05, 0.72, 0.85)],
  ];
  const camPos = V(0, 0, 0), camTgt = V(0, 0, 0);
  function cameraAt(p) {
    let i = 0;
    while (i < camKeys.length - 2 && p > camKeys[i + 1][0]) i++;
    const [p0, a0, t0] = camKeys[i], [p1, a1, t1] = camKeys[i + 1];
    const t = ease(clamp((p - p0) / (p1 - p0)));
    camPos.lerpVectors(a0, a1, t);
    camTgt.lerpVectors(t0, t1, t);
  }
  const spoonPath = (s, out) => {
    // s: 0..1 over scoop+pour. [s, bowl position, yaw, pitch (handle elevation), roll (pour)]
    const k = [
      [0.0, V(0.32, 3.75, 0.2), -2.36, 1.2, 0.0],
      [0.25, V(0.02, 2.62, -0.02), -2.36, 1.12, 0.0],
      [0.42, V(0.0, fillY + 0.03, -0.04), -2.36, 1.02, 0.0],
      [0.6, V(0.04, 2.8, -0.01), -2.36, 0.95, 0.0],
      [0.8, V(1.02, 2.38, 0.74), -2.1, 0.42, 0.0],
      [1.0, V(1.06, 2.32, 0.76), -2.1, 0.42, 1.95],
    ];
    let i = 0;
    while (i < k.length - 2 && s > k[i + 1][0]) i++;
    const t = ease(clamp((s - k[i][0]) / (k[i + 1][0] - k[i][0])));
    out.pos.lerpVectors(k[i][1], k[i + 1][1], t);
    out.yaw = lerp(k[i][2], k[i + 1][2], t);
    out.pitch = lerp(k[i][3], k[i + 1][3], t);
    out.roll = lerp(k[i][4], k[i + 1][4], t);
  };
  const sp = { pos: V(0, 0, 0), roll: 0, pitch: 0, yaw: 0 };
  const tip = V(0, 0, 0);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(1, 1, 1), dp = V(0, 0, 0);

  let progress = 0, dirty = true, visible = true, raf = 0, time = 0;
  const view = { w: 1, h: 1 };
  const FIN = 0.78;
  const camFin = V(1.05, 0.86, 5.15), tgtFin = V(1.05, 0.72, 0.85), cP = V(0, 0, 0), cT = V(0, 0, 0);
  function apply(P) {
    const p = P < FIN ? (P / FIN) * 0.92 : 0.92;
    const f = seg(P, FIN, 1);
    // bag pose
    const tear = seg(p, S[1] + 0.02, S[2] - 0.02);
    const open = smooth(seg(p, S[2], S[3] - 0.02));
    const face = Math.atan2(camera.position.x - bag.position.x, camera.position.z - bag.position.z);
    bag.rotation.y = lerp(face, 0, smooth(seg(p, S[1], S[2])));
    stripPivot.rotation.z = smooth(tear) * 1.9;
    stripPivot.position.y = BAG.H - BAG.seal / 2 + tear * tear * 1.6;
    stripPivot.position.x = -BAG.W / 2 - tear * tear * 0.9;
    strip.material.opacity = 1 - seg(tear, 0.6, 1);
    strip.material.transparent = true;
    stripPivot.visible = tear < 1;
    const topFrac = tear > 0.05 ? (BAG.H - BAG.seal) / BAG.H : 1;
    updateBagPanel(gF, open, topFrac);
    updateBagPanel(gB, open, topFrac);
    fill.visible = open > 0.01;
    const bagA = 1 - smooth(seg(p, 0.76, 0.85));
    bagMats.forEach((m) => (m.opacity = bagA));
    cap.material.transparent = true; cap.material.opacity = bagA;
    fill.material.transparent = true; fill.material.opacity = bagA;
    bag.visible = bagA > 0.01;
    inner.intensity = open * (1 - seg(p, S[4], S[4] + 0.08)) * 6;

    // spoon
    const s = seg(p, S[3] - 0.03, S[4] + 0.06);
    spoonPath(s, sp);
    spoon.group.visible = s > 0 && p < S[5] + 0.02;
    spoon.group.position.copy(sp.pos);
    spoon.rig.rotation.set(sp.pitch, sp.yaw, sp.roll);
    const pourLocal = seg(p, S[4] - 0.02, S[5] - 0.02);
    spoon.heap.scale.set(0.075, 0.045, 0.11).multiplyScalar(Math.max(0.0001, smooth(seg(s, 0.42, 0.5)) * (1 - smooth(seg(pourLocal, 0.05, 0.55)))));
    spoon.group.updateMatrixWorld();
    tip.set(0.0, 0.0, 0.11).applyMatrix4(spoon.rig.matrixWorld);
    spoon.group.position.y += seg(p, S[5] - 0.01, S[5] + 0.03) * 2.5;

    // grains + can reveal
    grains.material.uniforms.uT.value = pourLocal;
    grains.material.uniforms.uTip.value.copy(tip);
    grains.material.uniforms.uFade.value = 1 - seg(p, S[5] - 0.04, S[5] + 0.01);
    grains.visible = pourLocal > 0 && p < S[5] + 0.02;
    const reveal = seg(p, S[4] + 0.06, S[5] - 0.005);
    can.mats.forEach((m) => (m.userData.reveal.value = reveal));
    can.group.visible = reveal > 0;
    // turn to face the camera square-on for the presentation
    can.group.rotation.y = lerp(-0.4, 0, ease(seg(p, S[4], S[5] + 0.03))) + (p > S[5] ? Math.sin(time * 0.45) * 0.015 : 0);
    can.group.position.copy(CAN_POS);

    // cold: droplets + mist
    const cold = seg(p, S[5], S[6] - 0.02);
    for (let i = 0; i < DROPS; i++) {
      const d = dropData[i];
      const k = smooth(clamp((cold - d.d * 0.6) / 0.4));
      const r = can.radius * 1.0 + d.r * 0.4;
      dp.set(Math.sin(d.th) * r, d.y - k * d.d * 0.04, Math.cos(d.th) * r);
      sc.setScalar(Math.max(0.00001, d.r * k));
      q.identity();
      m4.compose(dp, q, sc);
      drops.setMatrixAt(i, m4);
    }
    drops.instanceMatrix.needsUpdate = true;
    mist.children.forEach((s, i) => {
      const o = (s.userData.o + time * 0.06) % 1;
      s.position.set(s.userData.x, can.height * (0.2 + o * 0.9), can.radius * 0.6);
      s.scale.setScalar(0.5 + o * 0.6);
      s.material.opacity = cold * (1 - seg(p, S[6], 1) * 0.6) * 0.18 * Math.sin(o * Math.PI);
    });

    studio.bokeh.children.forEach((b) => {
      const u = b.userData;
      b.position.set(u.x + Math.sin(time * u.sp + u.ph) * 0.3, u.y + ((time * u.sp * 0.6) % 1) * 0.4, u.z);
    });
    const close = seg(p, S[2] + 0.04, S[3]) * (1 - seg(p, S[4] - 0.02, S[4] + 0.08));
    studio.haze.material.opacity = 1 - close * 0.7;
    studio.shaft.material.opacity = 0.32 * (1 - close);

    const sw = seg(p, S[5] - 0.01, S[6]);
    sweep.intensity = Math.sin(Math.PI * sw) * 26;
    sweep.position.set(CAN_POS.x + lerp(-1.6, 1.6, sw), 1.3, CAN_POS.z + 1.6);
    sweep.target.position.set(CAN_POS.x, 0.7, CAN_POS.z);
    // focus: fade the studio while the camera is tight on the can
    const tight = seg(p, 0.74, S[5]) * (1 - seg(p, 0.97, 1));
    studio.arch.visible = tight < 0.98;
    studio.haze.material.opacity *= 1 - tight * 0.5;

    if (view.w / view.h >= 1.2) {
      camera.setViewOffset(view.w, view.h, -view.w * lerp(0.2, 0.12, smooth(seg(p, S[6], 1))), 0, view.w, view.h);
      camera.updateProjectionMatrix();
    }
    cameraAt(p);
    camera.position.copy(camPos);
    camera.lookAt(camTgt);

    // ---------- finale: the page scrolls down and the can glides down with it onto the slim pedestal ----------
    const DROP = 1.85;
    studio.ped.visible = f > 0;
    studio.ped.position.set(CAN_POS.x, -DROP, CAN_POS.z);
    if (f > 0) {
      const d = ease(seg(f, 0.04, 0.8));
      const settle = -Math.sin(seg(f, 0.8, 0.92) * Math.PI) * 0.018;
      can.group.position.set(CAN_POS.x, -DROP * d + settle, CAN_POS.z);
      can.group.rotation.y = Math.sin(Math.PI * d) * 0.32 + Math.sin(time * 0.45) * 0.02 * seg(f, 0.9, 1);
      // the wide plinth melts away as the can leaves it
      const pa = 1 - smooth(seg(f, 0.02, 0.28));
      plinthMats.forEach((m) => (m.opacity = pa));
      studio.plinth.visible = pa > 0.01;
      floor.material.opacity = 0.32 * pa;
      const k = ease(seg(f, 0.04, 0.8));
      studio.arch.visible = true;
      studio.arch.position.set(lerp(ARCH0.x, CAN_POS.x, k), lerp(ARCH0.y, -DROP - 0.5, k), lerp(ARCH0.z, CAN_POS.z - 0.7, k));
      studio.arch.scale.setScalar(lerp(1, 0.42, k));
      studio.floor.position.y = lerp(FLOOR0, -DROP - 1.95, k);
      studio.bokeh.position.y = -DROP * k;
      studio.haze.material.opacity = lerp(studio.haze.material.opacity, 1, k);
      studio.shaft.material.opacity = 0.32 * k + studio.shaft.material.opacity * (1 - k);
      studio.pglow.material.opacity = Math.exp(-Math.pow((f - 0.81) / 0.045, 2)) * 0.9 + seg(f, 0.84, 1) * 0.22;
      // camera cranes down a beat behind the can, then settles square-on (the hero shot)
      // the camera rides down with the can (it stays framed while the arch and pedestal rise into view)
      const t = ease(seg(f, 0.04, 0.92));
      const canY = can.group.position.y;
      cT.lerpVectors(camTgt, V(CAN_POS.x, 0, CAN_POS.z), t);
      cT.y = canY + lerp(camTgt.y, 0.72, t);
      cP.lerpVectors(camPos, V(CAN_POS.x, 0, CAN_POS.z + 4.3), t);
      cP.y = cT.y + lerp(camPos.y - camTgt.y, 0.14, t);
      cP.z += Math.sin(Math.PI * t) * 0.55;
      cP.x += Math.sin(Math.PI * t) * 0.2;
      camera.position.copy(cP);
      camera.lookAt(cT);
      if (view.w / view.h >= 1.2) {
        camera.setViewOffset(view.w, view.h, -view.w * lerp(0.2, 0.14, t), 0, view.w, view.h);
        camera.updateProjectionMatrix();
      }
    } else {
      plinthMats.forEach((m) => (m.opacity = 1));
      studio.plinth.visible = true;
      floor.material.opacity = 0.32;
      studio.arch.position.copy(ARCH0);
      studio.arch.scale.setScalar(1);
      studio.floor.position.y = FLOOR0;
      studio.bokeh.position.y = 0;
      studio.pglow.material.opacity = 0;
    }
    finale = f;
  }
  function resize() {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = w / h;
    // keep the composition on narrow screens
    camera.fov = w / h < 0.8 ? 50 : w / h < 1.2 ? 38 : 30;
    view.w = w; view.h = h;
    if (w / h >= 1.2) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
    else if (w / h < 0.8) camera.setViewOffset(w, h, 0, h * 0.16, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    grains.material.uniforms.uScale.value = renderer.getPixelRatio() * (h / 900);
    dirty = true;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    time = t / 1000;
    apply(progress);
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const hitCan = (e) => {
    if (finale < 0.85) return false;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(can.group, true).length > 0;
  };
  const onMove = (e) => (renderer.domElement.style.cursor = hitCan(e) ? "pointer" : "");
  const onClick = (e) => hitCan(e) && onInspect && onInspect();
  renderer.domElement.addEventListener("pointermove", onMove);
  renderer.domElement.addEventListener("click", onClick);
  onReady && onReady();
  return {
    setProgress(p) {
      progress = clamp(p);
      dirty = true;
    },
    setVisible(v) {
      visible = v;
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

export { makeCan, makeStudio, makeEnv, coffeeTexture };
