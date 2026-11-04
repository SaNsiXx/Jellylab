"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { jellyVertex, jellyFragment, haloVertex, haloFragment } from "./jellyShaders";
import { JELLIES, type JellyKind } from "./jellies";

export type Quality = "high" | "low";

export type JellyCanvasProps = {
  /** 0 → hero at rest, 1 → hero scrolled away. */
  progressRef: RefObject<number>;
  /** Pointer in normalised device coords relative to the hero, or null when outside. */
  pointerRef: RefObject<{ x: number; y: number } | null>;
  active: boolean;
  initialQuality: Quality;
  onReady: () => void;
  onFallback: () => void;
};

const hexToVec3 = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const easeOutCubic = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

const MEET_PERIOD = 9; // seconds between "touch & exchange" moments

/** 0..1 envelope: drift together, hold, separate. */
function meetEnvelope(t: number) {
  const p = (t % MEET_PERIOD) / MEET_PERIOD;
  return smooth(0.52, 0.68, p) * (1 - smooth(0.8, 0.96, p));
}

function Scene({ progressRef, pointerRef, detail }: { progressRef: RefObject<number>; pointerRef: RefObject<{ x: number; y: number } | null>; detail: number }) {
  const { viewport, size } = useThree();
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, detail), [detail]);
  const halo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => halo.dispose(), [halo]);

  const kinds: JellyKind[] = ["blue", "green", "heat"];

  const materials = useMemo(
    () =>
      kinds.map((k, i) => {
        const j = JELLIES[k];
        const others = kinds.filter((o) => o !== k);
        return new THREE.ShaderMaterial({
          vertexShader: jellyVertex,
          fragmentShader: jellyFragment,
          transparent: true,
          depthWrite: false,
          uniforms: {
            uTime: { value: 0 },
            uSeed: { value: i * 3.7 + 1.3 },
            uShape: { value: new THREE.Vector3(...j.shape) },
            uBend: { value: j.bend },
            uWobble: { value: j.wobble },
            uPointer: { value: new THREE.Vector3(99, 99, 0) },
            uPointerAmt: { value: 0 },
            uC1: { value: hexToVec3(j.colors[0]) },
            uC2: { value: hexToVec3(j.colors[1]) },
            uC3: { value: hexToVec3(j.colors[2]) },
            uFade: { value: 0 },
            uRadius: { value: 1 },
            uExchange: { value: 0 },
            uOtherPos: { value: [new THREE.Vector3(), new THREE.Vector3()] },
            uOtherCol: { value: others.map((o) => hexToVec3(JELLIES[o].colors[1])) },
          },
        });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const haloMaterials = useMemo(
    () =>
      kinds.map(
        (k) =>
          new THREE.ShaderMaterial({
            vertexShader: haloVertex,
            fragmentShader: haloFragment,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: { uColor: { value: hexToVec3(JELLIES[k].colors[1]) }, uFade: { value: 0 } },
          }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => () => [...materials, ...haloMaterials].forEach((m) => m.dispose()), [materials, haloMaterials]);

  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const halos = useRef<(THREE.Mesh | null)[]>([]);
  const current = useRef(kinds.map(() => new THREE.Vector2()));
  const avoid = useRef(kinds.map(() => new THREE.Vector2()));
  const pointerAmt = useRef(0);
  const started = useRef<number | null>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    if (started.current === null) started.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - started.current;
    const vw = viewport.width;
    const vh = viewport.height;
    const desktop = size.width >= 1024;

    // Cluster sits right of the copy on desktop; R is the base unit for size and orbit radii.
    const R = Math.min(vh * 0.17, vw * 0.1);
    const C = new THREE.Vector2(desktop ? vw * 0.28 : vw * 0.18, desktop ? -vh * 0.03 : vh * 0.18);
    const scroll = progressRef.current ?? 0;
    const meet = meetEnvelope(t);

    const ptr = pointerRef.current;
    const ptrWorld = ptr ? new THREE.Vector2((ptr.x * vw) / 2, (ptr.y * vh) / 2) : null;
    pointerAmt.current = THREE.MathUtils.damp(pointerAmt.current, ptr ? 1 : 0, 3, dt);

    const targets = [
      // Blue — fast but controlled, long horizontal orbit.
      new THREE.Vector2(-0.45 * R + Math.cos(t * 0.5) * 1.05 * R, 0.6 * R + Math.sin(t * 0.5) * 0.3 * R),
      // Green — elastic vertical bounce.
      new THREE.Vector2(0.95 * R + Math.sin(t * 0.27) * 0.15 * R, 0.15 * R + Math.sin(t * 1.05) * 0.38 * R + Math.sin(t * 3.15) * 0.05 * R),
      // Heat — warm diagonal orbit.
      new THREE.Vector2(-0.15 * R + Math.sin(t * 0.4) * 0.5 * R + Math.cos(t * 0.4) * 0.12 * R, -0.75 * R + Math.sin(t * 0.4) * 0.42 * R),
    ];
    const meetOffsets = [new THREE.Vector2(-0.55 * R, 0.4 * R), new THREE.Vector2(0.6 * R, 0.25 * R), new THREE.Vector2(0.0, -0.55 * R)];
    const entryFrom = [new THREE.Vector2(vw * 0.9, 0.2 * vh), new THREE.Vector2(0.3 * vw, vh * 0.95), new THREE.Vector2(-0.1 * vw, -vh * 0.95)];
    const outward = [new THREE.Vector2(1, 0.35), new THREE.Vector2(0.55, 1), new THREE.Vector2(0.35, -1)];
    const delays = [0, 0.18, 0.36];

    const positions: THREE.Vector2[] = [];
    kinds.forEach((k, i) => {
      const j = JELLIES[k];
      const orbit = targets[i]!.clone().lerp(meetOffsets[i]!, meet * 0.7).add(C);
      const enter = easeOutCubic((t - delays[i]!) / 2.8);
      const goal = entryFrom[i]!.clone().lerp(orbit, enter);

      // Pointer: gentle avoidance (damped so it never snaps).
      const push = new THREE.Vector2();
      if (ptrWorld) {
        const d = current.current[i]!.clone().sub(ptrWorld);
        const len = d.length();
        const reach = R * 2.2;
        if (len < reach && len > 1e-4) push.copy(d.normalize().multiplyScalar(Math.pow(1 - len / reach, 2) * R * 0.35));
      }
      avoid.current[i]!.x = THREE.MathUtils.damp(avoid.current[i]!.x, push.x, 2.5, dt);
      avoid.current[i]!.y = THREE.MathUtils.damp(avoid.current[i]!.y, push.y, 2.5, dt);
      goal.add(avoid.current[i]!);
      goal.add(outward[i]!.clone().multiplyScalar(scroll * vw * 0.55));

      const cur = current.current[i]!;
      if (t < 0.05) cur.copy(entryFrom[i]!);
      cur.x = THREE.MathUtils.damp(cur.x, goal.x, 4.5, dt);
      cur.y = THREE.MathUtils.damp(cur.y, goal.y, 4.5, dt);
      positions.push(cur);

      const mesh = meshes.current[i];
      if (mesh) {
        const pulse = k === "heat" ? 1 + Math.sin(t * 1.5) * 0.035 : 1;
        mesh.position.set(cur.x, cur.y, i * 0.05);
        mesh.scale.setScalar(R * j.size * pulse);
        mesh.rotation.z = j.rotation + (k === "green" ? Math.sin(t * 0.18) * 0.35 : Math.sin(t * 0.3 + i) * 0.06);
        mesh.rotation.y = Math.sin(t * 0.2 + i * 2) * 0.25;
      }
      const h = halos.current[i];
      if (h) {
        h.position.set(cur.x, cur.y, -1);
        h.scale.setScalar(R * j.size * 4.2);
      }
    });

    const fade = easeOutCubic(t / 1.6) * (1 - scroll * 0.85);
    materials.forEach((m, i) => {
      const u = m.uniforms;
      u.uTime!.value = t;
      u.uFade!.value = fade;
      u.uRadius!.value = R;
      u.uExchange!.value = meet;
      u.uPointerAmt!.value = pointerAmt.current;
      if (ptrWorld) (u.uPointer!.value as THREE.Vector3).set(ptrWorld.x, ptrWorld.y, 0);
      const others = positions.filter((_, o) => o !== i);
      (u.uOtherPos!.value as THREE.Vector3[]).forEach((v, o) => v.set(others[o]!.x, others[o]!.y, 0));
    });
    haloMaterials.forEach((m) => (m.uniforms.uFade!.value = fade * (0.85 + meet * 0.4)));
  });

  return (
    <>
      {kinds.map((k, i) => (
        <mesh key={`halo-${k}`} ref={(el) => void (halos.current[i] = el)} geometry={halo} material={haloMaterials[i]} renderOrder={0} />
      ))}
      {kinds.map((k, i) => (
        <mesh key={k} ref={(el) => void (meshes.current[i] = el)} geometry={geometry} material={materials[i]} renderOrder={i + 1} />
      ))}
    </>
  );
}

function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    if (++frames.current > 3) {
      done.current = true;
      onReady();
    }
  });
  return null;
}

export default function JellyCanvas({ progressRef, pointerRef, active, initialQuality, onReady, onFallback }: JellyCanvasProps) {
  const [quality, setQuality] = useState<Quality>(initialQuality);
  const [dpr, setDpr] = useState(initialQuality === "high" ? 1.75 : 1);

  return (
    <Canvas
      dpr={dpr}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, 10], fov: 35, near: 0.1, far: 50 }}
      gl={{ alpha: true, antialias: quality === "high", powerPreference: "high-performance", stencil: false, depth: false }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-hidden="true"
      tabIndex={-1}
    >
      {/* Steps quality down on sustained frame drops; gives up on WebGL after repeated flip-flops. */}
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setQuality("low");
        }}
        onIncline={() => setDpr((d) => Math.min(d + 0.25, initialQuality === "high" ? 1.75 : 1.25))}
        flipflops={4}
        onFallback={onFallback}
      />
      <Scene progressRef={progressRef} pointerRef={pointerRef} detail={quality === "high" ? 48 : 28} />
      <ReadySignal onReady={onReady} />
    </Canvas>
  );
}
