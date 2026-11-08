// VRUX AVC A56 Low Profile – film renderer (three.js + three-gpu-pathtracer)
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { WebGLPathTracer, GradientEquirectTexture } from 'three-gpu-pathtracer';

// ---------- profiles (r, z) in mm ----------
const K = [[22.95,14.61],[23.08,14.87],[23.07,15.17],[22.89,15.47],[22.42,16.01],[22.34,16.28],[22.49,16.58],[22.97,17.13],[23.07,17.36],[23.09,17.58],[22.96,17.88],[22.4,18.55],[22.34,18.72],[22.4,18.95],[23.3,20.0],[26.5,20.0],[28.0,18.5],[28.0,1.5],[26.5,0.0],[22.5,0.0],[22.5,1.0],[11.5,1.0],[11.0,1.5],[11.0,3.0],[21.95,3.0],[21.95,3.3],[22.6,3.3],[22.4,3.54],[22.35,3.84],[22.53,4.13],[22.98,4.65],[23.08,4.86],[23.09,5.1],[22.94,5.4],[22.4,6.05],[22.34,6.26],[22.45,6.53],[23.02,7.21],[23.1,7.51],[23.01,7.81],[22.42,8.52],[22.34,8.8],[22.48,9.07],[22.96,9.61],[23.08,9.86],[23.09,10.06],[22.97,10.36],[22.41,11.03],[22.35,11.3],[22.44,11.51],[22.99,12.17],[23.1,12.47],[23.03,12.77],[22.46,13.46],[22.34,13.76],[22.45,14.03],[22.95,14.61]];
const T = [[22.97,3.35],[22.86,3.14],[22.34,2.55],[22.24,2.25],[22.36,1.93],[22.92,1.26],[22.99,1.07],[22.98,0.88],[22.1,0.0],[20.1,0.0],[19.1,1.0],[19.1,9.0],[11.5,9.0],[11.0,9.5],[11.0,17.0],[11.5,17.5],[22.1,17.5],[22.26,17.34],[22.26,17.13],[22.34,16.95],[22.85,16.37],[23.0,16.05],[22.92,15.73],[22.37,15.09],[22.25,14.71],[22.38,14.41],[22.89,13.81],[23.0,13.54],[22.94,13.26],[22.32,12.51],[22.24,12.25],[22.35,11.95],[22.86,11.35],[22.99,11.07],[22.95,10.8],[22.36,10.07],[22.24,9.76],[22.32,9.48],[22.84,8.89],[22.99,8.59],[22.9,8.2],[22.37,7.58],[22.25,7.28],[22.35,6.94],[22.81,6.43],[22.99,6.08],[22.92,5.74],[22.38,5.09],[22.24,4.73],[22.35,4.44],[22.96,3.69],[22.97,3.35]];
// hemispherical AVC rubber suspension (shell), local z = 0 at its base
function rubberProfile() {
  const p = [[16.0,0.0],[18.6,0.0],[18.9,0.3],[18.9,1.7],[18.5,2.0],[14.0,3.5],[11.2,6.5],[10.7,8.5],[10.7,17.4]];
  for (let i = 1; i <= 10; i++) { const a = i / 10 * Math.PI / 2; const r = 10.7 * Math.cos(a), z = 17.4 + 3.8 * Math.sin(a); if (r >= 2.6) p.push([r, z]); }
  const zt = 17.4 + 3.8 * Math.sqrt(1 - (2.6 / 10.7) ** 2);
  p.push([2.6, zt], [2.6, 18.2]);
  for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; p.push([2.6 + (8.2 - 2.6) * Math.sin(a), 18.2 - 1.2 * (1 - Math.cos(a))]); }
  p.push([8.2, 8.5], [8.7, 6.3], [11.4, 3.6], [16.0, 2.2], [16.0, 0.0]);
  return p;
}
const R = rubberProfile();
const PAD = [[0.01,0],[22.2,0],[22.4,0.2],[22.4,2.8],[22.2,3.0],[0.01,3.0],[0.01,0]];

// assembled placement (world y in mm, body bottom = 0)
const POS = { pad: -2.0, body: 0, tray: 3.0, rubber: 3.0, screw: 21.2 /* head bearing face under the rubber boss */ };

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
function panHead(r = 4.6, h = 2.8) {
  const p = [[0.001, 0], [r, 0], [r, -h * 0.42]];
  for (let i = 1; i <= 8; i++) { const a = i / 8 * Math.PI / 2; p.push([r - (r - 0.001) * Math.sin(a) * 1.0, -h * 0.42 - h * 0.58 * Math.sin(a)]); }
  const g = new THREE.LatheGeometry(p.map(q => new THREE.Vector2(Math.max(q[0], 0.001), q[1])), 96);
  g.deleteAttribute('uv'); return g.toNonIndexed();
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
function floorRough(size = 1024) {
  return canvasTex(size, (x, s) => {
    x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) { const g = 90 + Math.random() * 90; x.fillStyle = `rgba(${g},${g},${g},0.25)`; const r = Math.random() * 6 + 1; x.beginPath(); x.arc(Math.random() * s, Math.random() * s, r, 0, 7); x.fill(); }
  }, 6);
}
function woodTex(size = 1024) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  x.fillStyle = '#1c1009'; x.fillRect(0, 0, size, size);
  for (let i = 0; i < 260; i++) { const y = Math.random() * size; x.strokeStyle = `rgba(${10 + Math.random() * 30},${5 + Math.random() * 15},2,${0.25 + Math.random() * 0.4})`; x.lineWidth = Math.random() * 3 + 0.5; x.beginPath(); x.moveTo(0, y); for (let X = 0; X <= size; X += 32) x.lineTo(X, y + Math.sin(X / 90 + i) * 6 + (Math.random() - 0.5) * 2); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- scene ----------
export function createStudio(canvas, W, H) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const env = new GradientEquirectTexture(256);
  env.topColor.set(0x1b1d22); env.bottomColor.set(0x010101); env.exponent = 1.6; env.update();
  scene.environment = env; scene.background = new THREE.Color(0x050506); scene.environmentIntensity = 1.0;

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
    floor: new THREE.MeshPhysicalMaterial({ color: 0x17181b, roughness: 0.55, roughnessMap: floorRough(), metalness: 0 }),
    wood: new THREE.MeshPhysicalMaterial({ map: woodTex(), roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.25, metalness: 0 }),
    glow: new THREE.MeshBasicMaterial({ color: 0x000000 }),
  };
  M.glow = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: ACC, emissiveIntensity: 6 });

  // lights
  const key = new THREE.RectAreaLight(0xfff1e4, 14, 300, 220); key.position.set(-260, 330, 200); key.lookAt(0, 10, 0);
  const rim = new THREE.RectAreaLight(0x9fe9ee, 9, 260, 60); rim.position.set(140, 300, -320); rim.lookAt(0, 20, 0);
  const top = new THREE.RectAreaLight(0xffffff, 5, 500, 500); top.position.set(0, 600, 60); top.lookAt(0, 0, 0);
  scene.add(key, rim, top);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(6000, 3000), new THREE.MeshPhysicalMaterial({ color: 0x15161a, roughness: 0.95 }));
  back.position.set(0, 1400, -1500); scene.add(back);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), M.floor); floor.rotation.x = -Math.PI / 2; floor.position.y = POS.pad;
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
    P.tray = add('tray', lathe(T, 180, phi0, phiL), M.plastic, POS.tray, M.trayCut, caps(T).translate(-0.06, 0, 0));
    P.rubber = add('rubber', lathe(R, 160, phi0, phiL), M.rubber, POS.rubber, M.rubberCut, caps(R));
    P.screw = makeScrew(opts.screw || 'wood'); P.screw.position.y = POS.screw; g.add(P.screw);
    g.userData.parts = P; return g;
  }
  function makeScrew(kind) {
    const grp = new THREE.Group(); grp.name = 'screw';
    if (kind === 'metric') {
      grp.add(new THREE.Mesh(threadGeo({ rc: 2.05, h: 0.45, pitch: 0.8, L: 18, tip: 0.6, shank: 0, sharp: false, nth: 64 }), M.blackOx));
      const hd = new THREE.Mesh(panHead(4.4, 3.0), M.blackOx); grp.add(hd);
      const hex = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.6, 6), new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.6, metalness: 1 }));
      hex.position.y = -3.0; grp.add(hex);
    } else {
      grp.add(new THREE.Mesh(threadGeo({ rc: 1.65, h: 0.85, pitch: 2.2, L: 24, tip: 5, shank: 1.0, sharp: true, nth: 64 }), M.zinc));
      grp.add(new THREE.Mesh(panHead(4.6, 2.8), M.zinc));
      for (const rot of [0, Math.PI / 2]) { const b = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.9, 0.85), M.zincDark); b.rotation.y = rot; b.position.y = -2.72; grp.add(b); }
    }
    grp.userData.kind = kind; return grp;
  }
  function ring(radius, tube = 0.45) { const m = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, 220), M.glow); m.rotation.x = Math.PI / 2; return m; }
  function plinth() { const m = new THREE.Mesh(new THREE.BoxGeometry(420, 46, 330), M.wood); return m; }

  const pt = new WebGLPathTracer(renderer);
  pt.renderDelay = 0; pt.fadeDuration = 0; pt.minSamples = 0; pt.dynamicLowRes = false; pt.rasterizeScene = false;
  pt.bounces = 6; pt.filterGlossyFactor = 0.4; pt.tiles.set(2, 2);
  pt.setScene(scene, camera);

  return { THREE, renderer, scene, camera, pt, M, ACC, foot, makeScrew, ring, plinth, floor, lights: { key, rim, top }, POS };
}
