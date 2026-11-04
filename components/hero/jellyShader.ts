// Ray-marched metaball "jellies" (signed distance fields merged with a smooth minimum).
// WebGL1 / GLSL ES 1.0 so it runs everywhere; N and STEPS are injected as constants.

export const vertex = /* glsl */ `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const fragment = (n: number, steps: number, loop = n) => /* glsl */ `
precision highp float;
#define N ${n}
#define STEPS ${steps}
#define LOOP ${loop} // blobs actually evaluated (the lite variant skips the swarm at the end)

uniform vec2 uRes;        // drawing-buffer size in px
uniform float uTime;
uniform float uCamZ;
uniform float uTanHalf;   // tan(fov / 2)
uniform vec4 uBlob[N];    // xyz = centre, w = radius (0 = off)
uniform float uKind[N];   // 0 = lime, 1 = violet
uniform float uWobble;    // 0..1 extra surface ripple from scroll / pointer speed
uniform float uGoo;       // smooth-union radius — how eagerly blobs fuse
uniform float uScale;     // size of the jellies relative to the desktop hero: goo, ripples and glow scale with it,
                          // so a smaller jelly keeps the same irregular silhouette instead of melting into a ball

const vec3 LIME = vec3(0.776, 1.0, 0.0);
const vec3 VIOLET = vec3(0.545, 0.361, 0.965);
const vec3 BLEND = vec3(0.86, 0.92, 0.66); // the pale overlap drop from the logo

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float map(vec3 p) {
  float d = 1e3;
  for (int i = 0; i < LOOP; i++) {
    vec4 b = uBlob[i];
    if (b.w < 0.002) continue;
    d = smin(d, length(p - b.xyz) - b.w, uGoo * uScale);
  }
  // living surface: slow standing waves, amplified while things move
  // (time frequencies here and in the caustic are multiples of 2π/20 so the recorded fallback video loops seamlessly)
  float amp = (0.028 + 0.075 * uWobble) * uScale;
  vec3 q = p / uScale;
  d += amp * sin(q.x * 3.1 + uTime * 1.2566) * sin(q.y * 2.7 - uTime * 0.9425) * sin(q.z * 3.3 + uTime * 0.6283);
  return d;
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.0025, -0.0025) * uScale;
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}

// colour = proximity-weighted mix of the blobs' kinds; overlap peaks where lime meets violet
vec3 tint(vec3 p, out float overlap) {
  float wl = 0.0, wv = 0.0;
  for (int i = 0; i < LOOP; i++) {
    vec4 b = uBlob[i];
    if (b.w < 0.002) continue;
    float w = exp(-9.0 / uScale * max(length(p - b.xyz) - b.w, 0.0)) * b.w * b.w;
    wl += w * (1.0 - uKind[i]);
    wv += w * uKind[i];
  }
  float t = wv / (wl + wv + 1e-4);
  overlap = 1.0 - abs(2.0 * t - 1.0);
  return mix(LIME, VIOLET, smoothstep(0.18, 0.82, t));
}

// how far past a blob's sphere the goo (smooth union + surface ripple) and the bloom can still reach
const float REACH = 0.6;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ro = vec3(0.0, 0.0, uCamZ);
  vec3 rd = normalize(vec3(uv * 2.0 * uTanHalf, -1.0));

  // bounding pass: rays that pass no blob within REACH are empty (most of the screen) and skip the march;
  // the others start marching where they enter the first enlarged sphere
  float tStart = 1e3;
  for (int i = 0; i < LOOP; i++) {
    vec4 b = uBlob[i];
    if (b.w < 0.002) continue;
    vec3 oc = ro - b.xyz;
    float bb = dot(oc, rd);
    float reach = b.w + REACH * uScale;
    float q = reach * reach - (dot(oc, oc) - bb * bb);
    if (q > 0.0) tStart = min(tStart, -bb - sqrt(q));
  }
  if (tStart > 999.0) { gl_FragColor = vec4(0.0); return; }

  float t = max(tStart, 0.0);
  float minD = 1e3;
  float tMin = t;
  bool hit = false;
  for (int i = 0; i < STEPS; i++) {
    float d = map(ro + rd * t);
    if (d < minD) { minD = d; tMin = t; }
    if (d < 0.0015 * uScale) { hit = true; break; }
    t += d * 0.92;
    if (t > uCamZ + 4.0) break;
  }

  float ov;
  if (!hit) {
    // soft bloom around the jelly so it lights the dark page
    vec3 c = tint(ro + rd * tMin, ov);
    float g = exp(-minD * 7.0 / uScale) * 0.3;
    // cheap anti-aliasing: rays that just graze the surface get partial, rim-coloured coverage
    float px = tMin * 2.0 * uTanHalf / uRes.y;
    float cov = 1.0 - smoothstep(0.0, px * 1.5, minD);
    vec3 rim = min(c * 1.1 + 0.18, vec3(1.0));
    float a = max(g, cov * 0.9);
    gl_FragColor = vec4(mix(c * g, rim * a, cov), a);
    return;
  }

  vec3 p = ro + rd * t;
  vec3 n = normalAt(p);
  vec3 v = -rd;
  vec3 base = tint(p, ov);

  vec3 L1 = normalize(vec3(-0.55, 0.8, 0.6));  // key light, top-left
  vec3 L2 = normalize(vec3(0.75, -0.45, 0.4)); // violet kicker, bottom-right
  float ndv = max(dot(n, v), 0.0);
  float diff = max(dot(n, L1), 0.0) * 0.6 + 0.4;
  float fres = pow(1.0 - ndv, 3.0);

  vec3 col = base * (0.16 + 0.42 * diff);
  col += base * 0.7 * ndv * ndv;                           // translucent core glow
  col = mix(col, BLEND * (0.5 + 0.4 * diff), ov * ov * 0.45); // luminous overlap seam
  col += mix(vec3(0.82, 1.0, 0.3), vec3(0.7, 0.55, 1.0), 0.5 + 0.5 * n.x) * fres * 0.85;

  vec3 r = reflect(rd, n);
  float softbox = smoothstep(0.5, 0.78, r.y) * smoothstep(0.95, 0.45, abs(r.x + 0.25));
  col += vec3(1.0) * softbox * 0.28;
  col += vec3(1.0) * pow(max(dot(r, L1), 0.0), 90.0) * 1.5;
  col += vec3(0.78, 0.62, 1.0) * pow(max(dot(r, L2), 0.0), 24.0) * 0.4;

  float caustic = sin(p.x * 9.0 / uScale + uTime * 1.2566) * sin(p.y * 8.0 / uScale - uTime * 0.9425) * 0.5 + 0.5;
  col += base * caustic * 0.07;

  float a = 0.9 + 0.1 * fres;
  gl_FragColor = vec4(min(col, vec3(1.0)) * a, a);
}
`;
