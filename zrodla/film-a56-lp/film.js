// VRUX AVC A56 Low Profile – film timeline, frame loop, encoder, uploader
import * as THREE from 'three';
import { createStudio } from './lp.js';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
const easeIO = t => t < 0 ? 0 : t > 1 ? 1 : (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const D2R = Math.PI / 180;
const _mc = new MessageChannel(); const _q = []; _mc.port1.onmessage = () => { const f = _q.shift(); f && f(); };
const yieldNow = () => new Promise(r => { _q.push(r); _mc.port2.postMessage(0); });

export async function init(W = 1920, H = 1080) {
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:auto;z-index:99999;background:#000';
  document.body.appendChild(canvas);
  const S = createStudio(canvas, W, H);
  const { scene, camera, pt } = S;
  let current = []; // objects added by the active shot
  const state = { log: [] };

  function setCam(az, el, dist, tx, ty, tz) {
    const a = az * D2R, e = el * D2R;
    camera.position.set(tx + dist * Math.cos(e) * Math.sin(a), ty + dist * Math.sin(e), tz + dist * Math.cos(e) * Math.cos(a));
    camera.lookAt(tx, ty, tz); camera.updateMatrixWorld();
  }
  function clear() { current.forEach(o => scene.remove(o)); current = []; }
  function add(o) { scene.add(o); current.push(o); return o; }

  const EXP = { pad: -30, body: 0, screw: 8, rubber: 55, tray: 85 };

  const shots = {
    hero: { dur: 5.0, setup() { this.f = add(S.foot()); },
      update(t) { const u = t / this.dur; setCam(lerp(-38, -12, easeIO(u)), lerp(19, 14, u), lerp(205, 170, easeIO(u)), 0, 15, 0); return t === 0; },
      anchors() { return {}; } },
    explode: { dur: 7.0, setup() { this.f = add(S.foot()); },
      update(t) {
        const P = this.f.userData.parts;
        const out = easeIO(t / 2.0), back = easeIO((t - 5.0) / 1.8), k = out * (1 - back);
        const order = { pad: 0, body: 0, screw: 0.15, rubber: 0.08, tray: 0 };
        for (const n of Object.keys(EXP)) {
          const kk = n === 'screw' ? out * (1 - easeIO((t - 5.25) / 1.55)) : k;
          P[n].position.y = S.POS[n] + EXP[n] * kk;
        }
        this.f.position.y = 32 * k;
        setCam(lerp(18, 40, t / this.dur), lerp(12, 15, t / this.dur), lerp(300, 440, k), 0, lerp(14, 62, k), 0);
        return true;
      },
      anchors() { const P = this.f.userData.parts; const o = {};
        o.tray = new THREE.Vector3(26, P.tray.position.y + 12, 0); o.rubber = new THREE.Vector3(14, P.rubber.position.y + 16, 0);
        o.screw = new THREE.Vector3(3, P.screw.position.y + 14, 0); o.body = new THREE.Vector3(28, P.body.position.y + 10, 0);
        o.pad = new THREE.Vector3(22, P.pad.position.y + 1.5, 0); for (const q in o) o[q].y += this.f.position.y; return o; } },
    mount: { dur: 5.5, setup() {
        this.f = add(S.foot());
        this.w = add(S.makeScrew('wood')); this.w.rotation.set(0, 0.35, Math.PI / 2 + 0.17); this.w.position.set(-6, S.POS.pad + 4.6, 62);
        this.m = add(S.makeScrew('metric')); this.m.rotation.set(0, -0.25, Math.PI / 2 + 0.2); this.m.position.set(26, S.POS.pad + 4.4, 70);
      },
      update(t) { const u = t / this.dur; setCam(lerp(6, -8, easeIO(u)), lerp(24, 19, u), lerp(205, 175, easeIO(u)), 4, 6, 30); return t === 0; },
      anchors() { return { wood: new THREE.Vector3(-14, S.POS.pad + 4, 64), metric: new THREE.Vector3(20, S.POS.pad + 4, 72) }; } },
    section: { dur: 6.0, setup() { this.f = add(S.foot({ cut: true })); },
      update(t) { const u = t / this.dur; setCam(lerp(-72, -88, easeIO(u)), lerp(9, 5, u), lerp(150, 122, easeIO(u)), 0, 16, 0); return t === 0; },
      anchors() { return { h0: new THREE.Vector3(0, 0, -30.5), h20: new THREE.Vector3(0, 20, -30.5), rubber: new THREE.Vector3(0, 21, -9), screw: new THREE.Vector3(0, 34, 0), thread: new THREE.Vector3(0, 12, -22.7), pad: new THREE.Vector3(0, -1, -16) }; } },
    damping: { dur: 6.0, setup() {
        this.f = add(S.foot()); this.p = add(S.plinth()); this.p.position.set(185, 24.1 + 23, -150);
        this.rings = [];
      },
      update(t) {
        this.rings.forEach(r => { scene.remove(r); r.geometry.dispose(); r.material.dispose(); }); this.rings = [];
        for (let i = 0; i < 4; i++) {
          const ph = ((t - 0.4) / 2.4 - i * 0.25); if (ph < 0) continue; const f = ph % 1;
          const r = S.ring(lerp(32, 260, f), 0.55); r.position.y = S.POS.pad + 0.3;
          r.material = S.M.glow.clone(); r.material.emissiveIntensity = 7 * Math.pow(1 - f, 1.6);
          scene.add(r); this.rings.push(r);
        }
        setCam(lerp(-28, -10, easeIO(t / this.dur)), lerp(13, 10, t / this.dur), lerp(300, 255, easeIO(t / this.dur)), 15, 18, 15);
        return true;
      },
      teardown() { this.rings.forEach(r => scene.remove(r)); this.rings = []; },
      anchors() { return {}; } },
    set: { dur: 4.5, setup() {
        const xy = [[-48, -40], [48, -40], [-48, 46], [48, 46]];
        this.fs = xy.map(([x, z], i) => { const f = add(S.foot()); f.position.set(x, 0, z); f.rotation.y = i * 0.7; return f; });
      },
      update(t) { const u = t / this.dur; setCam(lerp(-30, -14, easeIO(u)), lerp(34, 28, u), lerp(400, 360, easeIO(u)), 0, 6, 4); return t === 0; },
      anchors() { return {}; } },
  };

  let active = null;
  let needScene = true;
  function use(name) {
    if (active && shots[active].teardown) shots[active].teardown();
    clear(); active = name; shots[name].setup(); needScene = true;
  }

  async function frame(name, t, spp) {
    const sh = shots[name];
    const dirty = sh.update(t);
    if (dirty || needScene) { pt.setScene(scene, camera); needScene = false; } else pt.updateCamera();
    pt.reset();
    let guard = 0; const tStart = performance.now();
    while (pt.samples < spp && performance.now() - tStart < 180000) {
      if (pt.isCompiling) { await yieldNow(); continue; }
      pt.renderSample(); guard++;
      if (guard % 8 === 0) await yieldNow();
    }
    state.lastSamples = pt.samples;
    const a = sh.anchors.call(sh), o = {};
    for (const k in a) { const v = a[k].clone().project(camera); o[k] = [Math.round((v.x * 0.5 + 0.5) * W), Math.round((-v.y * 0.5 + 0.5) * H)]; }
    return o;
  }

  async function still(name, t, spp = 32) {
    use(name); const t0 = performance.now(); const anc = await frame(name, t, spp);
    return { ms: Math.round(performance.now() - t0), samples: pt.samples, anc };
  }

  async function nonce() { return await fetch('/wp-admin/admin-ajax.php?action=rest-nonce', { credentials: 'include' }).then(r => r.text()); }
  async function upload(blob, filename, type) {
    const n = await nonce();
    const r = await fetch('/wp-json/wp/v2/media', { method: 'POST', credentials: 'include', headers: { 'X-WP-Nonce': n, 'Content-Type': type, 'Content-Disposition': `attachment; filename="${filename}"` }, body: blob });
    const j = await r.json(); return { id: j.id, url: j.source_url, status: r.status, err: j.message };
  }
  async function uploadStill(filename, q = 0.9) {
    const b = await new Promise(r => canvas.toBlob(r, 'image/jpeg', q)); return upload(b, filename, 'image/jpeg');
  }

  async function render(name, { fps = 30, spp = 48, bitrate = 28e6, from = 0, to = null, filename, onProgress } = {}) {
    use(name);
    const sh = shots[name]; const n = Math.round((to ?? sh.dur) * fps) - Math.round(from * fps);
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({ target, video: { codec: 'avc', width: W, height: H, frameRate: fps }, fastStart: 'in-memory' });
    const enc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => state.log.push('ENC ' + e) });
    enc.configure({ codec: 'avc1.640028', width: W, height: H, bitrate, framerate: fps, hardwareAcceleration: 'prefer-hardware', avc: { format: 'avc' } });
    const anchors = []; const t0 = performance.now();
    for (let i = 0; i < n; i++) {
      const t = from + i / fps;
      const ta = performance.now(); anchors.push(await frame(name, t, spp)); const tb = performance.now();
      const vf = new VideoFrame(canvas, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
      enc.encode(vf, { keyFrame: i % 60 === 0 }); vf.close();
      if (enc.encodeQueueSize > 6) await enc.flush();
      state.tm = { render: Math.round(tb - ta), enc: Math.round(performance.now() - tb) };
      state.progress = { name, i: i + 1, n, sec: Math.round((performance.now() - t0) / 1000) };
      if (onProgress) onProgress(state.progress);
    }
    await enc.flush(); muxer.finalize();
    const blob = new Blob([target.buffer], { type: 'video/mp4' });
    const up = await upload(blob, filename || `tmp-a56lp-${name}.mp4`, 'video/mp4');
    state.done = state.done || {}; state.done[name] = { up, anchors, sec: Math.round((performance.now() - t0) / 1000), bytes: blob.size };
    return state.done[name];
  }

  return { S, shots, use, frame, still, render, uploadStill, state, canvas };
}

export async function renderAll(F, list, opts) {
  F.state.queue = list.slice(); F.state.err = null;
  for (const n of list) {
    try { await F.render(n, Object.assign({ filename: `tmp-a56lp-${n}-${Date.now() % 100000}.mp4` }, opts)); }
    catch (e) { F.state.err = n + ': ' + (e && e.stack || e); return; }
  }
  F.state.allDone = true;
}
