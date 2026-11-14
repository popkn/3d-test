import * as THREE from 'three';
import { loadModules, makeHolder } from '../eagle/assemble.js';
import ASSEMBLY, { GUN } from './assembly.js';

// "썬더 개틀링 4연장" 조립 (도면: gatling/BLUEPRINT.md · tools/gatling_blueprint.py)
// 움직이는 곳: 바퀴 4 (X축), 배럴 로터 (총열 축 = Z, 12시에서 −X 쪽으로), 포탑 고각 (경첩 축 X, 0 ~ +14.5°), 고무줄 4 (12시 쐐기에서 발사)

const DEG = Math.PI / 180;
export const WHEEL_R = 40;
export const TILT_MAX = GUN.tilt;
const FIRE_AT = Math.PI / 2 + 0.25;          // 12시를 조금 지나 쐐기가 고리를 벗기는 각도
const BAND_SPEED = 1400;                       // 고무줄 날아가는 속도 (mm/s, 보여 주기용)

export async function buildGatling(loadPart, onProgress) {
  const mods = await loadModules(ASSEMBLY, loadPart, onProgress);
  const root = new THREE.Group();
  const groups = {}, pivots = {};
  const wheels = [];
  const rotor = new THREE.Group();
  const pivotOf = (s) => {
    if (!pivots[s]) { pivots[s] = new THREE.Group(); pivots[s].position.set(0, GUN.hingeY, GUN.hingeZ); (groups[s] ??= new THREE.Group()).add(pivots[s]); }
    return pivots[s];
  };
  for (const a of ASSEMBLY) {
    let h;
    if (a.id === 'support-spacer' && a.axis === 2) {
      // 눕힌 서포트 (배럴): 세운 모델을 앞(−Z)으로 눕힌다. 수나사가 앞
      const L = a.length;
      const inner = makeHolder({ ...a, c: [0, L / 2, 0], z: [6.4, L, 6.4] }, mods);
      h = new THREE.Group(); h.userData = inner.userData; inner.userData = {};
      h.add(inner); h.rotation.x = -Math.PI / 2;
      h.position.set(a.c[0], a.c[1], a.c[2] + L / 2);
    } else h = makeHolder(a, mods);
    const g = groups[a.s] ??= new THREE.Group();
    const onTurret = a.s === '03' || a.s === '04' || (a.s === '02' && a.n.startsWith('포탑 판')) || (a.s === '05' && a.c[1] > GUN.hingeY);
    if (a.id === 'wheel-80-buggy-set') { wheels.push({ h, side: Math.sign(a.c[0]), q0: h.quaternion.clone() }); g.add(h); continue; }
    if (!onTurret) { g.add(h); continue; }
    const pv = pivotOf(a.s);
    const spins = a.s === '03' && (a.id === 'wheel-guide-30-nylon' || a.id === 'frame-s5-pcb' || a.id === 'cap-nut-m3' || a.id === 'bolt-m3x6' || (a.id === 'support-spacer' && a.axis === 2));
    if (spins) { h.position.sub(new THREE.Vector3(0, GUN.axisY, 0)); rotor.add(h); }
    else { h.position.sub(pv.position); pv.add(h); }
  }
  rotor.position.set(0, GUN.axisY - GUN.hingeY, -GUN.hingeZ);
  pivotOf('03').add(rotor);
  // 고무줄 4개 (소모품 · 부품 목록 밖): 총구 캡너트 → 걸쇠 기둥, 배럴 바깥쪽
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.7 });
  const bands = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([ux, uy]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 114), bandMat);
    m.userData = { name: '고무줄 (소모품)', id: 'rubber-band', sheet: '03' };
    const home = new THREE.Vector3(ux * (GUN.r + 3.8), uy * (GUN.r + 3.8), -13);
    m.position.copy(home); m.castShadow = true;
    rotor.add(m);
    return { m, home, a0: Math.atan2(uy, ux), loaded: true, fly: -1 };
  });
  for (const g of Object.values(groups)) root.add(g);

  let phi = 0;
  const qx = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), tmp = new THREE.Vector3();
  function setWheels(dl, dr) { for (const W of wheels) W.h.quaternion.copy(qx.setFromAxisAngle(X, -(W.side > 0 ? dr : dl) / WHEEL_R)).multiply(W.q0); }
  function setTilt(deg) { for (const p of Object.values(pivots)) p.rotation.x = deg * DEG; }
  // 로터를 d (라디안)만큼 돌린다. 장전된 배럴이 12시 쐐기를 지나면 그 고무줄이 발사된다. 돌려준 값 = 이번에 쏜 수
  function spin(d) {
    let fired = 0;
    const before = phi; phi += d;
    rotor.rotation.z = phi;
    for (const b of bands) {
      if (!b.loaded) continue;
      const k0 = Math.floor((b.a0 + before - FIRE_AT) / (2 * Math.PI)), k1 = Math.floor((b.a0 + phi - FIRE_AT) / (2 * Math.PI));
      if (k1 > k0) {
        b.loaded = false; b.fly = 0; fired++;
        const pv = pivots['03'];
        pv.updateMatrixWorld(true); b.m.getWorldPosition(tmp); pv.worldToLocal(tmp);
        pv.add(b.m); b.m.position.copy(tmp); b.m.rotation.set(0, 0, 0);
      }
    }
    return fired;
  }
  // 날아가는 고무줄 (총열 방향 = 포탑 좌표 −Z)
  function flyBands(dt) {
    let moving = false;
    for (const b of bands) {
      if (b.fly < 0) continue;
      b.fly += dt; moving = true;
      b.m.position.z -= BAND_SPEED * dt; b.m.position.y -= 120 * b.fly * dt;
      b.m.scale.z = Math.max(0.35, 1 - b.fly * 2.2);
      if (b.fly > 0.7) { b.fly = -1; b.m.visible = false; }
    }
    return moving;
  }
  function reload() {
    for (const b of bands) { b.loaded = true; b.fly = -1; rotor.add(b.m); b.m.position.copy(b.home); b.m.scale.z = 1; b.m.visible = true; }
  }
  function reset() { phi = 0; rotor.rotation.z = 0; reload(); setTilt(0); setWheels(0, 0); }
  setWheels(0, 0);
  return { root, groups, rotor, setWheels, setTilt, spin, flyBands, reload, reset, loaded: () => bands.filter((b) => b.loaded).length, count: ASSEMBLY.length };
}

export const EXPLODE = { '01': [0, -50, 0], '02': [0, 0, 0], '03': [0, 60, -40], '04': [0, 150, 30], '05': [0, 25, 110] };
