// GLSL for the hero Jellies. No textures, no post-processing — cheap enough for integrated GPUs.

const noise = /* glsl */ `
vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

export const jellyVertex = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform vec3 uShape;     // per-axis stretch → bean / capsule silhouettes
uniform float uBend;     // bean curvature
uniform float uWobble;   // soft-body deformation amount
uniform vec3 uPointer;   // pointer in world space
uniform float uPointerAmt;
varying vec3 vNormalW;
varying vec3 vWorld;
varying vec3 vObj;
${noise}
vec3 shape(vec3 p){
  float n1 = snoise(p * 1.25 + vec3(uSeed, uSeed * 0.7, uTime * 0.22));
  float n2 = snoise(p * 1.8 + vec3(uTime * 0.3, uSeed, 0.0));
  vec3 q = p * (1.0 + uWobble * (n1 * 0.82 + n2 * 0.18));
  q *= uShape;
  q.y += uBend * (q.x * q.x) - uBend * 0.6;
  return q;
}
void main(){
  vec3 p = normalize(position);
  vec3 t = normalize(cross(p, abs(p.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0)));
  vec3 b = cross(p, t);
  const float e = 0.012;
  vec3 q = shape(p);
  vec3 n = normalize(cross(shape(normalize(p + t * e)) - q, shape(normalize(p + b * e)) - q));
  if (dot(n, q) < 0.0) n = -n;
  vec4 world = modelMatrix * vec4(q, 1.0);
  vec3 nW = normalize(mat3(modelMatrix) * n);
  vec2 d = world.xy - uPointer.xy;
  world.xyz -= nW * exp(-dot(d, d) * 1.4) * uPointerAmt * 0.16;
  vWorld = world.xyz;
  vNormalW = nW;
  vObj = p;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const jellyFragment = /* glsl */ `
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform float uTime;
uniform float uFade;
uniform float uRadius;
uniform float uExchange;
uniform vec3 uOtherPos[2];
uniform vec3 uOtherCol[2];
varying vec3 vNormalW;
varying vec3 vWorld;
varying vec3 vObj;
void main(){
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vWorld);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 2.0);

  float g = clamp(dot(N, normalize(vec3(-0.6, 0.8, 0.25))) * 0.5 + 0.5 + 0.1 * sin(uTime * 0.4 + vObj.x * 2.0), 0.0, 1.0);
  vec3 base = g < 0.5 ? mix(uC3, uC2, g * 2.0) : mix(uC2, uC1, (g - 0.5) * 2.0);

  // Soft wave of colour where Jellies meet.
  for (int i = 0; i < 2; i++) {
    float dist = distance(vWorld, uOtherPos[i]);
    float w = smoothstep(uRadius * 2.1, uRadius * 0.5, dist);
    float wave = 0.5 + 0.5 * sin(dist * 4.0 - uTime * 2.2);
    base = mix(base, uOtherCol[i], w * uExchange * (0.4 + 0.35 * wave));
  }

  vec3 L1 = normalize(vec3(-0.5, 0.8, 0.75));
  vec3 H1 = normalize(L1 + V);
  float nh = max(dot(N, H1), 0.0);
  float spec = pow(nh, 110.0) * 1.2 + pow(nh, 16.0) * 0.14;
  float spec2 = pow(max(dot(N, normalize(normalize(vec3(0.75, -0.55, 0.5)) + V)), 0.0), 48.0) * 0.3;
  float diff = max(dot(N, L1), 0.0) * 0.3 + 0.7;

  vec3 col = base * (0.46 + 0.75 * fres) * diff;            // translucent core, saturated edges
  col += base * 0.26;                                        // subsurface lift
  col += mix(base, vec3(1.0), 0.55) * pow(fres, 4.0) * 0.85; // rim light
  vec3 irid = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + fres * 1.3 + uTime * 0.025));
  col += irid * pow(fres, 3.0) * 0.1;                        // restrained thin-film sheen
  col += vec3(spec + spec2);

  float alpha = clamp(0.4 + 0.6 * fres + spec, 0.0, 1.0) * uFade;
  gl_FragColor = vec4(col, alpha);
}
`;

export const haloVertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const haloFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uFade;
varying vec2 vUv;
void main(){
  float d = length(vUv - 0.5) * 2.0;
  float a = pow(smoothstep(1.0, 0.0, d), 2.2) * 0.32 * uFade;
  gl_FragColor = vec4(uColor, a); // AdditiveBlending multiplies by alpha
}
`;
