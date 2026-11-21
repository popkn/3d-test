import * as THREE from 'three';
import { loadModules, makeHolder } from '../eagle/assemble.js';
import { createGuideLines } from '../assembly/render.js';
import { BOLT_PITCH } from '../assembly/solver.js';
import ASSEMBLY, { GUN, BOM, SPACERS } from './assembly.js';

// "썬더 개틀링 6연장 v2" 완성품 3D 조립 (ASSEMBLY_RULES.md 1~10장 · 무충돌 전면 재설계)
// - 구조 부품 113개 + 볼트 · 너트 · 캡너트 206개 = 319개 전원 실제 3D 모델 원점 직결 배치 (공중 고정 0 · 충돌 0)
// - 전선 오프셋(partBounds 중심 왜곡) 및 L자 뒤집힘 원천 차단: origin + 정규직교 기저(xdir, up) 직접 구성
// - 볼트 · 너트 · 캡너트 기본 표시 (visible = true) + 완전 분해 시 전원 결합 축 따라 나사 회전하며 분해 + 점선 가이드선
// - 기능: 버기 4륜 주행 (M1·M2), 6연장 배럴 로터 회전 (M3), 고각 서보 크랭크+소5 링크+경첩 연동 (OUT1), 12시 쐐기 격발

const DEG = Math.PI / 180;
export const WHEEL_R = 40;
export const TILT_MAX = GUN.tilt;
const FIRE_AT = Math.PI / 2 + 0.22;          // 12시를 조금 지나 쐐기가 고리를 벗기는 각도
const BAND_SPEED = 1400;
const TWO_PI = Math.PI * 2;
const UP_Y = new THREE.Vector3(0, 1, 0);
const FASTENER_IDS = new Set(['bolt-m3x6', 'bolt-m3x10', 'bolt-m26x10', 'nut-m3', 'cap-nut-m3', 's-nut-blue']);
const PART_OFFSET = {
  '01': [0, 0, 0],
  '02': [0, 22, 26],
  '03': [0, 58, -32],
  '04': [0, 106, 20],
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

export async function buildGatling(loadPart, onProgress) {
  const mods = await loadModules(ASSEMBLY, loadPart, onProgress);
  const root = new THREE.Group();
  root.position.y = 1.6; // 버기 타이어(실측 반지름 39.6) 바닥이 지면 y=0에 정확히 닿도록
  const groups = {}, pivots = {}, order = {};
  const wheels = [];
  const rotor = new THREE.Group();
  const crank = new THREE.Group(); crank.position.set(0, GUN.servoY, GUN.liftZ);
  let link = null, pinLo = null, pinHi = null, hingePivot = null;
  const items = []; // 완전 분해 · 볼트 토글 · 가이드선 대상 (319개 전원)

  const pivotOf = (s) => {
    if (!pivots[s]) {
      pivots[s] = new THREE.Group();
      pivots[s].position.set(0, GUN.hingeY, GUN.hingeZ);
      (groups[s] ??= new THREE.Group()).add(pivots[s]);
    }
    return pivots[s];
  };

  for (const a of ASSEMBLY) {
    const h = placePart(a, mods);
    if (h.userData.hingePivot) hingePivot = h.userData.hingePivot;
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

    // 분해 벡터 계산 (월드 기준): 파트 기본 오프셋 + 부품/체결 고유 축 방향
    const po = PART_OFFSET[a.s] || [0, 0, 0];
    const expW = new THREE.Vector3(po[0], po[1], po[2]);
    if (a.exp) {
      if (a.fastener) {
        // 볼트 · 너트 · 캡너트: 파트 오프셋에 상쇄되지 않고 자기 체결 축(exp)으로 최소 34 mm 순수 분리
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

  // 고무줄 6개 (소모품 · 부품 목록 밖): 총구 캡너트(z=-63.5) → 걸쇠 기둥(z=+34.7), 배럴 바깥쪽
  const bandLen = (GUN.bandZ1 ?? 34.7) - (GUN.bandZ0 ?? -63.5);
  const bandMidZ = ((GUN.bandZ0 ?? -63.5) + (GUN.bandZ1 ?? 34.7)) / 2;
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.7 });
  const bands = GUN.barrels.map(([bx, by]) => {
    const r = Math.hypot(bx, by), ux = bx / r, uy = by / r;
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, bandLen), bandMat);
    m.userData = { name: '고무줄 (소모품)', id: 'rubber-band', sheet: '03' };
    const home = new THREE.Vector3(ux * (r + 3.8), uy * (r + 3.8), bandMidZ);
    m.castShadow = true;
    return { m, home, a0: Math.atan2(uy, ux), loaded: true, fly: -1, grow: 1 };
  });
  for (const g of Object.values(groups)) root.add(g);
  for (const b of bands) { b.m.position.copy(b.home); rotor.add(b.m); }

  // 분해 가이드선 (단일 LineSegments 드로우콜)
  const guide = createGuideLines(items.length, 0x38bdf8, 0.55);
  root.add(guide.object);

  let phi = 0;
  let explode = 0;
  let boltsPref = true;   // 규칙 10.1: 볼트 · 너트 · 캡너트 기본 켬
  let guidesOn = true;
  let bandsPref = true;
  const hidden = {};
  const qx = new THREE.Quaternion(), qSpin = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), tmp = new THREE.Vector3();
  const invQ = new THREE.Quaternion(), locOff = new THREE.Vector3(), w0 = new THREE.Vector3(), w1 = new THREE.Vector3();

  function setWheels(dl, dr) {
    for (const W of wheels) W.h.quaternion.copy(qx.setFromAxisAngle(X, -(W.side > 0 ? dr : dl) / WHEEL_R)).multiply(W.q0);
  }

  // 고각: 포탑 각도 → 경첩 날개 + 탭 위치 → 크랭크 핀 (소5 링크 길이 30) → 서보 각도 · 링크 자세
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
      // 소5 PCB 구멍(-20,-10,0,+10,+20) 중 -10 ↔ +20(간격 30)이 양 핀에 0.0 mm 정렬되도록 -5 mm 오프셋
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

  // 규칙 10.4: 모든 부품(볼트 · 너트 · 캡너트 포함) 완전 분해 + 나사 피치 회전 + 가이드선
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
        b.m.scale.z = Math.max(0.05, b.grow); b.m.position.z = b.home.z - (bandLen / 2) * (1 - b.grow);
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
    root, groups, order, items, rotor,
    setWheels, setTilt, spin, flyBands, reload, reset,
    showBands, showBolts, setExplode, setGuides, setHidden,
    loaded: () => bands.filter((b) => b.loaded).length,
    count: ASSEMBLY.length, structCount: GUN.structCount, fastenerCount: GUN.fastenerCount,
    bom: BOM, spacers: SPACERS,
  };
}
