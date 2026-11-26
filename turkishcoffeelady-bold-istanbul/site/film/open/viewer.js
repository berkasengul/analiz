// Bold Istanbul · 3D inspect: the same studio and can as the opening, with orbit controls and label hotspots.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { makeCan, makeStudio, makeEnv } from "./opening.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export async function mount(el, { canTexture, rows, axis, hotspots = [], onReady }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.touchAction = "none";
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

  scene.add(new THREE.HemisphereLight(0xe9efff, 0x1b2550, 0.75));
  const key = new THREE.DirectionalLight(0xfff0dc, 2.1);
  key.position.set(-2.5, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -2, right: 2, top: 3, bottom: -2, near: 0.5, far: 15 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.radius = 6;
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fb9ff, 1.8);
  rim.position.set(3, 3, -4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6);
  fill.position.set(0, 1, -5);
  scene.add(fill);

  // studio: arch + slim pedestal (top at y = 0), no wide plinth
  const studio = makeStudio(env, V(0, 0, 0));
  studio.ped.visible = true;
  studio.ped.position.set(0, 0, 0);
  studio.pglow.material.opacity = 0.22;
  studio.arch.position.set(0, -0.5, -0.7);
  studio.arch.scale.setScalar(0.42);
  studio.floor.position.y = -1.95;
  studio.bokeh.position.set(-0.42, -1.2, 0);
  scene.add(studio.arch, studio.ped, studio.floor, studio.bokeh);

  const tex = await new Promise((res) =>
    new THREE.TextureLoader().load(canTexture, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      res(t);
    }),
  );
  const can = makeCan(rows, axis, tex, 1.32);
  can.mats.forEach((m) => (m.userData.reveal.value = 1.2));
  scene.add(can.group);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
  camera.position.set(0, 0.95, 4.4);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.68, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 1.5;
  controls.maxDistance = 6;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = 1.75;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.7;
  controls.rotateSpeed = 0.7;
  controls.update();
  let idleAt = performance.now();
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
    tween = null;
  });
  controls.addEventListener("end", () => (idleAt = performance.now()));

  // hotspots: positions on the can surface, given as angle (0 = front) and height
  const pins = hotspots.map((h, i) => {
    const b = document.createElement("button");
    b.className = "tcl-pin";
    b.type = "button";
    b.innerHTML = `<i></i><span class="tcl-pin__card"><strong></strong><em></em></span>`;
    b.querySelector("strong").textContent = h.title;
    b.querySelector("em").textContent = h.text;
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      const on = !b.classList.contains("is-open");
      pins.forEach((p) => p.el.classList.remove("is-open"));
      on && b.classList.add("is-open");
    });
    el.appendChild(b);
    const r = can.radius * 1.01;
    return { el: b, pos: V(Math.sin(h.angle) * r, h.y, Math.cos(h.angle) * r), n: V(Math.sin(h.angle), 0, Math.cos(h.angle)) };
  });
  const tmp = V(0, 0, 0), toCam = V(0, 0, 0);

  let tween = null;
  function view(name) {
    const az = { front: 0, side: Math.PI / 2, back: Math.PI }[name] ?? 0;
    const from = { th: controls.getAzimuthalAngle(), ph: controls.getPolarAngle(), d: camera.position.distanceTo(controls.target) };
    let dth = az - from.th;
    while (dth > Math.PI) dth -= Math.PI * 2;
    while (dth < -Math.PI) dth += Math.PI * 2;
    tween = { t0: performance.now(), from, to: { th: from.th + dth, ph: 1.42, d: name === "back" ? 3.2 : 3.6 } };
    controls.autoRotate = false;
  }

  function resize() {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 46 : 30;
    if (w / h >= 1.2) camera.setViewOffset(w, h, -w * 0.16, 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  let raf = 0;
  const sph = new THREE.Spherical();
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    const time = t / 1000;
    if (tween) {
      const k = ease(clamp((performance.now() - tween.t0) / 1100));
      const th = tween.from.th + (tween.to.th - tween.from.th) * k;
      const ph = tween.from.ph + (tween.to.ph - tween.from.ph) * k;
      const d = tween.from.d + (tween.to.d - tween.from.d) * k;
      sph.set(d, ph, th);
      camera.position.setFromSpherical(sph).add(controls.target);
      if (k >= 1) (tween = null), (idleAt = performance.now());
    }
    if (!controls.autoRotate && !tween && performance.now() - idleAt > 9000) controls.autoRotate = true;
    controls.update();
    // keep the arch behind the can: fade it out when orbiting round the back
    const az = Math.abs(controls.getAzimuthalAngle());
    studio.arch.visible = az < 1.75;
    studio.bokeh.children.forEach((b) => {
      const u = b.userData;
      b.position.set(u.x + Math.sin(time * u.sp + u.ph) * 0.3, u.y + ((time * u.sp * 0.6) % 1) * 0.4, u.z);
    });
    renderer.render(scene, camera);
    // pins
    const w = el.clientWidth, h = el.clientHeight;
    pins.forEach((p) => {
      tmp.copy(p.pos);
      toCam.copy(camera.position).sub(tmp).normalize();
      const facing = toCam.dot(p.n);
      tmp.project(camera);
      p.el.style.transform = `translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px)`;
      p.el.classList.toggle("is-hidden", facing < 0.15);
    });
  };
  raf = requestAnimationFrame(loop);
  onReady && onReady();
  return {
    view,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      pins.forEach((p) => p.el.remove());
    },
  };
}
