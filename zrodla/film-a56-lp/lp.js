// VRUX AVC A56 Low Profile – film renderer (three.js + three-gpu-pathtracer)
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { WebGLPathTracer, GradientEquirectTexture } from 'three-gpu-pathtracer';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// ---------- profiles (r, z) in mm ----------
const K = [[22.95,14.61],[23.08,14.87],[23.07,15.17],[22.89,15.47],[22.42,16.01],[22.34,16.28],[22.49,16.58],[22.97,17.13],[23.07,17.36],[23.09,17.58],[22.96,17.88],[22.4,18.55],[22.34,18.72],[22.4,18.95],[23.3,20.0],[26.5,20.0],[28.0,18.5],[28.0,1.5],[26.5,0.0],[22.5,0.0],[22.5,1.0],[11.5,1.0],[11.0,1.5],[11.0,3.0],[21.95,3.0],[21.95,3.3],[22.6,3.3],[22.4,3.54],[22.35,3.84],[22.53,4.13],[22.98,4.65],[23.08,4.86],[23.09,5.1],[22.94,5.4],[22.4,6.05],[22.34,6.26],[22.45,6.53],[23.02,7.21],[23.1,7.51],[23.01,7.81],[22.42,8.52],[22.34,8.8],[22.48,9.07],[22.96,9.61],[23.08,9.86],[23.09,10.06],[22.97,10.36],[22.41,11.03],[22.35,11.3],[22.44,11.51],[22.99,12.17],[23.1,12.47],[23.03,12.77],[22.46,13.46],[22.34,13.76],[22.45,14.03],[22.95,14.61]];
const T = [[22.97,3.35],[22.86,3.14],[22.34,2.55],[22.24,2.25],[22.36,1.93],[22.92,1.26],[22.99,1.07],[22.98,0.88],[22.1,0.0],[20.1,0.0],[19.1,1.0],[19.1,9.0],[11.5,9.0],[11.0,9.5],[11.0,17.0],[11.5,17.5],[22.1,17.5],[22.26,17.34],[22.26,17.13],[22.34,16.95],[22.85,16.37],[23.0,16.05],[22.92,15.73],[22.37,15.09],[22.25,14.71],[22.38,14.41],[22.89,13.81],[23.0,13.54],[22.94,13.26],[22.32,12.51],[22.24,12.25],[22.35,11.95],[22.86,11.35],[22.99,11.07],[22.95,10.8],[22.36,10.07],[22.24,9.76],[22.32,9.48],[22.84,8.89],[22.99,8.59],[22.9,8.2],[22.37,7.58],[22.25,7.28],[22.35,6.94],[22.81,6.43],[22.99,6.08],[22.92,5.74],[22.38,5.09],[22.24,4.73],[22.35,4.44],[22.96,3.69],[22.97,3.35]];
// hemispherical AVC rubber suspension (shell), local z = 0 at its base
// real AVC rubber suspension profile (from GUMA_VICTOR.step), local z = 0 at its base
const R_PROF = [[7.665, 12.591], [7.638, 12.632], [7.619, 12.677], [7.609, 12.725], [7.608, 18.5], [5.482, 18.5], [5.482, 18.75], [5.482, 19.0], [2.988, 19.0], [2.988, 8.0], [3.655, 7.333], [4.322, 6.667], [4.982, 6.0], [5.174, 6.0], [5.38, 6.0], [6.387, 7.0], [7.387, 8.0], [7.465, 8.094], [7.552, 8.18], [7.647, 8.258], [7.749, 8.325], [7.858, 8.382], [7.971, 8.429], [8.088, 8.464], [8.208, 8.487], [8.33, 8.499], [8.453, 8.498], [8.574, 8.486], [8.694, 8.462], [8.811, 8.426], [8.924, 8.379], [9.032, 8.321], [9.134, 8.253], [9.228, 8.175], [9.315, 8.088], [9.392, 7.993], [9.46, 7.892], [9.518, 7.784], [9.564, 7.67], [9.6, 7.553], [10.229, 5.035], [10.859, 2.518], [11.47, 0.0], [18.988, 0.0], [18.871, 1.634], [18.601, 3.25], [18.181, 4.834], [17.616, 6.371], [16.908, 7.849], [16.066, 9.254], [15.096, 10.574], [14.007, 11.798], [12.808, 12.914], [11.51, 13.914], [10.124, 14.788], [10.036, 14.832], [9.943, 14.868], [9.847, 14.894], [9.749, 14.911], [9.65, 14.918], [9.55, 14.914], [9.452, 14.902], [9.355, 14.879], [9.261, 14.847], [9.171, 14.805], [9.085, 14.755], [9.004, 14.697], [8.93, 14.631], [8.863, 14.558], [8.803, 14.478], [8.751, 14.393], [8.709, 14.304], [8.675, 14.21], [8.64, 14.114], [8.368, 12.701], [8.354, 12.654], [8.331, 12.611], [8.3, 12.573], [8.262, 12.542], [8.218, 12.519], [8.172, 12.505], [8.123, 12.5], [7.848, 12.5], [7.809, 12.505], [7.762, 12.519], [7.719, 12.542], [7.681, 12.573], [7.665, 12.591]];
function rubberProfile() { return R_PROF; }
const R = rubberProfile();
const R_TOP = Math.max(...R.map(q => q[1])), R_BOSS = 6.0; // screw head bears on the inner shelf
// tray mounted cup-up: flip the scanned profile
const T_UP = T.map(([r, z]) => [r, 17.5 - z]).reverse();
const PAD = [[0.01,0],[22.2,0],[22.4,0.2],[22.4,2.8],[22.2,3.0],[0.01,3.0],[0.01,0]];

// body thread as seen in the section while the body turns: the helix appears to travel axially by
// the same amount the tray rises, so the cut threads stay meshed (rings stand in for the helix)
const PITCH = 2.48, THR_Z0 = 6.26, THR_A = 3.84, THR_B = 18.72, K_SPLIT = 14.61;
const THR_PER = K.filter(p => p[1] >= THR_Z0 && p[1] < THR_Z0 + PITCH && p[0] < 23.2).sort((a, b) => a[1] - b[1]);
function thrR(z) {
  let u = ((z - THR_Z0) % PITCH + PITCH) % PITCH; const P = THR_PER.map(p => [p[0], p[1] - THR_Z0]); P.push([P[0][0], PITCH]);
  for (let i = 0; i < P.length - 1; i++) if (u >= P[i][1] && u <= P[i + 1][1]) { const k = (u - P[i][1]) / (P[i + 1][1] - P[i][1]); return P[i][0] + (P[i + 1][0] - P[i][0]) * k; }
  return P[0][0];
}
function bodyProfile(L = 0) {
  if (!L) return K;
  const gen = (a, b) => { const o = []; const n = Math.max(2, Math.round((b - a) / 0.06)); for (let i = 0; i <= n; i++) { const z = a + (b - a) * i / n; o.push([thrR(z - L), z]); } return o; };
  const iTop = K.findIndex(p => p[0] === 22.4 && p[1] === 18.95), iBot = K.findIndex(p => p[0] === 22.35 && p[1] === 3.84);
  const out = [...gen(K_SPLIT, THR_B), ...K.slice(iTop, iBot), ...gen(THR_A, K_SPLIT)];
  out[out.length - 1] = out[0].slice(); return out;
}

// assembled placement (world y in mm, body bottom = 0)
const POS = { pad: -2.0, body: 0, tray: 3.0, rubber: 3.0 + 8.5, screw: 3.0 + 8.5 + R_BOSS /* head bearing face under the rubber boss */ };

// ---------- geometry helpers ----------
function splitRuns(pts, deg = 32) {
  const n = pts.length - 1; // closed (last == first)
  const corner = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
    const v1 = [b[0] - a[0], b[1] - a[1]], v2 = [c[0] - b[0], c[1] - b[1]];
    const l1 = Math.hypot(...v1), l2 = Math.hypot(...v2);
    if (l1 < 1e-6 || l2 < 1e-6) continue;
    const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2);
    corner[i] = Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI > deg;
  }
  let s = corner.indexOf(true); if (s < 0) s = 0;
  const runs = []; let cur = [pts[s]];
  for (let k = 1; k <= n; k++) { const i = (s + k) % n; cur.push(pts[i]); if (corner[i] || k === n) { runs.push(cur); cur = [pts[i]]; } }
  return runs;
}
function lathe(pts, segs = 160, phiStart = 0, phiLen = Math.PI * 2) {
  const geos = splitRuns(pts).filter(r => r.length >= 2).map(run => {
    const g = new THREE.LatheGeometry(run.map(p => new THREE.Vector2(Math.max(p[0], 0.001), p[1])), segs, phiStart, phiLen);
    g.deleteAttribute('uv'); return g.toNonIndexed();
  });
  const m = mergeGeometries(geos); m.computeBoundingSphere(); return m;
}
function caps(pts) {
  const sh = new THREE.Shape(pts.slice(0, -1).map(p => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.ShapeGeometry(sh, 4); g.deleteAttribute('uv');
  const a = g.clone().rotateY(-Math.PI / 2), b = g.clone().rotateY(Math.PI / 2);
  return mergeGeometries([a.toNonIndexed(), b.toNonIndexed()]);
}
// threaded shaft along +y from 0 to L
function threadGeo({ rc, h, pitch, L, tip = 0, shank = 0, nth = 72, sharp = true }) {
  const rows = Math.ceil(L / (pitch / 14)), pos = [], idx = [];
  const f = u => { const t = 1 - Math.abs(2 * u - 1); return sharp ? Math.min(1, Math.max(0, t * 1.35 - 0.15)) : Math.min(1, Math.max(0, t * 1.6 - 0.3)); };
  for (let j = 0; j <= rows; j++) {
    const z = j / rows * L;
    for (let i = 0; i <= nth; i++) {
      const th = i / nth * Math.PI * 2;
      let u = (z / pitch - th / (Math.PI * 2)); u -= Math.floor(u);
      let hh = h * f(u);
      if (z < shank) hh *= Math.max(0, (z - shank + 1.2) / 1.2);
      let r = rc + hh;
      if (tip > 0 && z > L - tip) { const s = (L - z) / tip; r = (rc * s + hh * Math.sqrt(s)); }
      r = Math.max(r, 0.02);
      pos.push(r * Math.sin(th), z, r * Math.cos(th));
    }
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < nth; i++) {
    const a = j * (nth + 1) + i, b = a + 1, c = a + nth + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g.toNonIndexed();
}
// pan head: bearing face at y=0, cylindrical rim, domed top towards -y with the drive recess cut in
// recess(x, z) -> depth (mm) of the drive recess at that point, 0 outside it
function panHead(r = 4.6, h = 2.8, recess = null) {
  const side = new THREE.LatheGeometry([[0.001, 0], [r, 0], [r, -h * 0.42]].map(q => new THREE.Vector2(q[0], q[1])), 96);
  side.deleteAttribute('uv');
  const NR = 140, NA = 720, pos = [], idx = [];
  const yTop = (rr) => -h * 0.42 - h * 0.58 * Math.sqrt(Math.max(0, 1 - (rr / r) ** 2));
  for (let j = 0; j <= NR; j++) {
    const rr = r * j / NR;
    for (let i = 0; i < NA; i++) {
      const a = i / NA * Math.PI * 2, x = rr * Math.cos(a), z = rr * Math.sin(a);
      const d = recess ? recess(x, z) : 0;
      pos.push(x, yTop(rr) + d, z);
    }
  }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) {
    const a = j * NA + i, b = j * NA + (i + 1) % NA, c = (j + 1) * NA + i, e = (j + 1) * NA + (i + 1) % NA;
    idx.push(a, b, c, b, e, c);
  }
  const top = new THREE.BufferGeometry(); top.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); top.setIndex(idx);
  const t = top.toNonIndexed(); t.computeVertexNormals();
  const s = side.toNonIndexed(); s.computeVertexNormals();
  return mergeGeometries([s, t]);
}
// Phillips recess: two crossed slots, sloping floor, depth dMax at the centre
function phillips(w = 0.95, L = 2.5, dMax = 1.6) {
  return (x, z) => {
    const ax = Math.abs(x), az = Math.abs(z);
    let rho = -1;
    if (az <= w / 2 && ax <= L) rho = ax; else if (ax <= w / 2 && az <= L) rho = az;
    const rc = Math.hypot(x, z); if (rc < w * 0.75) rho = Math.min(rho < 0 ? 9 : rho, rc);
    return rho < 0 ? 0 : dMax * (1 - 0.6 * rho / L);
  };
}
// hex socket: flat-to-flat s, flat floor with a shallow cone in the middle
function hexSocket(s = 2.5, dMax = 1.5) {
  const R = s / 2;
  return (x, z) => {
    let inside = true;
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; if (x * Math.cos(a) + z * Math.sin(a) > R) { inside = false; break; } }
    if (!inside) return 0;
    const rc = Math.hypot(x, z); return dMax + Math.max(0, 0.4 * (1 - rc / R));
  };
}

// ---------- textures ----------
function canvasTex(size, draw, repeat = 1) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); draw(x, size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.colorSpace = THREE.NoColorSpace; return t;
}
function noiseNormal(size = 512, amp = 6) {
  return canvasTex(size, (x, s) => {
    const im = x.createImageData(s, s);
    for (let i = 0; i < s * s; i++) { im.data[i * 4] = 128 + (Math.random() - 0.5) * amp; im.data[i * 4 + 1] = 128 + (Math.random() - 0.5) * amp; im.data[i * 4 + 2] = 255; im.data[i * 4 + 3] = 255; }
    x.putImageData(im, 0, 0);
  });
}
function diamondNormal(size = 512, cells = 24) {
  return canvasTex(size, (x, s) => {
    const im = x.createImageData(s, s); const c = s / cells;
    for (let y = 0; y < s; y++) for (let X = 0; X < s; X++) {
      const u = ((X + y) % c) / c - 0.5, v = ((X - y + s * 4) % c) / c - 0.5;
      const nx = (Math.abs(u) > 0.4 ? Math.sign(u) : 0) * 0.5 + (Math.random() - 0.5) * 0.12;
      const ny = (Math.abs(v) > 0.4 ? Math.sign(v) : 0) * 0.5 + (Math.random() - 0.5) * 0.12;
      const i = (y * s + X) * 4; im.data[i] = 128 + nx * 110; im.data[i + 1] = 128 + ny * 110; im.data[i + 2] = 230; im.data[i + 3] = 255;
    }
    x.putImageData(im, 0, 0);
  });
}
// satin floor: roughness multiplier ~0.9 with fine, low-contrast grain (no glossy blotches that mirror the parts)
function floorRough(size = 1024) {
  return canvasTex(size, (x, s) => {
    const im = x.createImageData(s, s);
    for (let i = 0; i < s * s; i++) { const g = 222 + (Math.random() - 0.5) * 34; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = g; im.data[i * 4 + 3] = 255; }
    x.putImageData(im, 0, 0);
    x.filter = 'blur(1px)'; x.drawImage(x.canvas, 0, 0); x.filter = 'none';
  }, 10);
}
function woodTex(size = 1024) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  x.fillStyle = '#1c1009'; x.fillRect(0, 0, size, size);
  for (let i = 0; i < 260; i++) { const y = Math.random() * size; x.strokeStyle = `rgba(${10 + Math.random() * 30},${5 + Math.random() * 15},2,${0.25 + Math.random() * 0.4})`; x.lineWidth = Math.random() * 3 + 0.5; x.beginPath(); x.moveTo(0, y); for (let X = 0; X <= size; X += 32) x.lineTo(X, y + Math.sin(X / 90 + i) * 6 + (Math.random() - 0.5) * 2); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- scene ----------
let M_RASTER_FLOOR = false;
export function createStudio(canvas, W, H, opt = {}) {
  const RASTER = !!opt.raster;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const env = new GradientEquirectTexture(256);
  env.topColor.set(0x1b1d22); env.bottomColor.set(0x010101); env.exponent = 1.6; env.update();
  scene.environment = env; scene.background = new THREE.Color(0x050506); scene.environmentIntensity = 1.0;
  if (RASTER) {
    M_RASTER_FLOOR = true;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    RectAreaLightUniformsLib.init();
    const es = new THREE.Scene(); es.background = new THREE.Color(0x07080a);
    const panel = (w, h, c, k, pos) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); es.add(m); };
    panel(6, 4.5, 0xfff1e4, 2.2, [-5, 6, 4]);   // key softbox
    panel(9, 1.2, 0x9fe9ee, 1.8, [4, 5, -6]);   // rim strip (turquoise tint)
    panel(10, 10, 0xffffff, 0.5, [0, 10, 1]); // top
    panel(30, 4, 0x2a2c31, 1, [0, 1.5, -12]); // backdrop glow
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: 0x0b0c0e })); fl.rotation.x = -Math.PI / 2; fl.position.y = -1; es.add(fl);
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(es, 0.02).texture; scene.environmentIntensity = 0.45;
  }

  const camera = new THREE.PerspectiveCamera(28, W / H, 5, 6000);

  const ACC = new THREE.Color(0x2fd3dd); // turquoise accent (MK2 used brass)
  const M = {
    plastic: new THREE.MeshPhysicalMaterial({ color: 0x121214, roughness: 0.46, metalness: 0, normalMap: noiseNormal(512, 10), normalScale: new THREE.Vector2(0.35, 0.35), specularIntensity: 0.6, side: THREE.DoubleSide }),
    plasticCut: new THREE.MeshPhysicalMaterial({ color: 0x4a4e55, roughness: 0.85, metalness: 0, side: THREE.DoubleSide }),
    trayCut: new THREE.MeshPhysicalMaterial({ color: 0x62666e, roughness: 0.85, metalness: 0, side: THREE.DoubleSide }),
    rubber: new THREE.MeshPhysicalMaterial({ color: 0x080809, roughness: 0.82, metalness: 0, sheen: 0.4, sheenRoughness: 0.6, sheenColor: new THREE.Color(0x2a2c30), side: THREE.DoubleSide }),
    rubberCut: new THREE.MeshPhysicalMaterial({ color: 0x1d6f76, roughness: 0.9, metalness: 0, side: THREE.DoubleSide }),
    foam: new THREE.MeshPhysicalMaterial({ color: 0x1c1d20, roughness: 0.92, metalness: 0, normalMap: diamondNormal(512, 22), normalScale: new THREE.Vector2(1.2, 1.2), side: THREE.DoubleSide }),
    zinc: new THREE.MeshPhysicalMaterial({ color: 0xd8d4c8, roughness: 0.22, metalness: 1, side: THREE.DoubleSide }),
    zincDark: new THREE.MeshPhysicalMaterial({ color: 0x3a3832, roughness: 0.4, metalness: 1, side: THREE.DoubleSide }),
    blackOx: new THREE.MeshPhysicalMaterial({ color: 0x1e1f22, roughness: 0.32, metalness: 1, side: THREE.DoubleSide }),
    floor: new THREE.MeshPhysicalMaterial({ color: opt.floorColor ?? 0x0e0f11, roughness: opt.floorRough ?? 0.6, roughnessMap: floorRough(), metalness: 0, specularIntensity: 0.7 }),
    wood: new THREE.MeshPhysicalMaterial({ map: woodTex(), roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.25, metalness: 0 }),
    glow: new THREE.MeshBasicMaterial({ color: 0x000000 }),
  };
  if (RASTER) { M.floor.roughnessMap = null; M.floor.roughness = 0.62; M.floor.color.set(0x0b0c0e); M.plastic.color.set(0x0d0d0f); }
  M.glow = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: ACC, emissiveIntensity: 6 });

  // lights
  const key = new THREE.RectAreaLight(0xfff1e4, 14, 300, 220); key.position.set(-260, 330, 200); key.lookAt(0, 10, 0);
  const rim = new THREE.RectAreaLight(0x9fe9ee, 9, 260, 60); rim.position.set(140, 300, -320); rim.lookAt(0, 20, 0);
  const top = new THREE.RectAreaLight(0xffffff, 5, 500, 500); top.position.set(0, 600, 60); top.lookAt(0, 0, 0);
  scene.add(key, rim, top);
  if (RASTER) {
    const sp = new THREE.SpotLight(0xfff1e4, 1.5e5, 0, 0.42, 0.9, 2); sp.position.set(-260, 330, 200); sp.target.position.set(0, 0, 0);
    sp.castShadow = true; sp.shadow.mapSize.set(2048, 2048); sp.shadow.radius = 6; sp.shadow.bias = -0.0004; sp.shadow.camera.near = 150; sp.shadow.camera.far = 900;
    scene.add(sp, sp.target);
    const sp2 = new THREE.SpotLight(0xffffff, 0.6e5, 0, 0.5, 1, 2); sp2.position.set(40, 520, 120); sp2.castShadow = true; sp2.shadow.mapSize.set(1024, 1024); sp2.shadow.radius = 12; sp2.shadow.bias = -0.0004;
    scene.add(sp2, sp2.target);
    scene.background = new THREE.Color(0x0b0c0f); key.intensity = 2.2; rim.intensity = 3.0; top.intensity = 0.6; renderer.toneMappingExposure = 1.45;
  }
  const back = new THREE.Mesh(new THREE.PlaneGeometry(6000, 3000), new THREE.MeshPhysicalMaterial({ color: 0x15161a, roughness: 0.95 }));
  back.position.set(0, 1400, -1500); scene.add(back);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), M.floor); floor.receiveShadow = true; floor.rotation.x = -Math.PI / 2; floor.position.y = POS.pad;
  scene.add(floor);

  // parts factory
  function foot(opts = {}) {
    const cut = !!opts.cut, phi0 = cut ? 0 : 0, phiL = cut ? Math.PI : Math.PI * 2;
    const g = new THREE.Group(); g.name = 'foot';
    const add = (name, geo, mat, y, capMat, capGeo) => {
      const grp = new THREE.Group(); grp.name = name; grp.position.y = y;
      grp.add(new THREE.Mesh(geo, mat)); if (cut && capGeo) grp.add(new THREE.Mesh(capGeo, capMat));
      g.add(grp); return grp;
    };
    const P = {};
    P.pad = add('pad', lathe(PAD, 128, phi0, phiL), M.foam, POS.pad, M.foam, caps(PAD));
    P.body = add('body', lathe(K, 180, phi0, phiL), M.plastic, POS.body, M.plasticCut, caps(K));
    P.tray = add('tray', lathe(T_UP, 180, phi0, phiL), M.plastic, POS.tray, M.trayCut, caps(T_UP).translate(-0.06, 0, 0));
    P.rubber = add('rubber', lathe(R, 160, phi0, phiL), M.rubber, POS.rubber, M.rubberCut, caps(R));
    P.screw = makeScrew(opts.screw || 'wood'); P.screw.position.y = POS.screw; g.add(P.screw);
    g.userData.parts = P; return g;
  }
  function makeScrew(kind) {
    const grp = new THREE.Group(); grp.name = 'screw';
    if (kind === 'metric') {
      grp.add(new THREE.Mesh(threadGeo({ rc: 2.05, h: 0.45, pitch: 0.8, L: 18, tip: 0.6, shank: 0, sharp: false, nth: 64 }), M.blackOx));
      grp.add(new THREE.Mesh(panHead(4.4, 3.0, hexSocket(2.5, 1.5)), M.blackOx));
    } else {
      grp.add(new THREE.Mesh(threadGeo({ rc: 1.65, h: 0.85, pitch: 2.2, L: 24, tip: 5, shank: 1.0, sharp: true, nth: 64 }), M.zinc));
      grp.add(new THREE.Mesh(panHead(4.6, 2.8, phillips(0.95, 2.5, 1.6)), M.zinc));
    }
    grp.userData.kind = kind; return grp;
  }
  // re-shape the body of a cut foot for a given tray lift (keeps the section threads meshed)
  function setBodyLift(footGroup, L) {
    const b = footGroup.userData.parts.body, prof = bodyProfile(L);
    const [m, c] = b.children; m.geometry.dispose(); m.geometry = lathe(prof, 180, 0, Math.PI);
    if (c) { c.geometry.dispose(); c.geometry = caps(prof); }
  }
  function ring(radius, tube = 0.45) { const m = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, 220), M.glow); m.rotation.x = Math.PI / 2; return m; }
  function plinth() { const m = new THREE.Mesh(new THREE.BoxGeometry(420, 46, 330), M.wood); return m; }

  let pt = null, composer = null;
  if (!RASTER) {
    pt = new WebGLPathTracer(renderer);
    pt.renderDelay = 0; pt.fadeDuration = 0; pt.minSamples = 0; pt.dynamicLowRes = false; pt.rasterizeScene = false;
    pt.bounces = 6; pt.filterGlossyFactor = 0.4; pt.tiles.set(2, 2);
    pt.setScene(scene, camera);
  } else {
    const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    const ao = new GTAOPass(scene, camera, W, H); ao.updateGtaoMaterial({ radius: 5, distanceExponent: 1.5, thickness: 2, scale: 1.2, samples: 12 }); ao.blendIntensity = 0.85; composer.addPass(ao);
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.75, 0.55, 2.0));
    composer.addPass(new OutputPass());
  }
  const shadowAll = o => o.traverse(c => { if (c.isMesh && c.material !== M.glow) { c.castShadow = true; c.receiveShadow = true; } });

  return { R_TOP_WORLD: 3.0 + 8.5 + R_TOP, THREE, renderer, scene, camera, pt, composer, RASTER, shadowAll, M, ACC, foot, makeScrew, setBodyLift, ring, plinth, floor, lights: { key, rim, top }, POS };
}
