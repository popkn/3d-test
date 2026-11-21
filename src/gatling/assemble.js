import * as THREE from 'three';
import { loadModules, makeHolder } from '../eagle/assemble.js';
import { createGuideLines } from '../assembly/render.js';
import { BOLT_PITCH } from '../assembly/solver.js';
import ASSEMBLY, { GUN, BOM, SPACERS } from './assembly.js';

// "썬더 개틀링 6연장 v3" 완성품 3D 조립 (ASSEMBLY_RULES.md 1~10장 · 규칙 2.5 · 10.6 완전 준수)
// - [규칙 2.5] 4륜 전원 DC 130rpm 직결 (앞 M1·M2 + 뒤 M3·M4, 헛바퀴 0개) + 배럴 DC 400rpm (EX-M1 · 모터 확장 보드 A3)
// - [규칙 10.6] 뒤 2중 로터 케이지 외팔보 + 개방형 배럴 + L자 2×1/후방 걸쇠 캡너트(+Z 돔) ↔ 총구 캡너트(−Z 돔) ↔ 12시 36.9° 격발 쐐기
//   → 고무줄 장전선 관통 0건 · 전방 발사 비행선(−Z) 장애물 0건 · 학습용 메커니즘 확대 메타 포함
// - 구조 112 + 볼트/너트/캡너트 238 = 350개 전원 실제 3D 원점 직결 · 완전 분해 시 전원 결합 축 따라 나사 회전

const DEG = Math.PI / 180;
export const WHEEL_R = 40;
export const TILT_MAX = GUN.tilt;
const FIRE_AT = Math.PI / 2 + 0.14;          // 12시를 지나며 36.9° 쐐기가 걸쇠 돔 끝(−12.5)에서 고리를 밀어 이탈시키는 각도
const BAND_SPEED = 1400;
const TWO_PI = Math.PI * 2;
const UP_Y = new THREE.Vector3(0, 1, 0);
const FASTENER_IDS = new Set(['bolt-m3x6', 'bolt-m3x10', 'bolt-m26x10', 'nut-m3', 'cap-nut-m3', 's-nut-blue']);
const PART_OFFSET = {
  '01': [0, 0, 0],
  '02': [0, 22, 26],
  '03': [0, 58, -32],
  '04': [0, 108, -10],
  '05': [0, 26, 0],
};

function hideDemo(obj) {
  obj.traverse((o) => { if (o !== obj && o.userData?.noBounds) o.visible = false; });
}

// 실측 3D 모델 원점(a.o)과 정규직교 기저(xdir, up)로 부품을 정확히 배치한다 (전선 오프셋 · L자 방향 오류 원천 차단)
function placePart(a, mods) {
  if (!a.o) {
    const h = makeHolder(a, mods);
    h.userData.note = a.h || '';
    if (a.mech) h.userData.mech = a.mech;
    return h;
  }
  const model = mods[a.id].build();
  hideDemo(model.object3d);
  if (a.id === 'support-spacer' && a.length && model.handles?.setLength) {
    model.handles.setLength(a.length);
  }
  const holder = new THREE.Group();
  holder.userData = {
    name: a.n,
    id: a.id,
    sheet: a.s,
    fastener: FASTENER_IDS.has(a.id),
    up: a.up ? [...a.up] : null,
    expDir: a.exp ? [...a.exp] : null,
    note: a.h || '',
    mech: a.mech || null,
  };
  if (a.id === 'hinge-3x3' && model.handles?.pivot) {
    holder.userData.hingePivot = model.handles.pivot;
  }
  holder.add(model.object3d);

  if (a.xdir && a.up) {
    const X = new THREE.Vector3(...a.xdir).normalize();
    const Y = new THREE.Vector3(...a.up).normalize();
    const Z = new THREE.Vector3().crossVectors(X, Y).normalize();
    const m = new THREE.Matrix4().makeBasis(X, Y, Z);
    holder.quaternion.setFromRotationMatrix(m);
  } else if (a.euler) {
    holder.rotation.set(a.euler[0] * DEG, a.euler[1] * DEG, a.euler[2] * DEG, a.eorder || 'XYZ');
  } else if (a.up) {
    const Y = new THREE.Vector3(...a.up).normalize();
    if (Y.y < -0.9999) holder.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
    else holder.quaternion.setFromUnitVectors(UP_Y, Y);
  }
  holder.position.set(a.o[0], a.o[1], a.o[2]);
  return holder;
}

// 실물 고무줄 고리(소모품): 총구 캡너트 뒤(r=28.8, z=-74.5) ↔ 후방 걸쇠 캡너트 상단(r=38.6, z=-16.5) 100% 개방 공간 직선 장전!
function makeRubberBand(bx, by, mat) {
  const r = Math.hypot(bx, by), ux = bx / r, uy = by / r;
  const tx = -uy, ty = ux; // 접선 방향
  const rF = GUN.bandFrontR ?? 28.8, zF = GUN.bandFrontZ ?? -74.5;
  const rR = GUN.bandRearR ?? 38.6, zR = GUN.bandRearZ ?? -16.5;
  const pF = new THREE.Vector3(ux * rF, uy * rF, zF);
  const pR = new THREE.Vector3(ux * rR, uy * rR, zR);
  const mid = new THREE.Vector3().addVectors(pF, pR).multiplyScalar(0.5);
  const g = new THREE.Group();
  g.userData = { name: '고무줄 (소모품 · 총구 ↔ 후방 걸쇠)', id: 'rubber-band', sheet: '03' };

  // 양쪽 가닥 (총구 캡너트 옆면 ↔ 걸쇠 캡너트 양옆을 감싸는 실제 고리 형태)
  const halfSep = 2.6;
  const len = pF.distanceTo(pR);
  const dir = new THREE.Vector3().subVectors(pR, pF).normalize();
  const qStrand = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  const strandGeo = new THREE.BoxGeometry(1.1, 1.3, len);
  for (const s of [-1, 1]) {
    const strand = new THREE.Mesh(strandGeo, mat);
    strand.position.set(tx * halfSep * s, ty * halfSep * s, 0);
    strand.quaternion.copy(qStrand);
    strand.castShadow = true;
    g.add(strand);
  }
  // 총구 앞 고리 & 걸쇠 뒤 고리 (실제 캡너트 몸통에 감긴 모습)
  const loopGeo = new THREE.TorusGeometry(3.5, 0.75, 8, 20);
  const frontLoop = new THREE.Mesh(loopGeo, mat);
  frontLoop.position.set(ux * (25.0 - (rF + rR) / 2), uy * (25.0 - (rF + rR) / 2), zF - mid.z);
  const rearLoop = new THREE.Mesh(loopGeo, mat);
  rearLoop.position.set(ux * (35.0 - (rF + rR) / 2), uy * (35.0 - (rF + rR) / 2), zR - mid.z);
  g.add(frontLoop, rearLoop);

  return { m: g, home: mid, len, a0: Math.atan2(uy, ux) };
}

export async function buildGatling(loadPart, onProgress) {
  const mods = await loadModules(ASSEMBLY, loadPart, onProgress);
  const root = new THREE.Group();
  root.position.y = 1.6; // 버기 타이어 바닥 y=0 접지
  const groups = {}, pivots = {}, order = {};
  const wheels = [];
  const rotor = new THREE.Group();
  const crank = new THREE.Group(); crank.position.set(0, GUN.servoY, GUN.liftZ);
  let link = null, pinLo = null, pinHi = null, hingePivot = null;
  const items = [];
  const mechSteps = [];

  const pivotOf = (s) => {
    if (!pivots[s]) {
      pivots[s] = new THREE.Group();
      pivots[s].position.set(0, GUN.hingeY, GUN.hingeZ);
      (groups[s] ??= new THREE.Group()).add(pivots[s]);
    }
    return pivots[s];
  };

  for (let idx = 0; idx < ASSEMBLY.length; idx++) {
    const a = ASSEMBLY[idx];
    const h = placePart(a, mods);
    if (h.userData.hingePivot) hingePivot = h.userData.hingePivot;
    if (a.mech) mechSteps.push({ step1: idx + 1, name: a.n, mech: a.mech, h });
    (order[a.s] ??= []).push(h);
    const g = groups[a.s] ??= new THREE.Group();

    let parent = g;
    let wheelGroup = null;
    if (a.id === 'wheel-80-buggy-set') {
      wheels.push({ h, side: Math.sign(a.c[0]), q0: h.quaternion.clone() });
      parent = g;
    } else if (a.s === '01' && a.id === 'bolt-m26x10') {
      parent = g;
      wheelGroup = wheels[wheels.length - 1];
    } else if (a.s === '02' && (a.id === 'wheel-guide-30-servo' || a.id === 'bolt-m26x10')) {
      h.position.sub(crank.position);
      parent = crank;
    } else if (a.s === '02' && a.id === 'frame-s5-pcb') {
      link = h; parent = g;
    } else if (a.s === '02' && a.n.startsWith('링크 아래 핀')) {
      pinLo = h; parent = g;
    } else if (a.s === '02' && a.n.startsWith('링크 위 핀')) {
      pinHi = h; parent = g;
    } else if (a.turret) {
      const pv = pivotOf(a.s);
      if (a.spins) {
        h.position.sub(new THREE.Vector3(0, GUN.axisY, 0));
        parent = rotor;
      } else {
        h.position.sub(pv.position);
        parent = pv;
      }
    }
    parent.add(h);

    const po = PART_OFFSET[a.s] || [0, 0, 0];
    const expW = new THREE.Vector3(po[0], po[1], po[2]);
    if (a.exp) {
      if (a.fastener) {
        const dir = new THREE.Vector3(...a.exp).normalize();
        const proj = expW.dot(dir);
        if (proj < 0) expW.addScaledVector(dir, -proj);
        expW.addScaledVector(dir, 34);
      } else {
        expW.add(new THREE.Vector3(...a.exp));
      }
    }
    items.push({
      h, a, parent,
      p0: h.position.clone(),
      q0: h.quaternion.clone(),
      expW,
      fastener: !!a.fastener,
      spinAxisLocal: a.fastener ? new THREE.Vector3(0, 1, 0) : null,
      wheelGroup,
    });
  }

  groups['02'].add(crank);
  rotor.position.set(0, GUN.axisY - GUN.hingeY, -GUN.hingeZ);
  pivotOf('03').add(rotor);

  // 고무줄 6개 (실제 총구 캡너트 ↔ 후방 걸쇠 캡너트 장전 고리 · 장애물 0건)
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xe6a119, roughness: 0.65 });
  const bands = GUN.barrels.map(([bx, by]) => {
    const rb = makeRubberBand(bx, by, bandMat);
    return { ...rb, loaded: true, fly: -1, grow: 1 };
  });
  for (const g of Object.values(groups)) root.add(g);
  for (const b of bands) { b.m.position.copy(b.home); rotor.add(b.m); }

  const guide = createGuideLines(items.length, 0x38bdf8, 0.55);
  root.add(guide.object);

  let phi = 0;
  let explode = 0;
  let boltsPref = true;
  let guidesOn = true;
  let bandsPref = true;
  const hidden = {};
  const qx = new THREE.Quaternion(), qSpin = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), tmp = new THREE.Vector3();
  const invQ = new THREE.Quaternion(), locOff = new THREE.Vector3(), w0 = new THREE.Vector3(), w1 = new THREE.Vector3();

  function setWheels(dl, dr) {
    for (const W of wheels) W.h.quaternion.copy(qx.setFromAxisAngle(X, -(W.side > 0 ? dr : dl) / WHEEL_R)).multiply(W.q0);
  }

  let crankA = GUN.a0 * DEG;
  const linkX = link ? link.position.x : -0.2;
  function setTilt(deg) {
    const th = deg * DEG;
    for (const p of Object.values(pivots)) p.rotation.x = th;
    if (hingePivot) hingePivot.rotation.z = th;
    const dz = -GUN.lever, dy = GUN.tabY - GUN.hingeY;
    const tz = GUN.hingeZ + dz * Math.cos(th) + dy * Math.sin(th), ty = GUN.hingeY - dz * Math.sin(th) + dy * Math.cos(th);
    let best = crankA, err = Infinity;
    for (let k = 0; k <= 360; k++) {
      const a = k * 0.5 * DEG;
      const e = Math.abs(Math.hypot(tz - (GUN.liftZ + GUN.crank * Math.sin(a)), ty - (GUN.servoY - GUN.crank * Math.cos(a))) - GUN.link) + Math.abs(a - crankA) * 0.01;
      if (e < err) { err = e; best = a; }
    }
    crankA = best;
    crank.rotation.x = -best;
    const pz = GUN.liftZ + GUN.crank * Math.sin(best), py = GUN.servoY - GUN.crank * Math.cos(best);
    if (link) {
      const ang = Math.atan2(tz - pz, ty - py);
      link.position.set(linkX, (py + ty) / 2 - 5 * Math.cos(ang), (pz + tz) / 2 - 5 * Math.sin(ang));
      link.rotation.set(ang, 0, Math.PI / 2);
    }
    if (pinLo) pinLo.position.set(pinLo.position.x, py, pz);
    if (pinHi) pinHi.position.set(pinHi.position.x, ty, tz);
    for (const it of items) {
      if (it.h === link || it.h === pinLo || it.h === pinHi) {
        it.p0.copy(it.h.position);
        if (it.h === link) it.q0.copy(it.h.quaternion);
      }
    }
  }

  function applyExplode() {
    const e = explode;
    const showFast = boltsPref || e > 0.005;
    for (const [no, g] of Object.entries(groups)) g.visible = !hidden[no];
    root.updateMatrixWorld(true);
    const segs = [];
    for (const it of items) {
      if (it.fastener) it.h.visible = showFast;
      if (e > 0) {
        it.parent.getWorldQuaternion(invQ).invert();
        locOff.copy(it.expW).multiplyScalar(e).applyQuaternion(invQ);
        it.h.position.copy(it.p0).add(locOff);
        if (it.fastener && it.spinAxisLocal) {
          const travel = it.expW.length() * e;
          const turns = travel / (BOLT_PITCH * 4);
          qSpin.setFromAxisAngle(it.spinAxisLocal, turns * TWO_PI);
          it.h.quaternion.copy(it.q0).multiply(qSpin);
        }
        if (e > 0.01 && guidesOn && it.h.visible && !hidden[it.a.s]) {
          w0.copy(it.p0).applyMatrix4(it.parent.matrixWorld);
          w1.copy(it.h.position).applyMatrix4(it.parent.matrixWorld);
          if (w0.distanceToSquared(w1) > 1) segs.push([w0.x, w0.y, w0.z, w1.x, w1.y, w1.z]);
        }
      } else {
        it.h.position.copy(it.p0);
        if (it.fastener) it.h.quaternion.copy(it.q0);
      }
    }
    guide.update(segs);
    for (const b of bands) b.m.visible = bandsPref && e < 0.02 && (b.loaded || b.fly >= 0);
  }

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
        pv.add(b.m); b.m.position.copy(tmp); b.m.rotation.set(0, 0, 0); b.m.scale.set(1, 1, 1); b.m.visible = bandsPref && explode < 0.02;
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
          if (autoLoad) { b.loaded = true; b.grow = 0; rotor.add(b.m); b.m.position.copy(b.home); b.m.rotation.set(0, 0, 0); b.m.scale.set(1, 1, 0.05); b.m.visible = bandsPref && explode < 0.02; }
        }
      } else if (b.loaded && b.grow < 1) {
        b.grow = Math.min(1, b.grow + dt * 5); moving = true;
        b.m.scale.z = Math.max(0.05, b.grow); b.m.position.z = b.home.z - (b.len / 2) * (1 - b.grow);
      }
    }
    return moving;
  }

  function reload() {
    for (const b of bands) { b.loaded = true; b.fly = -1; b.grow = 1; rotor.add(b.m); b.m.position.copy(b.home); b.m.rotation.set(0, 0, 0); b.m.scale.set(1, 1, 1); b.m.visible = bandsPref && explode < 0.02; }
  }
  function reset() { phi = 0; rotor.rotation.z = 0; explode = 0; reload(); setTilt(0); setWheels(0, 0); applyExplode(); }
  function showBands(v) { bandsPref = v; for (const b of bands) b.m.visible = v && explode < 0.02 && (b.loaded || b.fly >= 0); }
  function showBolts(v) { boltsPref = v; applyExplode(); }
  function setExplode(v) { explode = Math.max(0, Math.min(1, v)); applyExplode(); }
  function setGuides(v) { guidesOn = v; applyExplode(); }
  function setHidden(no, v) { hidden[no] = v; applyExplode(); }

  setWheels(0, 0); setTilt(0); applyExplode();
  return {
    root, groups, order, items, rotor, mechSteps,
    setWheels, setTilt, spin, flyBands, reload, reset,
    showBands, showBolts, setExplode, setGuides, setHidden,
    loaded: () => bands.filter((b) => b.loaded).length,
    count: ASSEMBLY.length, structCount: GUN.structCount, fastenerCount: GUN.fastenerCount,
    bom: BOM, spacers: SPACERS,
  };
}
