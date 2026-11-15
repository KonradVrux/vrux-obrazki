// VRUX – Pioneer PL-570 / XL-A700 / PL-550 / XL-1550 replacement rubber: stills for the graphic instruction
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { init } from './film.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
const D2R = Math.PI / 180;

export async function initPL(W, H) {
  const F = await init(W, H, { raster: true });
  const S = F.S, { scene, camera } = S;
  scene.background = new THREE.Color(0xffffff).multiplyScalar(2.6);
  S.floor.material = new THREE.ShadowMaterial({ opacity: 0.2 }); S.floor.receiveShadow = true;
  scene.traverse(o => { if (o.isMesh && o.geometry?.parameters?.width === 6000) o.visible = false; });
  S.composer.passes = S.composer.passes.filter(p => !p.constructor.name.includes('Bloom'));
  S.renderer.toneMappingExposure = 1.15; scene.environmentIntensity = 0.9;
  S.lights.key.intensity = 3.2; S.lights.top.intensity = 2.0; S.lights.rim.intensity = 2.0; S.lights.rim.color.set(0xffffff);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d6d0, 1.4));
  { const pm = new THREE.PMREMGenerator(S.renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55; }
  // the studio is scaled for a ~60 mm foot; keep shadows crisp for small parts
  const ACC = new THREE.MeshBasicMaterial({ color: 0x0fa3ad });
  const M = {
    cup: new THREE.MeshStandardMaterial({ color: 0xdfe2e6, roughness: 0.26, metalness: 0.92 }),
    rust: new THREE.MeshStandardMaterial({ color: 0x9a8a7a, roughness: 0.55, metalness: 0.6 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.78, metalness: 0 }),
    old: new THREE.MeshStandardMaterial({ color: 0x3a3430, roughness: 0.95, metalness: 0, flatShading: true }),
    steel: new THREE.MeshStandardMaterial({ color: 0xa4a8ae, roughness: 0.32, metalness: 0.9 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xd2ab62, roughness: 0.3, metalness: 0.9 }),
    glue: new THREE.MeshStandardMaterial({ color: 0xfafaf6, roughness: 0.2, metalness: 0 }),
    tube: new THREE.MeshStandardMaterial({ color: 0xf4f4f2, roughness: 0.45, metalness: 0.1 }),
    cap: new THREE.MeshStandardMaterial({ color: 0x1d1e21, roughness: 0.6, metalness: 0 }),
    band: new THREE.MeshStandardMaterial({ color: 0x0fa3ad, roughness: 0.5, metalness: 0 }),
    cloth: new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 1, metalness: 0 }),
  };
  const loader = new STLLoader(); const G = {};
  for (const n of ['rubber', 'cup', 'stud', 'nut', 'washer']) {
    const g = await loader.loadAsync(`/pl570/${n}.stl`); g.rotateX(-Math.PI / 2); g.computeVertexNormals(); G[n] = g;
  }
  // smooth normals for the rubber and cup (STL is flat-shaded)
  const { mergeVertices } = await import('three/examples/jsm/utils/BufferGeometryUtils.js');
  const smooth = (g, ang = 35) => { const { toCreasedNormals } = BU; return toCreasedNormals(g, ang * D2R); };
  const BU = await import('three/examples/jsm/utils/BufferGeometryUtils.js');
  for (const n of ['rubber', 'cup', 'washer']) G[n] = BU.toCreasedNormals(G[n], 35 * D2R);
  // crumbled old rubber: rubber with noise, slightly squashed
  const oldG = G.rubber.clone(); { const p = oldG.attributes.position; const rnd = (x, y, z) => Math.sin(x * 1.7 + y * 2.3) * Math.cos(z * 1.9 - x) ;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 0.55 * rnd(x, y, z); p.setXYZ(i, x * (1 + 0.03 * k), y * 0.93 + k * 0.5, z * (1 + 0.03 * k)); }
    oldG.computeVertexNormals(); }
  G.old = oldG;

  const mesh = (g, m) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = true; return o; };
  const Y = { rubber: 0, stud: 17.7, nutLo: 18.3, nutUp: 21.5, washer: 23.7 };

  function setCam(az, el, dist, tx, ty, tz, fov = 28) {
    const a = az * D2R, e = el * D2R; camera.fov = fov; camera.updateProjectionMatrix();
    camera.position.set(tx + dist * Math.cos(e) * Math.sin(a), ty + dist * Math.sin(e), tz + dist * Math.cos(e) * Math.cos(a));
    camera.lookAt(tx, ty, tz); camera.updateMatrixWorld();
  }
  function arcArrow(radius, y, start, sweep, tube = 1.1, dir = 1) {
    const g = new THREE.Group();
    const arc = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 160, sweep * D2R), ACC);
    arc.rotation.x = -Math.PI / 2; arc.rotation.z = start * D2R; g.add(arc);
    const endA = (dir > 0 ? start + sweep : start) * D2R;
    const head = new THREE.Mesh(new THREE.ConeGeometry(tube * 3.2, tube * 8, 24), ACC);
    head.position.set(radius * Math.cos(endA), 0, -radius * Math.sin(endA));
    const t = new THREE.Vector3(-Math.sin(endA), 0, -Math.cos(endA)).multiplyScalar(dir > 0 ? 1 : -1);
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t); head.position.addScaledVector(t, tube * 3); g.add(head);
    g.position.y = y; return g;
  }
  function lineArrow(from, to, tube = 1.1) {
    const g = new THREE.Group(); const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const d = b.clone().sub(a), L = d.length(), u = d.clone().normalize(), hl = tube * 8;
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(tube, tube, L - hl, 16), ACC);
    sh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), u); sh.position.copy(a).addScaledVector(u, (L - hl) / 2); g.add(sh);
    const hd = new THREE.Mesh(new THREE.ConeGeometry(tube * 3.2, hl, 24), ACC);
    hd.quaternion.copy(sh.quaternion); hd.position.copy(a).addScaledVector(u, L - hl / 2); g.add(hd); return g;
  }
  let objs = [];
  const add = o => { o.traverse(c => { if (c.isMesh) { const acc = c.material === ACC; c.castShadow = !acc; c.receiveShadow = !acc; } }); scene.add(o); objs.push(o); return o; };
  const clearAll = () => { objs.forEach(o => scene.remove(o)); objs = []; };

  const cup = (m = M.cup) => mesh(G.cup, m);
  const rubber = (old = false) => mesh(old ? G.old : G.rubber, old ? M.old : M.rubber);
  const stud = () => mesh(G.stud, M.brass), nut = () => mesh(G.nut, M.steel), washer = () => mesh(G.washer, M.steel);
  function studSet(dy = 0, opt = {}) { // stud with both nuts (+washer) as in the assembled foot; dy shifts the whole set
    const g = new THREE.Group();
    const s = stud(); s.position.y = Y.stud; g.add(s);
    const nu = nut(); nu.position.y = Y.nutUp + (opt.upGap || 0); nu.rotation.y = 0.3; g.add(nu);
    const nl = nut(); nl.position.y = Y.nutLo - (opt.loGap || 0); nl.rotation.y = 0.1; g.add(nl);
    if (opt.washer) { const w = washer(); w.position.y = Y.washer + (opt.wGap || 0); g.add(w); }
    g.position.y = dy; return g;
  }
  function glueTube() { // generic tube with a cap, lying down
    const g = new THREE.Group(); const L = 78, R = 11;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 48), M.tube); g.add(body);
    const crimp = new THREE.Mesh(new THREE.BoxGeometry(R * 2.3, 9, 1.6), M.tube); crimp.position.y = -L / 2 - 3.5; g.add(crimp);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.15, R + 0.15, 16, 48), M.band); band.position.y = 6; g.add(band);
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(4, R, 6, 48), M.tube); sh.position.y = L / 2 + 3; g.add(sh);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 6.2, 16, 32), M.cap); cap.position.y = L / 2 + 13; g.add(cap);
    g.traverse(c => { if (c.isMesh) c.castShadow = c.receiveShadow = true; });
    g.rotation.z = Math.PI / 2; g.position.y = R; return g;
  }
  function glueBead(r = 15.5, y = 5.6) { const t = mesh(new THREE.TorusGeometry(r, 1.7, 16, 120), M.glue); t.rotation.x = -Math.PI / 2; t.position.y = y; return t; }

  const shots = {
    kit() {
      [[-50, -24, false], [-8, -32, true], [-48, 22, true], [-4, 16, false]].forEach(([x, z, flip], i) => {
        const r = add(rubber()); r.position.set(x, flip ? 22 : -6, z); if (flip) r.rotation.x = Math.PI; r.rotation.y = i * 0.7;
      });
      const t = add(glueTube()); t.position.set(64, 11, 14); t.rotation.y = 0.6;
      setCam(-8, 42, 305, 8, 4, 0, 30);
    },
    step1() { // take the stud out and remove the old, destroyed rubber
      add(cup());
      const r = add(rubber(true)); r.position.y = 30;
      const s = add(studSet(46, { washer: true })); s.rotation.y = 0.4;
      add(lineArrow([34, 34, 0], [34, 60, 0], 0.9));
      add(lineArrow([-22, 66, 0], [-22, 92, 0], 0.9));
      setCam(-24, 18, 265, 2, 42, 0, 30);
    },
    step2() { // clean the inside thoroughly; polish the outside only now (before gluing)
      add(cup());
      add(arcArrow(16, 7.5, 200, 280, 0.9, 1));
      add(arcArrow(31, 15, 210, 120, 1.0, -1));
      const cl = add(mesh(new THREE.SphereGeometry(12, 24, 16), M.cloth)); cl.scale.set(1.5, 0.3, 1.0); cl.position.set(50, 3.5, 24); cl.rotation.y = 0.6;
      setCam(-18, 48, 215, 8, 6, 4, 30);
    },
    step3() { // nut into the pocket on top of the rubber, stud with washer screwed in, second nut from underneath
      add(rubber());
      const nu = add(nut()); nu.position.y = Y.nutUp + 13; nu.rotation.y = 0.3;
      const s = add(new THREE.Group()); const st = stud(); st.position.y = Y.stud; s.add(st);
      const w = washer(); w.position.y = Y.washer; s.add(w); s.position.y = 30;
      add(lineArrow([17, 44, 0], [17, 30, 0], 0.8));
      add(lineArrow([17, 72, 0], [17, 58, 0], 0.8));
      add(arcArrow(10, 30 + Y.stud + 9.2, 200, 240, 0.6, -1));
      setCam(-22, 14, 190, 0, 40, 0, 30);
    },
    step4() { // glue the rubber (with stud) into the cleaned cup
      add(cup());
      add(glueBead(15.8, 5.6));
      const g = new THREE.Group(); g.add(rubber()); g.add(studSet(0, { washer: true })); g.position.y = 44; add(g);
      add(lineArrow([36, 70, 0], [36, 46, 0], 0.9));
      setCam(-20, 44, 240, 0, 30, 0, 30);
    },
    under() { // rubber turned over: second nut screwed onto the stud inside the rubber, a drop of glue on it
      const g = new THREE.Group();
      g.add(rubber());
      const st = stud(); st.position.y = Y.stud; g.add(st);
      const nu = nut(); nu.position.y = Y.nutUp; nu.rotation.y = 0.3; g.add(nu);
      const w = washer(); w.position.y = Y.washer; g.add(w);
      const nl = nut(); nl.position.y = Y.nutLo - 3.5; nl.rotation.y = 0.1; g.add(nl);
      const drop = mesh(new THREE.SphereGeometry(1.8, 24, 16), M.glue); drop.scale.set(1, 0.7, 1); drop.position.set(2.6, Y.nutLo - 3.5 - 0.2, 1.2); g.add(drop);
      g.rotation.x = Math.PI; g.position.y = 52; add(g);
      // glue tube nozzle coming in from the side
      const tip = new THREE.Group();
      const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 2.4, 14, 32), M.tube); c1.position.y = 7; tip.add(c1);
      const c2 = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.8, 12, 32), M.tube); c2.position.y = 20; tip.add(c2);
      tip.traverse(c => { if (c.isMesh) c.castShadow = true; });
      tip.position.set(4.2, 52 - Y.nutLo + 3.5 + 3.2, 2.0); tip.rotation.set(0.2, 0, -0.6); add(tip);
      add(arcArrow(8.5, 52 - Y.nutLo + 3.5 + 1.6, 160, 220, 0.6, -1));
      setCam(-30, 58, 125, 4, 36, 0, 30);
    },
    weight() { // glued feet weighed down evenly for 2 hours
      const P = [[-45, -45], [45, -45], [-45, 45], [45, 45]];
      P.forEach(([x, z], i) => { const f = add(new THREE.Group()); f.add(cup()); f.add(rubber()); f.add(studSet(0, { washer: true })); f.position.set(x, 0, z); f.rotation.y = i; });
      const top = Y.stud + 25.5;
      const board = add(mesh(new THREE.BoxGeometry(150, 10, 150), new THREE.MeshStandardMaterial({ color: 0xc8a57a, roughness: 0.7 }))); board.position.y = top + 5;
      const wgt = add(mesh(new THREE.CylinderGeometry(30, 30, 34, 64), M.steel)); wgt.position.y = top + 10 + 17;
      const hd = add(mesh(new THREE.TorusGeometry(10, 3, 16, 48, Math.PI), M.cap)); hd.position.y = top + 10 + 34; 
      add(lineArrow([0, top + 110, 0], [0, top + 62, 0], 1.4));
      setCam(-28, 12, 480, 0, 40, 0, 30);
    },
    done() { // finished foot
      add(cup()); add(rubber()); add(studSet(0, { washer: true }));
      setCam(-24, 26, 190, 0, 22, 0, 30);
    },
    rubber() { const r = add(rubber()); r.rotation.y = 0.3; setCam(-20, 30, 150, 0, 12, 0, 30); },
    rubberB() { const r = add(rubber()); r.rotation.x = Math.PI; r.position.y = 22; setCam(-20, 40, 150, 0, 8, 0, 30); },
    section() { // cut view to check the assembly
      const clip = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)]; S.renderer.localClippingEnabled = true;
      const g = new THREE.Group(); g.add(cup()); g.add(rubber()); g.add(studSet(0, { washer: true }));
      g.traverse(c => { if (c.isMesh) { c.material = c.material.clone(); c.material.clippingPlanes = clip; c.material.side = THREE.DoubleSide; } }); add(g);
      setCam(-30, 18, 200, 0, 20, 0, 30);
    },
  };
  async function still(name) { clearAll(); shots[name](); S.composer.render(); return true; }
  return { F, S, still, canvas: F.canvas, setCam };
}
