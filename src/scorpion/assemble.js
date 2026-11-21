import * as THREE from 'three';
import { loadModules, makeHolder } from '../eagle/assemble.js';
import { createGuideLines } from '../assembly/render.js';
import { BOLT_PITCH } from '../assembly/solver.js';
import ASSEMBLY, { BOT, BOM, SPACERS } from './assembly.js';

// "크림슨 스콜피온 (Crimson Scorpion) v4" 완성품 3D 조립 (ASSEMBLY_RULES.md 1~10장 · 규칙 2.4 · 2.5 · 10.6 완전 준수)
// - [규칙 2.5] 4륜 전원 DC 130rpm 직결 (M1~M4 · Ø50 × 4 · 헛바퀴 0)
// - [규칙 2.4] 쌍발 400rpm 수직 어퍼컷 초승달 낫 스피너 (EX-M1 · EX-M2 · battle-t × 4 · Ø104 mm)
// - [규칙 10.6] 좌·우 대칭 4절링크 집게 크러셔 (OUT1·OUT2 · R=10/L=40/r=20 · 오차 0.0000 mm · 토크 2.87× · 낫 여유 +12.1 mm)
// - 오버헤드 전갈 꼬리 해머 (OUT3 · 대기 55° → 타격 0° · 독침 4발 · 수직 낫 위 +11.4 mm 여유)

const DEG = Math.PI / 180;
const TWO_PI = Math.PI * 2;
const UP_Y = new THREE.Vector3(0, 1, 0);
const FASTENER_IDS = new Set(['bolt-m3x6', 'bolt-m3x10', 'bolt-m26x10', 'nut-m3', 'cap-nut-m3', 's-nut-blue']);

export const WHEEL_R = BOT.wheelR;
export const CLAW_OPEN = BOT.clawOpenDeg;
export const CLAW_NEUT = BOT.clawNeutDeg;
export const CLAW_CLAMP = BOT.clawClampDeg;
export const TAIL_READY = BOT.tailReadyDeg;
export const TAIL_SMASH = BOT.tailSmashDeg;

const PART_OFFSET = {
  '01': [0, 0, 0],
  '02': [0, 26, -56],
  '03': [0, -14, -42],
  '04': [0, 88, 28],
  '05': [0, 42, 16],
  '06': [0, 22, 48],
};

// 우측 4절링크 해석 해 (tools/scorpion_blueprint.py solve_claw_right 동일 식 · 오차 0.0000 mm)
export function solveClawRight(aDeg) {
  const a = aDeg * DEG;
  const Ax = BOT.clawSX + BOT.clawRC * Math.cos(a);
  const Az = BOT.clawSZ + BOT.clawRC * Math.sin(a);
  const dx = Ax - BOT.clawPX;
  const dz = Az - BOT.clawPZ;
  const d = Math.hypot(dx, dz);
  const ex = dx / d, ez = dz / d;
  const x = (BOT.clawRR * BOT.clawRR - BOT.clawL * BOT.clawL + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, BOT.clawRR * BOT.clawRR - x * x));
  const c1 = [BOT.clawPX + x * ex + h * (-ez), BOT.clawPZ + x * ez + h * ex];
  const c2 = [BOT.clawPX + x * ex - h * (-ez), BOT.clawPZ + x * ez - h * ex];
  const [Bx, Bz] = c1[1] >= c2[1] ? c1 : c2; // 로커 B는 피벗 P 뒤쪽(+Z)
  const ux = (BOT.clawPX - Bx) / BOT.clawRR;
  const uz = (BOT.clawPZ - Bz) / BOT.clawRR;
  const phiDeg = Math.atan2(ux, -uz) / DEG; // + = 바깥 열림, - = 안쪽 압착
  return { Ax, Az, Bx, Bz, phiDeg };
}

const NEUT_SOL = solveClawRight(CLAW_NEUT);

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
  holder.add(model.object3d);

  if (a.xdir && a.up) {
    const X = new THREE.Vector3(...a.xdir).normalize();
    const Y = new THREE.Vector3(...a.up).normalize();
    const Z = new THREE.Vector3().crossVectors(X, Y).normalize();
    holder.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
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


// 디테일 3D 배선 (배터리·4WD 모터·쌍발 400rpm·서보 3개·센서·LED·부저·BT → CPU, 후방 방패 battle-s 및 가동부 관통 0!)
function buildWiring() {
  const wg = new THREE.Group();
  wg.name = 'wiring';
  const matRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.55 });
  const matBlk = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 });
  const matYel = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });
  const matBlu = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.55 });
  const addWire = (pts, mat, r = 1.05, label = '배선 케이블') => {
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 22, r, 6, false), mat);
    m.userData = { name: label, id: 'cable-3pin', sheet: '05' };
    wg.add(m);
  };
  // 1) 배터리 6V → CPU 전원 (빨강+검정 트윈 선, 내부 섀시 통과)
  addWire([[4, 34, 78], [4, 52, 82], [-8, 76, 80], [-14, 86, 72]], matRed, 1.2, '전원 케이블 (+6V 빨강)');
  addWire([[-4, 34, 78], [-4, 52, 82], [-12, 76, 80], [-18, 86, 72]], matBlk, 1.2, '전원 케이블 (GND 검정)');
  // 2) 4WD 구동 모터 (M1~M4) → CPU (차체 내부 측면 채널 경유)
  addWire([[-34, 40, -15], [-30, 48, 5], [-28, 76, 30], [-24, 86, 48]], matRed, 0.95, 'M1 앞 왼 구동 모터 배선');
  addWire([[34, 40, -15], [30, 48, 5], [28, 76, 30], [24, 86, 48]], matRed, 0.95, 'M2 앞 오른 구동 모터 배선');
  addWire([[-34, 40, 58], [-32, 58, 62], [-30, 82, 62], [-26, 86, 62]], matBlk, 0.95, 'M3 뒤 왼 구동 모터 배선');
  addWire([[34, 40, 58], [32, 58, 62], [30, 82, 62], [26, 86, 62]], matBlk, 0.95, 'M4 뒤 오른 구동 모터 배선');
  // 3) CPU → 모터 확장 보드(A3) → 쌍발 400rpm 어퍼컷 모터 (EX-M1/EX-M2, 무기 레일 상단 경유)
  addWire([[-6, 86, 38], [-6, 84, 15], [-6, 84, -8]], matBlu, 1.1, 'CPU ↔ 모터 확장 보드 신호선');
  addWire([[-18, 84, -22], [-34, 79, -42], [-38, 81, -82], [-39, 90, -104]], matRed, 1.05, 'EX-M1 왼 어퍼컷 400rpm 배선');
  addWire([[18, 84, -22], [34, 79, -42], [38, 81, -82], [39, 90, -104]], matRed, 1.05, 'EX-M2 오른 어퍼컷 400rpm 배선');
  // 4) 서보 3개 (OUT1 왼 집게 · OUT2 오른 집게 · OUT3 꼬리 해머) → CPU (3핀 노랑 신호선)
  addWire([[-20, 38, -12], [-20, 58, 12], [-18, 79, 34], [-14, 86, 46]], matYel, 0.95, 'OUT1 왼 집게 서보 3핀 케이블');
  addWire([[20, 38, -12], [20, 58, 12], [18, 79, 34], [14, 86, 46]], matYel, 0.95, 'OUT2 오른 집게 서보 3핀 케이블');
  // 꼬리 서보: 우측 타워 기둥 안쪽(z=+70, battle-s z=+109 앞쪽 39 mm!)을 따라 상승 → 방패 관통 0!
  addWire([[34, 168, 72], [46, 148, 72], [48, 108, 70], [34, 88, 68]], matYel, 1.0, 'OUT3 전갈 꼬리 서보 3핀 케이블');
  // 5) 센서 · 부저 · RGB LED · 블루투스 → CPU (모두 battle-s 앞쪽 경유 · 방패 관통 0!)
  addWire([[0, 82, -55], [10, 82, -32], [10, 83, 18], [8, 86, 42]], matYel, 0.85, 'IN1 전방 적외선 센서 3핀 케이블');
  // 바닥 컬러 센서(z=127, y=31): 하부 섀시 아래 z=105→88→상승(battle-s y≥126 아래·앞쪽 통과 → 관통 0!)
  addWire([[0, 33, 118], [0, 35, 96], [6, 56, 86], [8, 84, 80]], matYel, 0.85, 'IN2 바닥 컬러 센서 3핀 케이블');
  // 후방 접촉 센서(z=103, y=88): 상판 위 y=82로 바로 전진(battle-s z=109 앞쪽 → 관통 0!)
  addWire([[0, 86, 98], [0, 82, 86], [4, 85, 76]], matYel, 0.85, 'IN3 후방 접촉 센서 3핀 케이블');
  addWire([[-4, 82, 24], [-4, 84, 42]], matYel, 0.85, 'OUT5 부저 보드 3핀 케이블');
  addWire([[-25, 154, 48], [-44, 146, 58], [-46, 106, 62], [-30, 87, 64]], matBlu, 0.9, 'OUT4 RGB LED · BT 3핀 케이블');
  return wg;
}

export async function buildScorpion(loadPart, onProgress) {
  const mods = await loadModules(ASSEMBLY, loadPart, onProgress);
  const root = new THREE.Group();
  const groups = {}, order = {};
  const items = [];
  const mechSteps = [];

  // 구동부 피벗 그룹
  const wheelPivots = {
    wheel_M1: { g: new THREE.Group(), side: -1, pos: [-(BOT.wheelX || 84.5), BOT.axleY, -30] },
    wheel_M2: { g: new THREE.Group(), side: +1, pos: [+(BOT.wheelX || 84.5), BOT.axleY, -30] },
    wheel_M3: { g: new THREE.Group(), side: -1, pos: [-(BOT.wheelX || 84.5), BOT.axleY, +70] },
    wheel_M4: { g: new THREE.Group(), side: +1, pos: [+(BOT.wheelX || 84.5), BOT.axleY, +70] },
  };
  for (const wp of Object.values(wheelPivots)) wp.g.position.set(...wp.pos);

  const spinL = new THREE.Group(); spinL.position.set(0, BOT.spinY, BOT.spinZ);
  const spinR = new THREE.Group(); spinR.position.set(0, BOT.spinY, BOT.spinZ);

  const crankL = new THREE.Group(); crankL.position.set(-BOT.clawSX, BOT.clawCrankY || 65.0, BOT.clawSZ);
  const crankR = new THREE.Group(); crankR.position.set(+BOT.clawSX, BOT.clawCrankY || 65.0, BOT.clawSZ);
  const clawL = new THREE.Group(); clawL.position.set(-BOT.clawPX, BOT.clawYArm, BOT.clawPZ);
  const clawR = new THREE.Group(); clawR.position.set(+BOT.clawPX, BOT.clawYArm, BOT.clawPZ);

  const tailArm = new THREE.Group(); tailArm.position.set(0, BOT.tailY, BOT.tailZ);

  const links = { L: { bar: null, pinA: null, pinB: null }, R: { bar: null, pinA: null, pinB: null } };

  // 메커니즘 테스트 배경 반투명 격리(Ghost Isolation)용 포커스 세트
  const clawFocus = new Set();
  const spinFocus = new Set();
  const tailFocus = new Set();
  let clawAfterHolder = null, spinAfterHolder = null, tailAfterHolder = null;

  for (let idx = 0; idx < ASSEMBLY.length; idx++) {
    const a = ASSEMBLY[idx];
    const h = placePart(a, mods);
    if (a.mech) mechSteps.push({ step1: idx + 1, name: a.n, mech: a.mech, h });

    if (a.s === '02' && (a.group === 'spin_L' || a.group === 'spin_R' || a.id === 'dc-motor-400-rs')) {
      spinFocus.add(h);
      if (a.id === 'battle-t' && a.group === 'spin_R') spinAfterHolder = h;
    }
    if (a.s === '03') {
      clawFocus.add(h);
      if (a.id === 'grab' && a.group === 'claw_R') clawAfterHolder = h;
    }
    if (a.s === '04' && (a.group === 'tail_arm' || a.id === 'servo-digital')) {
      tailFocus.add(h);
      if (a.id === 'battle-g') tailAfterHolder = h;
    }
    // 꼬리 테스트 시 하단 수직 낫의 여유 간격(+11.4 mm)도 함께 보이도록 포커스 유지
    if (a.group === 'spin_L' || a.group === 'spin_R') {
      tailFocus.add(h);
      clawFocus.add(h);
    }

    (order[a.s] ??= []).push(h);
    const g = groups[a.s] ??= new THREE.Group();
    let parent = g;

    if (a.group && wheelPivots[a.group]) {
      parent = wheelPivots[a.group].g;
      h.position.sub(parent.position);
    } else if (a.group === 'spin_L') {
      parent = spinL;
      h.position.sub(spinL.position);
    } else if (a.group === 'spin_R') {
      parent = spinR;
      h.position.sub(spinR.position);
    } else if (a.group === 'crank_L') {
      parent = crankL;
      h.position.sub(crankL.position);
    } else if (a.group === 'crank_R') {
      parent = crankR;
      h.position.sub(crankR.position);
    } else if (a.group === 'claw_L') {
      parent = clawL;
      h.position.sub(clawL.position);
    } else if (a.group === 'claw_R') {
      parent = clawR;
      h.position.sub(clawR.position);
    } else if (a.group === 'link_L' || a.group === 'link_R') {
      const side = a.group === 'link_L' ? 'L' : 'R';
      if (a.id === 'frame-s5-pcb') links[side].bar = h;
      else if (a.n.includes('크랭크 핀 A')) links[side].pinA = h;
      else if (a.n.includes('로커 핀 B')) links[side].pinB = h;
      parent = g;
    } else if (a.group === 'tail_arm') {
      parent = tailArm;
      h.position.sub(tailArm.position);
    }
    parent.add(h);

    const po = PART_OFFSET[a.s] || [0, 0, 0];
    const expW = new THREE.Vector3(po[0], po[1], po[2]);
    if (a.exp) {
      if (a.fastener) {
        const dir = new THREE.Vector3(...a.exp).normalize();
        const proj = expW.dot(dir);
        if (proj < 0) expW.addScaledVector(dir, -proj);
        expW.addScaledVector(dir, 32);
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
    });
  }

  for (const wp of Object.values(wheelPivots)) groups['01'].add(wp.g);
  groups['02'].add(spinL, spinR);
  groups['03'].add(crankL, crankR, clawL, clawR);
  groups['04'].add(tailArm);
  for (const g of Object.values(groups)) root.add(g);

  const wiring = buildWiring();
  groups['05'].add(wiring);
  const guide = createGuideLines(items.length, 0xef4444, 0.55);
  root.add(guide.object);

  // 배경 반투명 격리(Ghost Isolation): 메커니즘 테스트 시 핵심 부품만 100% 선명, 나머지 12% 반투명
  let isoMode = null;
  function setIsolation(mode) {
    if (mode === isoMode) return;
    isoMode = mode;
    const keep = mode === 'claw' ? clawFocus : mode === 'spin' ? spinFocus : mode === 'tail' ? tailFocus : null;
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

  let explode = 0;
  let boltsPref = true;
  let guidesOn = true;
  let spinAng = 0;
  let clawDegL = CLAW_NEUT, clawDegR = CLAW_NEUT;
  let tailDeg = TAIL_READY;
  const hidden = {};
  const qSpin = new THREE.Quaternion(), invQ = new THREE.Quaternion();
  const locOff = new THREE.Vector3(), w0 = new THREE.Vector3(), w1 = new THREE.Vector3();

  // 4WD 바퀴 회전 (mm 이동 거리 → 라디안)
  function setWheels(dl, dr) {
    for (const wp of Object.values(wheelPivots)) {
      wp.g.rotation.x = -(wp.side > 0 ? dr : dl) / WHEEL_R;
    }
  }

  // 쌍발 수직 어퍼컷 초승달 낫 회전 (+X축 회전 = 앞쪽 아래→위 어퍼컷!)
  function setSpin(rad) {
    spinAng = rad;
    spinL.rotation.x = rad;
    spinR.rotation.x = rad;
  }

  // 좌·우 대칭 4절링크 집게 크러셔 포즈 (aL, aR: 서보 각도 72°=최대 압착 ~ 160°=최대 열림)
  function syncLinkItems(side, sx, sol) {
    const L = links[side];
    const Ax = sol.Ax * sx, Az = sol.Az;
    const Bx = sol.Bx * sx, Bz = sol.Bz;
    if (L.bar) {
      L.bar.position.set((Ax + Bx) / 2, BOT.clawYLink, (Az + Bz) / 2);
      L.bar.rotation.set(0, Math.atan2(-(Bz - Az), Bx - Ax), 0);
    }
    if (L.pinA) L.pinA.position.set(Ax, L.pinA.position.y, Az);
    if (L.pinB) L.pinB.position.set(Bx, L.pinB.position.y, Bz);
    for (const it of items) {
      if (it.h === L.bar || it.h === L.pinA || it.h === L.pinB) {
        it.p0.copy(it.h.position);
        if (it.h === L.bar) it.q0.copy(it.h.quaternion);
      }
    }
  }

  function setClaws(aL, aR = aL) {
    clawDegL = Math.max(CLAW_CLAMP, Math.min(CLAW_OPEN, aL));
    clawDegR = Math.max(CLAW_CLAMP, Math.min(CLAW_OPEN, aR));
    const solL = solveClawRight(clawDegL);
    const solR = solveClawRight(clawDegR);
    crankL.rotation.y = +(clawDegL - CLAW_NEUT) * DEG;
    crankR.rotation.y = -(clawDegR - CLAW_NEUT) * DEG;
    clawL.rotation.y = +(solL.phiDeg - NEUT_SOL.phiDeg) * DEG;
    clawR.rotation.y = -(solR.phiDeg - NEUT_SOL.phiDeg) * DEG;
    syncLinkItems('L', -1, solL);
    syncLinkItems('R', +1, solR);
    return { phiL: solL.phiDeg, phiR: solR.phiDeg };
  }

  // 오버헤드 전갈 꼬리 해머 (0° = 수평 타격 최저점 y=141.6 · 55° = 대기 자세)
  function setTail(deg) {
    tailDeg = Math.max(TAIL_SMASH, Math.min(TAIL_READY, deg));
    tailArm.rotation.x = tailDeg * DEG;
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
    wiring.visible = e < 0.02 && !hidden['05'];
    guide.update(segs);
  }

  // ★ [규칙 10.6] 인터랙티브 메커니즘 테스트 시뮬레이터 ('spin' | 'claw' | 'tail' | null)
  function updateTestMode(mode, phase = 0) {
    if (!mode) {
      setIsolation(null);
      return null;
    }
    setIsolation(mode);
    const p = ((phase % 1) + 1) % 1;
    if (mode === 'spin') {
      setSpin(p * TWO_PI * 4);
      setClaws(CLAW_NEUT, CLAW_NEUT);
      setTail(TAIL_READY);
      return {
        mode: 'spin',
        stage: '① 쌍발 400rpm 수직 어퍼컷 회전',
        detail: `Ø104 mm battle-t 초승달 낫 4장이 아래→위(어퍼컷)로 400rpm(날 끝 2.18 m/s) 고속 회전하며 좌·우 대칭 자이로 상쇄를 유지합니다.`,
        metric: '400 rpm · Ø104 mm · 좌/우 공극 18.4 mm',
      };
    }
    if (mode === 'claw') {
      // 0→0.5: 160°(열림) → 72°(최대 압착), 0.5→1.0: 72° → 160°
      const k = p < 0.5 ? p * 2 : (1 - p) * 2;
      const a = CLAW_OPEN + (CLAW_CLAMP - CLAW_OPEN) * k;
      const { phiR } = setClaws(a, a);
      setSpin(p * TWO_PI * 3);
      return {
        mode: 'claw',
        stage: k > 0.65 ? '② 4절링크 최대 압착 (72° · 낫 여유 +12.1 mm)' : '① 4절링크 광폭 포획 개방 (160°)',
        detail: `서보 ${a.toFixed(0)}° → 크랭크 R=10 · 커플러 L=40 · 로커 r=20 → 집게 ${phiR >= 0 ? '+' : ''}${phiR.toFixed(1)}° (토크 ${BOT.clawAdv}× 증폭 · 그랩 포함 회전 낫과 +12.1 mm 여유)`,
        metric: `서보 ${a.toFixed(0)}° → 집게 ${phiR >= 0 ? '+' : ''}${phiR.toFixed(1)}° (오차 0.0000 mm)`,
      };
    }
    // mode === 'tail': 55° 대기 → 0° 다운스트라이크 타격 → 복귀
    let deg = TAIL_READY;
    let stage = '① 전갈 꼬리 대기 자세 (+55°)';
    if (p < 0.25) {
      deg = TAIL_READY;
    } else if (p < 0.50) {
      const k = (p - 0.25) / 0.25;
      deg = TAIL_READY * (1 - k * k);
      stage = '② 오버헤드 다운스트라이크 강타! (55° → 0°)';
    } else if (p < 0.72) {
      deg = TAIL_SMASH;
      stage = `③ 타격 최저점 (0° · 독침 끝 y=141.6 mm · 낫 위 +${BOT.tailSpinGap} mm 여유)`;
    } else {
      const k = (p - 0.72) / 0.28;
      deg = TAIL_READY * k;
      stage = '④ 꼬리 해머 복귀 (+55°)';
    }
    setTail(deg);
    setSpin(p * TWO_PI * 4);
    setClaws(CLAW_CLAMP, CLAW_CLAMP);
    return {
      mode: 'tail',
      stage,
      detail: `꼬리 각도 ${deg.toFixed(1)}° · 필요 토크 ${BOT.tailTorque} kg·cm(서보 안전율 ${(5.5 / BOT.tailTorque).toFixed(1)}×) · 회전 중인 수직 낫 최상단(130.2 mm) 위로 +${BOT.tailSpinGap} mm 안전 통과!`,
      metric: `꼬리 ${deg.toFixed(0)}° · 낫 여유 +${BOT.tailSpinGap} mm`,
    };
  }

  function reset() {
    updateTestMode(null);
    explode = 0;
    setWheels(0, 0);
    setSpin(0);
    setClaws(CLAW_NEUT, CLAW_NEUT);
    setTail(TAIL_READY);
    applyExplode();
  }

  function showBolts(v) { boltsPref = v; applyExplode(); }
  function setExplode(v) { explode = Math.max(0, Math.min(1, v)); applyExplode(); }
  function setGuides(v) { guidesOn = v; applyExplode(); }
  function setHidden(no, v) { hidden[no] = v; applyExplode(); }

  const testStages = [
    {
      id: 'spin',
      afterHolder: spinAfterHolder,
      sheet: '02',
      name: '★ [메커니즘 테스트 ①] 쌍발 400rpm 수직 어퍼컷 초승달 낫 회전',
      short: '02 · ★ 쌍발 400rpm 수직 낫 테스트',
      kind: '★ 메커니즘 테스트 (배경 반투명 · 수직 낫)',
      cam: BOT.mechCams.spin,
      focusPt: new THREE.Vector3(0, BOT.spinY, BOT.spinZ),
    },
    {
      id: 'claw',
      afterHolder: clawAfterHolder,
      sheet: '03',
      name: '★ [메커니즘 테스트 ②] 좌·우 대칭 4절링크 집게 크러셔 (160°↔72° · 낫 +12.1 mm 여유)',
      short: '03 · ★ 4절링크 집게 크러셔 테스트',
      kind: '★ 메커니즘 테스트 (배경 반투명 · 4절링크)',
      cam: BOT.mechCams.claw,
      focusPt: new THREE.Vector3(32, BOT.clawYArm, -68),
    },
    {
      id: 'tail',
      afterHolder: tailAfterHolder,
      sheet: '04',
      name: '★ [메커니즘 테스트 ③] 오버헤드 전갈 꼬리 해머 타격 (55°→0° · 낫 위 +11.4 mm)',
      short: '04 · ★ 전갈 꼬리 해머 타격 테스트',
      kind: '★ 메커니즘 테스트 (배경 반투명 · 꼬리 해머)',
      cam: BOT.mechCams.tail,
      focusPt: new THREE.Vector3(0, 148, -15),
    },
  ];

  reset();
  return {
    root, groups, order, items, spinL, spinR, tailArm, mechSteps, testStages,
    setWheels, setSpin, setClaws, setTail, reset,
    showBolts, setExplode, setGuides, setHidden,
    setIsolation, updateTestMode,
    count: ASSEMBLY.length, structCount: BOT.structCount, fastenerCount: BOT.fastenerCount,
    bom: BOM, spacers: SPACERS, bot: BOT,
  };
}
