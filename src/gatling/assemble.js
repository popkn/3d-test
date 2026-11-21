import * as THREE from 'three';
import { loadModules, makeHolder } from '../eagle/assemble.js';
import { createGuideLines } from '../assembly/render.js';
import { BOLT_PITCH } from '../assembly/solver.js';
import ASSEMBLY, { GUN, BOM, SPACERS } from './assembly.js';
import { createCircularBand, poseHookTestBand } from './rubberBand.js';

// "썬더 개틀링 6연장 v3" 완성품 3D 조립 (ASSEMBLY_RULES.md 1~10장 · 규칙 2.5 · 10.6 완전 준수)
// - [규칙 2.5] 4륜 전원 DC 130rpm 직결 (앞 M1·M2 + 뒤 M3·M4, 헛바퀴 0개) + 배럴 DC 400rpm (EX-M1 · 모터 확장 보드 A3)
// - [규칙 10.6] 순수 원형 고무줄(단일 폐곡선 탄성 링) + 거치/당김 테스트 단계 + 12시 36.9° 쐐기 이탈/탄성 비행 테스트 단계
//   (테스트 단계 진입 시 관련 메커니즘 부품만 선명히 유지하고 나머지 부품은 반투명 처리해 작동 원리를 직관적으로 학습!)

const DEG = Math.PI / 180;
export const WHEEL_R = 40;
export const TILT_MAX = GUN.tilt;
const FIRE_AT = Math.PI / 2 + 0.14;          // 12시를 지나며 36.9° 쐐기가 걸쇠 돔 끝(−12.5)에서 고리를 이탈시키는 각도
const CAM_START = FIRE_AT - 0.34;            // 쐐기가 고무줄 뒤 고리를 +Z로 밀기 시작하는 각도
const BAND_SPEED = 1350;
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

// 각도를 (-π, π] 범위로 정규화
const normAng = (a) => {
  let x = ((a + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;
  return x;
};

export async function buildGatling(loadPart, onProgress) {
  const mods = await loadModules(ASSEMBLY, loadPart, onProgress);
  const root = new THREE.Group();
  root.position.y = 1.6;
  const groups = {}, pivots = {}, order = {};
  const wheels = [];
  const rotor = new THREE.Group();
  const crank = new THREE.Group(); crank.position.set(0, GUN.servoY, GUN.liftZ);
  let link = null, pinLo = null, pinHi = null, hingePivot = null;
  const items = [];
  const mechSteps = [];

  // 메커니즘 테스트 시 선명하게 남길(비반투명) 핵심 부품 그룹
  const hookFocusHolders = new Set();
  const triggerFocusHolders = new Set();
  let hookAfterHolder = null;
  let triggerAfterHolder = null;

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

    // 1시 배럴 거치 메커니즘 부품 & 12시 격발 쐐기 부품 식별 (테스트 단계에서 배경만 반투명 처리)
    if (a.s === '03' && /(^|\s)1시/.test(a.n) && !a.n.includes('케이지')) {
      hookFocusHolders.add(h);
      triggerFocusHolders.add(h);
      if (a.id === 'cap-nut-m3' && a.n.startsWith('총구')) hookAfterHolder = h;
    }
    if (a.s === '04' && (a.id === 'frame-s7-pcb' || a.n.includes('쐐기'))) {
      triggerFocusHolders.add(h);
      triggerAfterHolder = h;
    }

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

  // 순수 원형 고무줄 6개 (단일 폐곡선 탄성 링 — 매듭 0개 · 탄성 포아송 비 · 쐐기 밀어냄 · 탄성 수축/진동 비행)
  const zF = GUN.bandFrontZ ?? -74.5;
  const zR = GUN.bandRearZ ?? -16.5;
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xe6a119, roughness: 0.58, metalness: 0.05 });
  const bands = GUN.barrels.map(([bx, by], idx) => {
    const r = Math.hypot(bx, by), ux = bx / r, uy = by / r;
    const cb = createCircularBand(bandMat);
    cb.mesh.userData = { name: '원형 고무줄 (소모품 · 총구 ↔ 후방 걸쇠)', id: 'rubber-band', sheet: '03' };
    cb.setStretched(ux, uy, 28.8, zF, 38.6, zR);
    return {
      idx, ux, uy, cb, m: cb.mesh,
      a0: Math.atan2(uy, ux),
      loaded: true, fly: -1, grow: 1,
      flyUx: 0, flyUy: 1,
      flyOrigin: new THREE.Vector3(),
    };
  });
  for (const g of Object.values(groups)) root.add(g);
  for (const b of bands) rotor.add(b.m);

  // 테스트 단계 전용 원형 고무줄 (거치/당김 · 격발 트리거 학습 시뮬레이션용 — 기존 6개와 독립)
  const testBandMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x3a2000, roughness: 0.45 });
  const testBand = createCircularBand(testBandMat);
  testBand.mesh.userData = { name: '테스트 원형 고무줄 (메커니즘 학습)', id: 'rubber-band-test', sheet: '03' };
  testBand.mesh.visible = false;
  rotor.add(testBand.mesh);

  const guide = createGuideLines(items.length, 0x38bdf8, 0.55);
  root.add(guide.object);

  // 배경 반투명 격리(Ghost Isolation): 테스트 단계에서 메커니즘 부품만 선명(불투명 100%)하고 나머지는 반투명(opacity=0.12) 처리
  let isoMode = null;
  function setIsolation(mode) {
    if (mode === isoMode) return;
    isoMode = mode;
    const keep = mode === 'hook' ? hookFocusHolders : mode === 'trigger' ? triggerFocusHolders : null;
    for (const it of items) {
      const isGhost = !!keep && !keep.has(it.h);
      it.h.traverse((o) => {
        if (!o.isMesh) return;
        if (isGhost) {
          if (!o.userData._origMat) o.userData._origMat = o.material;
          if (!o.userData._ghostMat) {
            const cloneOne = (mat) => {
              const cm = mat.clone();
              cm.transparent = true;
              cm.opacity = 0.12;
              cm.depthWrite = false;
              return cm;
            };
            o.userData._ghostMat = Array.isArray(o.userData._origMat)
              ? o.userData._origMat.map(cloneOne)
              : cloneOne(o.userData._origMat);
          }
          o.material = o.userData._ghostMat;
        } else if (o.userData._origMat) {
          o.material = o.userData._origMat;
        }
      });
    }
  }

  let phi = 0;
  let explode = 0;
  let boltsPref = true;
  let guidesOn = true;
  let bandsPref = true;
  let activeTestMode = null;
  const hidden = {};
  const qx = new THREE.Quaternion(), qSpin = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);
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
    for (const b of bands) b.m.visible = !activeTestMode && bandsPref && e < 0.02 && (b.loaded || b.fly >= 0);
  }

  // 탄성 비행 형상 갱신 (0~0.045s: 훅의 법칙 초고속 탄성 수축 → 0.045s+: 원형 링 감쇠 탄성 진동 비행!)
  function updateElasticFlightMesh(cb, t, origin, ux, uy) {
    if (t < 0.045) {
      // ① 초고속 탄성 수축 (후방 고리가 걸쇠 돔 −12.3에서 총구 −74.5로 맹렬히 수축하며 앞 고리가 총구 돔 −80.5를 벗어남)
      const k = t / 0.045;
      const e2 = k * k;
      const curFrontZ = origin.z + (zF - 10 * e2);
      const curRearZ = origin.z + (-12.3 + (zF + 26 - (-12.3)) * e2);
      const curRearR = 38.6 + (30.5 - 38.6) * e2;
      cb.setStretched(ux, uy, 28.8, curFrontZ, curRearR, curRearZ, { rWrapF: 3.6 + 8 * e2, rWrapR: 3.6 + 8 * e2, bow: 13 * e2 });
      return;
    }
    // ② 자유 탄성 비행: 원형 고무줄(Ø37 mm)이 감쇠 조화 진동(길이↔폭 탄성 출렁임) + 자연 회전하며 전방(−Z) 포물선 비행!
    const ft = t - 0.045;
    const zPos = origin.z + (zF - 10) - BAND_SPEED * ft;
    const yDrop = -0.5 * 980 * ft * ft;
    const osc = Math.exp(-5.8 * ft) * Math.cos(44 * ft); // 감쇠 탄성 진동!
    const rBase = 18.5; // 자연 원형 반지름 Ø37 mm
    const rx = Math.max(8, rBase - 7.5 * osc);
    const rz = Math.max(8, rBase + 9.0 * osc);
    const pitch = ft * 7.5;
    cb.setRing(origin.x + ux * 31.0, origin.y + uy * 31.0 + yDrop, zPos, ux, uy, rx, rz, pitch);
  }

  const crossed = (a0, before, after, at) => Math.floor((a0 + after - at) / TWO_PI) > Math.floor((a0 + before - at) / TWO_PI);
  let autoLoad = true;
  function spin(d, auto = true) {
    autoLoad = auto;
    let fired = 0;
    const before = phi; phi += d;
    rotor.rotation.z = phi;
    for (const b of bands) {
      if (b.loaded) {
        // 12시 쐐기 구간(CAM_START ~ FIRE_AT)에 진입하면 후방 고리가 실제로 +Z(−16.5 → −12.3) 돔 끝으로 밀림!
        const ang = normAng(b.a0 + phi - FIRE_AT);
        if (ang > -0.36 && ang <= 0) {
          const push = Math.max(0, Math.min(1, (ang + 0.36) / 0.36));
          b.cb.setStretched(b.ux, b.uy, 28.8, zF, 38.6 + push * 0.6, zR + push * 4.2);
        } else if (b.grow >= 1) {
          b.cb.setStretched(b.ux, b.uy, 28.8, zF, 38.6, zR);
        }
        if (crossed(b.a0, before, phi, FIRE_AT)) {
          b.loaded = false; b.fly = 0; fired++;
          const pv = pivots['03'];
          pv.add(b.m);
          const worldA = b.a0 + phi;
          b.flyUx = Math.cos(worldA);
          b.flyUy = Math.sin(worldA);
          b.flyOrigin.copy(rotor.position);
          b.m.position.set(0, 0, 0); b.m.rotation.set(0, 0, 0); b.m.scale.set(1, 1, 1);
          updateElasticFlightMesh(b.cb, 0, b.flyOrigin, b.flyUx, b.flyUy);
          b.m.visible = !activeTestMode && bandsPref && explode < 0.02;
        }
      }
    }
    return fired;
  }

  function flyBands(dt) {
    let moving = false;
    for (const b of bands) {
      if (b.fly >= 0) {
        b.fly += dt; moving = true;
        updateElasticFlightMesh(b.cb, b.fly, b.flyOrigin, b.flyUx, b.flyUy);
        if (b.fly > 0.68) {
          b.fly = -1; b.m.visible = false;
          if (autoLoad) {
            b.loaded = true; b.grow = 0;
            rotor.add(b.m);
            b.m.position.set(0, 0, 0); b.m.rotation.set(0, 0, 0); b.m.scale.set(1, 1, 1);
            b.m.visible = !activeTestMode && bandsPref && explode < 0.02;
          }
        }
      } else if (b.loaded && b.grow < 1) {
        b.grow = Math.min(1, b.grow + dt * 2.4); moving = true;
        // 자동 장전 시에도 원형 고무줄이 총구에 걸리고 뒤로 당겨지는 애니메이션 재생!
        poseHookTestBand(b.cb, b.ux, b.uy, Math.min(0.92, b.grow * 0.92), { zF, zR });
        if (b.grow >= 1) b.cb.setStretched(b.ux, b.uy, 28.8, zF, 38.6, zR);
      }
    }
    return moving;
  }

  // ★ [규칙 10.6] 조립 단계 내 인터랙티브 메커니즘 테스트 시뮬레이터 ('hook' | 'trigger' | null)
  //   - 'hook': 1시 배럴에 자연 원형 고무줄을 총구 캡너트에 걸고 뒤로 탄성 당겨 후방 걸쇠 캡너트에 안착·고정 검증
  //   - 'trigger': 1시 배럴이 12시 36.9° 쐐기 아래로 회전 진입 → 고무줄 뒤 고리가 +Z 돔 끝으로 밀림 → 탄성 수축 & 무관통 원형 비행!
  const b1 = bands[1]; // 1시 배럴 (15, 20), a0 = 53.13°
  function updateTestMode(mode, phase = 0) {
    activeTestMode = mode;
    if (!mode) {
      setIsolation(null);
      testBand.mesh.visible = false;
      rotor.add(testBand.mesh);
      rotor.rotation.z = phi;
      for (const b of bands) b.m.visible = bandsPref && explode < 0.02 && (b.loaded || b.fly >= 0);
      return null;
    }
    setIsolation(mode);
    for (const b of bands) b.m.visible = false;
    testBand.mesh.visible = true;
    const p = ((phase % 1) + 1) % 1;

    if (mode === 'hook') {
      rotor.add(testBand.mesh);
      rotor.rotation.z = 0; // 1시 배럴을 정위치에 고정
      const info = poseHookTestBand(testBand, b1.ux, b1.uy, p, { zF, zR });
      return { mode: 'hook', ...info };
    }

    // mode === 'trigger': 1시 배럴(a0=53.13°)을 12시(90°, phi=36.87°) ~ 이탈(FIRE_AT=98.0°, phi=44.9°) 구간으로 저속 회전!
    const phiStart = (90 - 24) * DEG - b1.a0; // 12시 오른쪽 24°에서 접근 시작
    const phiFire = FIRE_AT - b1.a0;          // 12시 쐐기 이탈 시점
    const phiEnd = phiFire + 0.22;            // 이탈 후 여유 회전
    if (p < 0.30) {
      // ① 12시 쐐기 접근
      rotor.add(testBand.mesh);
      const k = p / 0.30;
      rotor.rotation.z = phiStart + (phiFire - 0.30 - phiStart) * k;
      const info = testBand.setStretched(b1.ux, b1.uy, 28.8, zF, 38.6, zR);
      return { mode: 'trigger', stage: '① 12시 격발 쐐기 진입', detail: '장전된 원형 고무줄이 로터와 함께 12시 36.9° 빨간 쐐기 아래로 접근합니다 (걸쇠 핀 상단과 1.2 mm 틈).', stretch: info.stretch, forceN: (info.stretch - 1) * 6.2 };
    }
    if (p < 0.58) {
      // ② 36.9° 경사 쐐기 접촉 & 고무줄 뒤 고리 +Z 밀어냄!
      rotor.add(testBand.mesh);
      const k = (p - 0.30) / 0.28;
      rotor.rotation.z = (phiFire - 0.30) + 0.30 * k;
      const pushZ = k * 4.3; // z = -16.5 → -12.2 (후방 걸쇠 캡너트 둥근 +Z 돔 끝!)
      const info = testBand.setStretched(b1.ux, b1.uy, 28.8, zF, 38.6 + k * 0.8, zR + pushZ);
      return { mode: 'trigger', stage: '② 36.9° 쐐기 +Z 밀어냄 (트리거 작동!)', detail: `금속 걸쇠 핀은 1.2 mm 아래로 통과하고, 고무줄 뒤 고리만 사선 쐐기에 밀려 z=${(zR + pushZ).toFixed(1)} mm(둥근 돔 끝)로 이동합니다!`, stretch: info.stretch, forceN: (info.stretch - 1) * 6.2 };
    }
    // ③ 돔 이탈 → 초고속 탄성 수축 → ④ 원형 탄성 진동 무관통 비행!
    const fk = (p - 0.58) / 0.42;
    rotor.rotation.z = phiFire + (phiEnd - phiFire) * Math.min(1, fk * 1.4);
    const pv = pivots['03'];
    pv.add(testBand.mesh);
    const flyT = fk * 0.26; // 슬로우모션 탄성 수축 & 진동 비행 (0 ~ 260 ms)
    const worldA = b1.a0 + phiFire;
    updateElasticFlightMesh(testBand, flyT, rotor.position, Math.cos(worldA), Math.sin(worldA));
    if (flyT < 0.045) {
      return { mode: 'trigger', stage: '③ 돔 이탈 & 탄성 수축 반동!', detail: '뒤 고리가 캡너트 둥근 돔(−12.5)에서 벗어나는 순간, 저장된 탄성력으로 앞쪽 총구로 급격히 수축·가속됩니다!', stretch: 1.4, forceN: 2.5 };
    }
    return { mode: 'trigger', stage: '④ 원형 고무줄 무관통 탄성 비행 ✔', detail: '총구 캡너트(−Z 돔) 앞 장애물 0개인 허공으로 원형 탄성 진동하며 직선 발사됩니다!', stretch: 1.0, forceN: 0 };
  }

  function reload() {
    for (const b of bands) {
      b.loaded = true; b.fly = -1; b.grow = 1;
      rotor.add(b.m);
      b.m.position.set(0, 0, 0); b.m.rotation.set(0, 0, 0); b.m.scale.set(1, 1, 1);
      b.cb.setStretched(b.ux, b.uy, 28.8, zF, 38.6, zR);
      b.m.visible = !activeTestMode && bandsPref && explode < 0.02;
    }
  }
  function reset() {
    updateTestMode(null);
    phi = 0; rotor.rotation.z = 0; explode = 0; reload(); setTilt(0); setWheels(0, 0); applyExplode();
  }
  function showBands(v) { bandsPref = v; for (const b of bands) b.m.visible = !activeTestMode && v && explode < 0.02 && (b.loaded || b.fly >= 0); }
  function showBolts(v) { boltsPref = v; applyExplode(); }
  function setExplode(v) { explode = Math.max(0, Math.min(1, v)); applyExplode(); }
  function setGuides(v) { guidesOn = v; applyExplode(); }
  function setHidden(no, v) { hidden[no] = v; applyExplode(); }

  const testStages = [
    {
      id: 'hook',
      afterHolder: hookAfterHolder,
      sheet: '03',
      name: '★ [메커니즘 거치 테스트] 원형 고무줄 총구·걸쇠 거치 & 당김 시뮬레이션',
      short: '03 · ★ 원형 고무줄 거치·당김 테스트',
      kind: '★ 메커니즘 테스트 (배경 반투명 · 거치/당김)',
      cam: { pos: [74, 186, -46], target: [16, 168, -45] },
      focusPt: new THREE.Vector3(18, 170, -45),
    },
    {
      id: 'trigger',
      afterHolder: triggerAfterHolder,
      sheet: '04',
      name: '★ [메커니즘 격발 테스트] 12시 36.9° 쐐기 이탈 & 원형 고무줄 탄성 발사',
      short: '04 · ★ 12시 쐐기 격발·탄성 발사 테스트',
      kind: '★ 메커니즘 테스트 (배경 반투명 · 트리거 발사)',
      cam: { pos: [76, 198, -56], target: [0, 174, -40] },
      focusPt: new THREE.Vector3(0, 176, -34),
    },
  ];

  setWheels(0, 0); setTilt(0); applyExplode();
  return {
    root, groups, order, items, rotor, mechSteps, testStages,
    setWheels, setTilt, spin, flyBands, reload, reset,
    showBands, showBolts, setExplode, setGuides, setHidden,
    setIsolation, updateTestMode,
    loaded: () => bands.filter((b) => b.loaded).length,
    count: ASSEMBLY.length, structCount: GUN.structCount, fastenerCount: GUN.fastenerCount,
    bom: BOM, spacers: SPACERS,
  };
}
