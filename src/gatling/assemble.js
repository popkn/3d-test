import * as THREE from 'three';
import { loadModules, makeHolder } from '../eagle/assemble.js';
import ASSEMBLY, { GUN } from './assembly.js';

// "썬더 개틀링 6연장" 조립 (도면: gatling/BLUEPRINT.md · tools/gatling_blueprint.py)
// 움직이는 곳: 바퀴 4 (X축), 배럴 로터 (총열 축 = Z, 12시에서 −X 쪽으로), 포탑 고각 (경첩 축 X · 서보 크랭크 + 링크), 고무줄 6 (12시 쐐기에서 발사 · 날아간 뒤 자동으로 다시 걸림)

const DEG = Math.PI / 180;
export const WHEEL_R = 40;
export const TILT_MAX = GUN.tilt;
const FIRE_AT = Math.PI / 2 + 0.22;          // 12시를 조금 지나 쐐기가 고리를 벗기는 각도
const BAND_SPEED = 1400;
const TWO_PI = Math.PI * 2;

export async function buildGatling(loadPart, onProgress) {
  const mods = await loadModules(ASSEMBLY, loadPart, onProgress);
  const root = new THREE.Group();
  const groups = {}, pivots = {}, order = {};
  const wheels = [];
  const rotor = new THREE.Group();
  const crank = new THREE.Group(); crank.position.set(0, GUN.servoY, GUN.liftZ);
  let link = null, pinLo = null, pinHi = null;
  const pivotOf = (s) => {
    if (!pivots[s]) { pivots[s] = new THREE.Group(); pivots[s].position.set(0, GUN.hingeY, GUN.hingeZ); (groups[s] ??= new THREE.Group()).add(pivots[s]); }
    return pivots[s];
  };
  for (const a of ASSEMBLY) {
    let h;
    if (a.id === 'support-spacer' && a.axis === 2) {
      const L = a.length;                                // 눕힌 서포트 (배럴): 수나사가 앞(−Z)
      const inner = makeHolder({ ...a, c: [0, L / 2, 0], z: [6.4, L, 6.4] }, mods);
      h = new THREE.Group(); h.userData = inner.userData; inner.userData = {};
      h.add(inner); h.rotation.x = -Math.PI / 2;
      h.position.set(a.c[0], a.c[1], a.c[2] + L / 2);
    } else h = makeHolder(a, mods);
    h.userData.note = a.h || '';
    (order[a.s] ??= []).push(h);
    const g = groups[a.s] ??= new THREE.Group();
    const onTurret = a.s === '03' || a.s === '04' || (a.s === '02' && (a.n.startsWith('포탑 판') || a.n.startsWith('고각 탭')));
    if (a.id === 'wheel-80-buggy-set') { wheels.push({ h, side: Math.sign(a.c[0]), q0: h.quaternion.clone() }); g.add(h); continue; }
    if (a.s === '02' && a.id === 'wheel-guide-30-servo') { h.position.sub(crank.position); crank.add(h); continue; }
    if (a.s === '02' && a.id === 'frame-s3-pcb') { link = h; g.add(h); continue; }
    if (a.s === '02' && a.n.startsWith('링크 아래 핀')) { pinLo = h; g.add(h); continue; }
    if (a.s === '02' && a.n.startsWith('링크 위 핀')) { pinHi = h; g.add(h); continue; }
    if (!onTurret) { g.add(h); continue; }
    const pv = pivotOf(a.s);
    const spins = a.s === '03' && (a.id === 'wheel-guide-30-nylon' || a.id === 'frame-half-pcb' || a.id === 'cap-nut-m3' || a.id === 'bolt-m3x6' || (a.id === 'support-spacer' && a.axis === 2));
    if (spins) { h.position.sub(new THREE.Vector3(0, GUN.axisY, 0)); rotor.add(h); }
    else { h.position.sub(pv.position); pv.add(h); }
  }
  groups['02'].add(crank);
  rotor.position.set(0, GUN.axisY - GUN.hingeY, -GUN.hingeZ);
  pivotOf('03').add(rotor);
  // 고무줄 6개 (소모품 · 부품 목록 밖): 총구 캡너트 → 걸쇠 기둥, 배럴 바깥쪽
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.7 });
  const bands = GUN.barrels.map(([bx, by]) => {
    const r = Math.hypot(bx, by), ux = bx / r, uy = by / r;
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 94), bandMat);
    m.userData = { name: '고무줄 (소모품)', id: 'rubber-band', sheet: '03' };
    const home = new THREE.Vector3(ux * (r + 3.8), uy * (r + 3.8), -0.4);    // 걸쇠 끝 (z 45.6) ~ 총구 (z −46.4)의 가운데
    m.castShadow = true;
    return { m, home, a0: Math.atan2(uy, ux), loaded: true, fly: -1, grow: 1 };
  });
  for (const g of Object.values(groups)) root.add(g);
  for (const b of bands) { b.m.position.copy(b.home); rotor.add(b.m); }

  let phi = 0;
  const qx = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), tmp = new THREE.Vector3();
  function setWheels(dl, dr) { for (const W of wheels) W.h.quaternion.copy(qx.setFromAxisAngle(X, -(W.side > 0 ? dr : dl) / WHEEL_R)).multiply(W.q0); }
  // 고각: 포탑 각도 → 탭 위치 → 크랭크 핀 (링크 길이 20) → 서보 각도 · 링크 자세
  let crankA = GUN.a0 * DEG;
  function setTilt(deg) {
    const th = deg * DEG;
    for (const p of Object.values(pivots)) p.rotation.x = th;
    const dz = -GUN.lever, dy = GUN.tabY - GUN.hingeY;
    const tz = GUN.hingeZ + dz * Math.cos(th) + dy * Math.sin(th), ty = GUN.hingeY - dz * Math.sin(th) + dy * Math.cos(th);
    let best = crankA, err = Infinity;
    for (let k = 0; k <= 360; k++) {
      const a = k * 0.5 * DEG;
      const e = Math.abs(Math.hypot(tz - (GUN.liftZ + GUN.crank * Math.sin(a)), ty - (GUN.servoY - GUN.crank * Math.cos(a))) - GUN.link) + Math.abs(a - crankA) * 0.01;
      if (e < err) { err = e; best = a; }
    }
    crankA = best;
    crank.rotation.x = -(best - 0);              // 핀이 아래(0)에서 뒤쪽으로 돌아 올라감
    const pz = GUN.liftZ + GUN.crank * Math.sin(best), py = GUN.servoY - GUN.crank * Math.cos(best);
    if (link) { link.position.set(link.position.x, (py + ty) / 2, (pz + tz) / 2); link.rotation.set(Math.atan2(tz - pz, ty - py), 0, Math.PI / 2); }
    if (pinLo) pinLo.position.set(pinLo.position.x, py, pz);
    if (pinHi) pinHi.position.set(pinHi.position.x, ty, tz);
  }
  // 로터를 d (라디안)만큼 돌린다. 12시 쐐기를 지나는 장전된 배럴은 발사, 6시를 지나는 빈 배럴은 자동 장전 (auto일 때)
  const crossed = (a0, before, after, at) => Math.floor((a0 + after - at) / TWO_PI) > Math.floor((a0 + before - at) / TWO_PI);
  let autoLoad = true;
  function spin(d, auto = true) {
    autoLoad = auto;
    let fired = 0;
    const before = phi; phi += d;
    rotor.rotation.z = phi;
    for (const b of bands) {
      if (b.loaded && crossed(b.a0, before, phi, FIRE_AT)) {
        b.loaded = false; b.fly = 0; fired++;
        const pv = pivots['03'];
        pv.updateMatrixWorld(true); b.m.getWorldPosition(tmp); pv.worldToLocal(tmp);
        pv.add(b.m); b.m.position.copy(tmp); b.m.rotation.set(0, 0, 0); b.m.scale.set(1, 1, 1); b.m.visible = true;
      }
    }
    return fired;
  }
  function flyBands(dt) {
    let moving = false;
    for (const b of bands) {
      if (b.fly >= 0) {
        b.fly += dt; moving = true;
        b.m.position.z -= BAND_SPEED * dt; b.m.position.y -= 120 * b.fly * dt;
        b.m.scale.z = Math.max(0.35, 1 - b.fly * 2.2);
        if (b.fly > 0.7) {
          b.fly = -1; b.m.visible = false;
          if (autoLoad) { b.loaded = true; b.grow = 0; rotor.add(b.m); b.m.position.copy(b.home); b.m.rotation.set(0, 0, 0); b.m.scale.set(1, 1, 0.05); b.m.visible = true; }   // 자동 장전
        }
      } else if (b.loaded && b.grow < 1) {       // 새로 걸리는 고무줄: 총구에서 걸쇠까지 늘어남
        b.grow = Math.min(1, b.grow + dt * 5); moving = true;
        b.m.scale.z = Math.max(0.05, b.grow); b.m.position.z = b.home.z - 47 * (1 - b.grow);
      }
    }
    return moving;
  }
  function reload() {
    for (const b of bands) { b.loaded = true; b.fly = -1; b.grow = 1; rotor.add(b.m); b.m.position.copy(b.home); b.m.rotation.set(0, 0, 0); b.m.scale.set(1, 1, 1); b.m.visible = true; }
  }
  function reset() { phi = 0; rotor.rotation.z = 0; reload(); setTilt(0); setWheels(0, 0); }
  const showBands = (v) => { for (const b of bands) b.m.visible = v && (b.loaded || b.fly >= 0); };
  setWheels(0, 0); setTilt(0);
  return { root, groups, order, rotor, setWheels, setTilt, spin, flyBands, reload, reset, showBands, loaded: () => bands.filter((b) => b.loaded).length, count: ASSEMBLY.length };
}
