/*
Kutu modeli ve doku geçiş shader'ı:
https://github.com/mohAmineBrs/codrops-noise-transition (MIT)

Model: "Energy Drink Game Ready Model", dwalsh
https://sketchfab.com/3d-models/energy-drink-game-ready-model-83676feb8b0a4589952cf3676299311b
Lisans: CC-BY-4.0
*/

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Color, MathUtils, Vector2 } from "three";

import { noise } from "./Noise";
import { flavors, poses } from "./data";
import { scrollState } from "./scroll";
import { pointer } from "./pointer";

import model from "./assets/models/energy-can.glb?url";

const keys = ["x", "y", "z", "rotX", "rotY", "rotZ", "scale"];

function targetPose(section, portrait) {
  const i = Math.min(Math.floor(section), poses.length - 1);
  const next = Math.min(i + 1, poses.length - 1);
  const t = section - i;
  const out = {};
  for (const k of keys) out[k] = MathUtils.lerp(poses[i][k], poses[next][k], t);

  if (portrait) {
    // Dikey ekranda kutu ortada, biraz küçük ve metnin arkasında durur.
    out.x = 0;
    out.y += 0.6;
    out.z -= 1.5;
    out.scale *= 0.8;
  }
  return out;
}

const Model = () => {
  const { nodes, materials } = useGLTF(model);
  const size = useThree((s) => s.size);
  const portrait = size.width / size.height < 0.9;

  const group = useRef();
  const inner = useRef();
  const current = useRef(targetPose(0, portrait));

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_color1: { value: new Color(flavors[0].color) },
      u_color2: { value: new Color(flavors[1].color) },
      u_progress: { value: 0.5 },
      u_width: { value: 0.8 },
      u_scaleX: { value: 50 },
      u_scaleY: { value: 50 },
      u_textureSize: {
        value: new Vector2(
          materials.Body.map.source.data.width,
          materials.Body.map.source.data.height
        ),
      },
    }),
    [materials]
  );

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    uniforms.u_time.value = time;

    // Scroll'a bağlı doku geçişi: 0.5 = tamamen renk1, 1 = tamamen renk2.
    const f = scrollState.flavor;
    const i = Math.min(Math.floor(f), flavors.length - 2);
    uniforms.u_color1.value.set(flavors[i].color);
    uniforms.u_color2.value.set(flavors[i + 1].color);
    uniforms.u_progress.value = 0.5 + 0.5 * (f - i);

    // Hedef poza yumuşak yaklaşım.
    const target = targetPose(scrollState.section, portrait);
    const c = current.current;
    const d = Math.min(delta, 0.1);
    for (const k of keys) c[k] = MathUtils.damp(c[k], target[k], 3.5, d);

    const g = group.current;
    g.position.set(c.x, c.y + Math.sin(time) * 0.12, c.z);
    g.rotation.set(
      c.rotX + pointer.y * 0.12,
      c.rotY + pointer.x * 0.25,
      c.rotZ
    );
    g.scale.setScalar(c.scale);

    // Boşta hafif dönme.
    inner.current.rotation.y = Math.sin(time * 0.6) * 0.15;
  });

  useEffect(() => {
    materials.Body.metalness = 0;
    materials.Body.roughness = 1;
    materials.Body.onBeforeCompile = (shader) => {
      shader.uniforms = Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader.replace(
        `#include <common>`,
        `
          #include <common>
          varying vec2 vUv;
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
          #include <begin_vertex>
          vUv = uv;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <common>`,
        `
          #include <common>

          uniform float u_time;
          uniform vec3 u_color1;
          uniform vec3 u_color2;
          uniform float u_progress;
          uniform float u_width;
          uniform float u_scaleX;
          uniform float u_scaleY;
          uniform vec2 u_textureSize;

          varying vec2 vUv;

          ${noise}

          float parabola( float x, float k ) {
            return pow( 4. * x * ( 1. - x ), k );
          }
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <color_fragment>`,
        `
          #include <color_fragment>

          float dt = parabola(u_progress,1.);
          float border = 1.;

          float noise = 0.5*(cnoise(vec4(vUv.x*u_scaleX + 0.5*u_time/3., vUv.y*u_scaleY, 0.5*u_time/3., 0.)) + 1.);

          float w = u_width*dt;

          float maskValue = smoothstep(1. - w, 1., vUv.y + mix(-w/2., 1. - w/2., u_progress));
          maskValue += maskValue * noise;

          float mask = smoothstep(border, border+0.01, maskValue);

          diffuseColor.rgb += mix(u_color1, u_color2, mask);
        `
      );
    };
    materials.Body.needsUpdate = true;
  }, [materials, uniforms]);

  return (
    <group ref={group} dispose={null}>
      <group ref={inner}>
        <group rotation={[-Math.PI / 2, 1.7, Math.PI / 2]}>
          <group rotation={[-Math.PI / 2, 0, 0]}>
            <mesh
              geometry={nodes.LowRes_Can_Alluminium_0.geometry}
              material={materials.Alluminium}
            />
            <mesh
              geometry={nodes.LowRes_Can_Body_0.geometry}
              material={materials.Body}
            />
          </group>
        </group>
      </group>
    </group>
  );
};

useGLTF.preload(model);

export default Model;
