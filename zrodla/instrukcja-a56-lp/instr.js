// VRUX AVC A56 Low Profile – stills for the graphic mounting instruction (light studio, raster)
import * as THREE from 'three';
import { init } from './film.js';

const D2R = Math.PI / 180;

export async function initInstr(W, H, variant = 'lp') {
  const F = await init(W, H, { raster: true });
  const S = F.S, { scene, camera } = S;
  let SCREW = 'wood';
  if (variant === 'mk2') { // A56 MK2: taller body and deeper threaded insert, brass-coloured insert, metric screw
    const SB = 1.5, ST = 1.6, baseFoot = S.foot;
    const insertMat = new THREE.MeshStandardMaterial({ color: 0xc29a58, roughness: 0.5, metalness: 0.15 });
    const POS = { pad: S.POS.pad, body: 0, tray: 3.0, rubber: 20.0 };
    POS.screw = POS.rubber + 6.0;
    S.POS = POS; S.R_TOP_WORLD = POS.rubber + 19.0; SCREW = 'metric';
    S.foot = (o = {}) => {
      const f = baseFoot({ ...o, screw: o.screw || 'metric' }); const P = f.userData.parts;
      P.body.scale.y = SB; P.tray.scale.y = ST; P.tray.position.y = POS.tray;
      P.tray.traverse(c => { if (c.isMesh) c.material = insertMat; });
      P.rubber.position.y = POS.rubber; P.screw.position.y = POS.screw; return f;
    };
  }

  // ---- light, print-friendly studio ----
  const BG = 0xffffff;
  scene.background = new THREE.Color(BG).multiplyScalar(2.6);
  S.floor.material = new THREE.ShadowMaterial({ opacity: 0.22 });
  S.floor.receiveShadow = true;
  scene.traverse(o => { if (o.isMesh && o.geometry?.parameters?.width === 6000) o.visible = false; });
  S.composer.passes = S.composer.passes.filter(p => !p.constructor.name.includes('Bloom'));
  S.renderer.toneMappingExposure = 1.15;
  scene.environmentIntensity = 0.9;
  S.lights.key.intensity = 3.2; S.lights.top.intensity = 2.0; S.lights.rim.intensity = 2.0; S.lights.rim.color.set(0xffffff);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d6d0, 1.4); scene.add(hemi);
  // plastic a touch lighter so edges read on paper
  S.M.plastic.color.set(0x1a1b1e); S.M.rubber.color.set(0x111113);

  const ACC = new THREE.MeshBasicMaterial({ color: 0x0fa3ad });
  const woodBottom = new THREE.MeshStandardMaterial({ color: 0x6a6763, roughness: 0.85, metalness: 0 });
  const veneer = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.55, metalness: 0 });
  const alu = new THREE.MeshStandardMaterial({ color: 0xb9bcc0, roughness: 0.35, metalness: 0.9 });
  const mat = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.9, metalness: 0 });

  function setCam(az, el, dist, tx, ty, tz, fov = 28) {
    const a = az * D2R, e = el * D2R;
    camera.fov = fov; camera.updateProjectionMatrix();
    camera.position.set(tx + dist * Math.cos(e) * Math.sin(a), ty + dist * Math.sin(e), tz + dist * Math.cos(e) * Math.cos(a));
    camera.lookAt(tx, ty, tz); camera.updateMatrixWorld();
  }

  // ---- arrows ----
  // arc around the vertical axis at height y; dir +1 = counter-clockwise seen from above
  function arcArrow(radius, y, start, sweep, tube = 1.1, dir = 1) {
    const g = new THREE.Group();
    const arc = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 160, sweep * D2R), ACC);
    arc.rotation.x = -Math.PI / 2; arc.rotation.z = start * D2R; g.add(arc);
    const endA = (dir > 0 ? start + sweep : start) * D2R;
    const head = new THREE.Mesh(new THREE.ConeGeometry(tube * 3.2, tube * 8, 24), ACC);
    head.position.set(radius * Math.cos(endA), 0, -radius * Math.sin(endA));
    // tangent direction for CCW (seen from above, +y up) at angle a: (-sin a, 0, -cos a)
    const t = new THREE.Vector3(-Math.sin(endA), 0, -Math.cos(endA)).multiplyScalar(dir > 0 ? 1 : -1);
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t);
    head.position.addScaledVector(t, tube * 3);
    g.add(head);
    if (dir < 0) { /* arc drawn the same, head placed at the start pointing backwards */ }
    g.position.y = y; return g;
  }
  function lineArrow(from, to, tube = 1.1) {
    const g = new THREE.Group(); const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const d = b.clone().sub(a), L = d.length(), u = d.clone().normalize();
    const hl = tube * 8;
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(tube, tube, L - hl, 16), ACC);
    sh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), u); sh.position.copy(a).addScaledVector(u, (L - hl) / 2); g.add(sh);
    const hd = new THREE.Mesh(new THREE.ConeGeometry(tube * 3.2, hl, 24), ACC);
    hd.quaternion.copy(sh.quaternion); hd.position.copy(a).addScaledVector(u, L - hl / 2); g.add(hd);
    return g;
  }

  let objs = [];
  const add = o => { S.shadowAll(o); o.traverse(c => { if (c.isMesh && c.material === ACC) { c.castShadow = false; } }); scene.add(o); objs.push(o); return o; };
  const clearAll = () => { objs.forEach(o => scene.remove(o)); objs = []; };

  // foot whose tray+rubber(+screw) are turned upside down onto a surface at height s (turntable bottom)
  function invertedTop(s, screwLift = 0, withScrew = true) {
    const f = S.foot(); const P = f.userData.parts;
    f.remove(P.pad); f.remove(P.body); if (!withScrew) f.remove(P.screw);
    P.screw.position.y = S.POS.screw - screwLift;
    f.rotation.x = Math.PI; f.position.y = s + S.R_TOP_WORLD; return f;
  }
  function invertedBody(s, lift = 0) {
    const f = S.foot(); const P = f.userData.parts;
    f.remove(P.tray); f.remove(P.rubber); f.remove(P.screw);
    f.rotation.x = Math.PI; f.position.y = s + S.R_TOP_WORLD + lift; return f;
  }
  function plinthBottom(w = 260, d = 200, h = 40) { // turntable lying upside down: bottom face up at y = 0
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [veneer, veneer, woodBottom, veneer, veneer, veneer]);
    m.position.y = -h / 2; return m;
  }

  function turntable(lift) { // simple turntable: plinth + platter + mat, standing on 4 feet
    const g = new THREE.Group(); const w = 420, d = 330, h = 60;
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), veneer); p.position.y = h / 2; g.add(p);
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(150, 150, 14, 96), alu); pl.position.set(-40, h + 9, 0); g.add(pl);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(146, 146, 2.5, 96), mat); m.position.set(-40, h + 17, 0); g.add(m);
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 18, 24), alu); sp.position.set(-40, h + 26, 0); g.add(sp);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(26, 28, 20, 48), alu); base.position.set(150, h + 10, -100); g.add(base);
    const A = new THREE.Vector3(150, h + 30, -100), B = new THREE.Vector3(-5, h + 30, 75), dv = B.clone().sub(A);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, dv.length(), 24), alu);
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dv.clone().normalize()); arm.position.copy(A).addScaledVector(dv, 0.5); g.add(arm);
    const hs = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 26), mat); hs.position.copy(B).add(new THREE.Vector3(0, -6, 0)); hs.rotation.y = 0.8; g.add(hs);
    g.position.y = lift; return g;
  }
  const FEET = [[-170, -125], [170, -125], [-170, 125], [170, 125]];

  const shots = {
    kit() {
      [[-38, -36], [38, -36], [-38, 40], [38, 40]].forEach(([x, z], i) => { const f = add(S.foot()); f.remove(f.userData.parts.screw); f.position.set(x - 30, 0, z); f.rotation.y = i * 0.6; });
      [-36, -12, 12, 36].forEach((z, i) => { const s = add(S.makeScrew(SCREW)); s.rotation.set(0, -0.15, Math.PI / 2); s.position.set(70, S.POS.pad + 4.6, z); });
      setCam(-10, 38, 380, -12, 4, 4, 30);
    },
    step1() { // unscrew body completely from the tray
      const f = add(S.foot()); const P = f.userData.parts; f.remove(P.screw);
      for (const n of ['tray', 'rubber']) P[n].position.y = S.POS[n] + 26;
      add(arcArrow(34, 6, 200, 130, 1.3, -1));
      add(lineArrow([0, 40, 34], [0, 64, 34], 1.3));
      setCam(-20, 22, 250, 0, 24, 0, 30);
    },
    step2() { // tray with rubber down on the turntable bottom, screw through the centre
      add(plinthBottom());
      const t = add(invertedTop(0, 26)); t.position.x = 40; t.position.z = 20;
      add(lineArrow([40, 78, 20], [40, 58, 20], 1.2));
      const a = add(arcArrow(10, 0, 220, 230, 0.8, -1)); a.position.set(40, 50, 20);
      setCam(-25, 38, 300, 40, 34, 20, 30);
    },
    step3() { // body screwed back onto the tray
      add(plinthBottom());
      const t = add(invertedTop(0, 0)); t.position.set(40, t.position.y, 20);
      const b = add(invertedBody(0, 22)); b.position.x = 40; b.position.z = 20;
      const a = add(arcArrow(35, 0, 190, 150, 1.3, -1)); a.position.set(40, 42, 20);
      add(lineArrow([40 + 48, 70, 20], [40 + 48, 46, 20], 1.2));
      setCam(-25, 30, 280, 36, 24, 12, 30);
    },
    step4() { // close-up: turntable corner on a foot, turn the body to level
      add(turntable(S.R_TOP_WORLD));
      FEET.forEach(([x, z]) => { const f = add(S.foot()); f.position.set(x, 0, z); });
      const a = add(arcArrow(37, 9, 190, 150, 1.4, -1)); a.position.set(-170, 0, 125);
      add(lineArrow([-170 - 50, 14, 125], [-170 - 50, 40, 125], 1.2));
      add(lineArrow([-170 - 50, 26, 125], [-170 - 50, 0, 125], 1.2));
      setCam(-34, 14, 470, -120, 30, 90, 30);
    },
    done() { // finished turntable on four feet
      add(turntable(S.R_TOP_WORLD));
      FEET.forEach(([x, z]) => { const f = add(S.foot()); f.position.set(x, 0, z); });
      setCam(-32, 16, 1050, -10, 60, 0, 30);
    },
  };

  async function still(name) {
    clearAll(); shots[name](); S.composer.render();
    return true;
  }
  return { F, S, still, canvas: F.canvas, setCam };
}
