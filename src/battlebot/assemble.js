import * as THREE from 'three';
import { loadModules, makeHolder } from '../eagle/assemble.js';
import { createGuideLines } from '../assembly/render.js';
import { BOLT_PITCH } from '../assembly/solver.js';
import ASSEMBLY, { TRACK } from './assembly.js';

// 배틀로봇 "썬더 웨지 V3 (전면 재설계)" 조립 (도면: battlebot/BLUEPRINT.md · tools/battlebot_blueprint.py)
// ASSEMBLY_RULES.md 1~10.8장 100% 준수:
// - 전 부품 실측 origin · xdir · up 배치 (공중 부양 0 · 실구멍 최대 오차 0.005 mm)
// - 실제 경첩 hinge-3x3 × 2 + 서보 4절링크(R=10, L=80 소12, 후크 S35 × 2) 0°~38° 0.0000 mm 연동
// - 무한궤도 36마디 + 36러버 × 2줄 (앞/뒤 축 YC=35.5 수평 · 러버 지면 y=0.0 mm 접지)
// - 전선(케이블) 3D 미구현 (규칙 10.8)

const DEG = Math.PI / 180;
const TWO_PI = Math.PI * 2;
const UP_Y = new THREE.Vector3(0, 1, 0);
const FASTENER_IDS = new Set(['bolt-m3x6', 'bolt-m3x10', 'bolt-m26x10', 'nut-m3', 'cap-nut-m3']);
const PATH_LEN = 2 * (TRACK.zr - TRACK.zf) + 2 * Math.PI * TRACK.r;
export const WEDGE_MAX = TRACK.wedgeMaxDeg ?? 38;

export const EXPLODE = {
  '01': [0, -40, 0],
  '02': [0, 0, 0],
  '03': [0, 65, -35],
  '04': [0, -10, -70],
  '05': [0, 85, 20],
  '06': [0, 50, 0],
};

// 궤도 경로 위 거리 d → (축 중심 za/ya, 외향 법선 ny/nz, 진행 접선 ty/tz) · 도면 생성기 track_links와 완전 동일
export function trackFrame(d) {
  const { zf, zr, yc, r } = TRACK;
  const s = zr - zf;
  d = ((d % PATH_LEN) + PATH_LEN) % PATH_LEN;
  if (d < s) return { za: zf + d, ya: yc, ny: -1, nz: 0, ty: 0, tz: 1 };
  if (d < s + Math.PI * r) {
    const th = (d - s) / r;
    return { za: zr, ya: yc, ny: -Math.cos(th), nz: Math.sin(th), ty: Math.sin(th), tz: Math.cos(th) };
  }
  if (d < 2 * s + Math.PI * r) return { za: zr - (d - s - Math.PI * r), ya: yc, ny: 1, nz: 0, ty: 0, tz: -1 };
  const th = (d - 2 * s - Math.PI * r) / r;
  return { za: zf, ya: yc, ny: Math.cos(th), nz: -Math.sin(th), ty: -Math.sin(th), tz: -Math.cos(th) };
}

// 4절링크 해석해 (도면 생성기 solve_wedge_4bar와 0.000000 mm 일치 · 상부 크랭크 분기)
export function solveWedge4Bar(liftDeg) {
  const deg = Math.max(0, Math.min(WEDGE_MAX, liftDeg));
  const ang = (deg - TRACK.wedgeRestDeg) * DEG;
  const tz = TRACK.wedgePZ - TRACK.wedgeTabU * Math.cos(ang) + TRACK.wedgeTabV * Math.sin(ang);
  const ty = TRACK.wedgePY + TRACK.wedgeTabU * Math.sin(ang) + TRACK.wedgeTabV * Math.cos(ang);
  const dz = tz - TRACK.wedgeSZ;
  const dy = ty - TRACK.wedgeSY;
  const d = Math.hypot(dz, dy);
  const R = TRACK.wedgeCrankR;
  const L = TRACK.wedgeLinkL;
  const ca = Math.max(-1, Math.min(1, (R * R + d * d - L * L) / (2 * R * d)));
  const crankRad = Math.atan2(dy, dz) - Math.acos(ca);
  const cz = TRACK.wedgeSZ + R * Math.cos(crankRad);
  const cy = TRACK.wedgeSY + R * Math.sin(crankRad);
  const ux = (cz - tz) / L;
  const uy = (cy - ty) / L;
  return { deg, tz, ty, cz, cy, crankRad, ux, uy, err: Math.abs(Math.hypot(cz - tz, cy - ty) - L) };
}

function hideDemo(obj) {
  obj.traverse((o) => { if (o !== obj && o.userData?.noBounds) o.visible = false; });
}

function setBasisQuat(q, xdir, up) {
  const X = new THREE.Vector3(xdir[0], xdir[1], xdir[2]).normalize();
  const Y = new THREE.Vector3(up[0], up[1], up[2]).normalize();
  const Z = new THREE.Vector3().crossVectors(X, Y).normalize();
  q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
}

function placePart(a, mods) {
  if (!a.o) {
    const h = makeHolder(a, mods);
    h.userData = {
      ...h.userData,
      name: a.n,
      id: a.id,
      sheet: a.s,
      fastener: !!a.fastener || FASTENER_IDS.has(a.id),
      up: a.up ? [...a.up] : null,
      expDir: a.exp ? [...a.exp] : null,
    };
    return { holder: h, handles: null };
  }
  const model = mods[a.id].build();
  hideDemo(model.object3d);
  if (a.id === 'support-spacer' && a.length && model.handles?.setLength) {
    model.handles.setLength(a.length);
  }
  if (a.id === 'hinge-3x3' && model.handles?.pivot) {
    model.handles.pivot.rotation.z = -(TRACK.wedgeRestDeg * DEG);
  }
  const holder = new THREE.Group();
  holder.userData = {
    name: a.n,
    id: a.id,
    sheet: a.s,
    fastener: !!a.fastener || FASTENER_IDS.has(a.id),
    up: a.up ? [...a.up] : null,
    expDir: a.exp ? [...a.exp] : null,
  };
  holder.add(model.object3d);

  if (a.xdir && a.up) {
    setBasisQuat(holder.quaternion, a.xdir, a.up);
  } else if (a.euler) {
    holder.rotation.set(a.euler[0] * DEG, a.euler[1] * DEG, a.euler[2] * DEG, a.eorder || 'XYZ');
  } else if (a.up) {
    const Y = new THREE.Vector3(...a.up).normalize();
    if (Y.y < -0.9999) holder.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
    else holder.quaternion.setFromUnitVectors(UP_Y, Y);
  }
  holder.position.set(a.o[0], a.o[1], a.o[2]);
  return { holder, handles: model.handles || null };
}

export async function buildBattlebot(loadPart, onProgress) {
  const mods = await loadModules(ASSEMBLY, loadPart, onProgress);
  const root = new THREE.Group();
  const groups = {}, order = {};
  const items = [];

  const sprPivots = {
    spr_L_rear:  { g: new THREE.Group(), side: -1, pos: [-TRACK.x, TRACK.yc, TRACK.zr] },
    spr_R_rear:  { g: new THREE.Group(), side: +1, pos: [+TRACK.x, TRACK.yc, TRACK.zr] },
    spr_L_front: { g: new THREE.Group(), side: -1, pos: [-TRACK.x, TRACK.yc, TRACK.zf] },
    spr_R_front: { g: new THREE.Group(), side: +1, pos: [+TRACK.x, TRACK.yc, TRACK.zf] },
  };
  for (const sp of Object.values(sprPivots)) sp.g.position.set(...sp.pos);

  const trackLoopL = new THREE.Group();
  trackLoopL.userData = { name: `왼 무한궤도 (마디 ${TRACK.n} + 러버 ${TRACK.n})`, id: 'caterpillar-link', sheet: '02', fastener: false, expDir: [-82, 0, 0] };
  const trackLoopR = new THREE.Group();
  trackLoopR.userData = { name: `오른 무한궤도 (마디 ${TRACK.n} + 러버 ${TRACK.n})`, id: 'caterpillar-link', sheet: '02', fastener: false, expDir: [82, 0, 0] };

  const spinner = new THREE.Group(); spinner.position.set(0, 0, TRACK.spinZ);
  const wedge = new THREE.Group(); wedge.position.set(0, TRACK.wedgePY, TRACK.wedgePZ);
  const crank = new THREE.Group(); crank.position.set(0, TRACK.wedgeSY, TRACK.wedgeSZ);
  const links = [];
  const hingePivots = [];
  const driveHubs = [];
  let linkHolder = null;
  let linkItem = null;
  let servoHub = null;
  let trackLAdded = false, trackRAdded = false;

  for (const a of ASSEMBLY) {
    const { holder: h, handles } = placePart(a, mods);
    const g = groups[a.s] ??= new THREE.Group();
    let parent = g;

    if (a.id === 'hinge-3x3' && handles?.pivot) hingePivots.push(handles.pivot);
    if (a.id === 'dc-motor-130-rs' && handles?.hubs?.[0]?.hub?.userData?.spin) {
      driveHubs.push({ spin: handles.hubs[0].hub.userData.spin, side: Math.sign(a.o[0]) });
    }
    if (a.id === 'servo-digital' && handles?.hubs?.[0]?.hub?.userData?.spin) {
      servoHub = handles.hubs[0].hub.userData.spin;
    }

    if (a.tp !== undefined) {
      const side = Math.sign(a.c[0]);
      links.push({ h, d0: a.tp, side, rOff: a.id === 'caterpillar-rubber' ? 33.0 : 27.0 });
      const loop = side < 0 ? trackLoopL : trackLoopR;
      loop.add(h);
      if (side < 0 && !trackLAdded) {
        trackLAdded = true;
        g.add(trackLoopL);
        (order[a.s] ??= []).push(trackLoopL);
        items.push({ h: trackLoopL, a: { s: '02', fastener: false }, parent: g, p0: trackLoopL.position.clone(), q0: trackLoopL.quaternion.clone(), expW: new THREE.Vector3(-82, 0, 0), fastener: false, spinAxisLocal: null });
      } else if (side > 0 && !trackRAdded) {
        trackRAdded = true;
        g.add(trackLoopR);
        (order[a.s] ??= []).push(trackLoopR);
        items.push({ h: trackLoopR, a: { s: '02', fastener: false }, parent: g, p0: trackLoopR.position.clone(), q0: trackLoopR.quaternion.clone(), expW: new THREE.Vector3(82, 0, 0), fastener: false, spinAxisLocal: null });
      }
      continue;
    }

    (order[a.s] ??= []).push(h);

    if (a.group && sprPivots[a.group]) {
      parent = sprPivots[a.group].g;
      h.position.sub(parent.position);
    } else if (a.group === 'spinner') {
      parent = spinner;
      h.position.sub(spinner.position);
    } else if (a.group === 'wedge') {
      parent = wedge;
      h.position.sub(wedge.position);
    } else if (a.group === 'crank') {
      parent = crank;
      h.position.sub(crank.position);
    } else if (a.group === 'link') {
      linkHolder = h;
    }
    parent.add(h);

    const po = EXPLODE[a.s] || [0, 0, 0];
    const expW = new THREE.Vector3(po[0], po[1], po[2]);
    if (a.exp) {
      if (a.fastener) {
        const dir = new THREE.Vector3(...a.exp).normalize();
        const proj = expW.dot(dir);
        if (proj < 0) expW.addScaledVector(dir, -proj);
        expW.addScaledVector(dir, 30);
      } else {
        expW.add(new THREE.Vector3(...a.exp));
      }
    }
    const isThread = !!a.fastener && FASTENER_IDS.has(a.id);
    const it = {
      h, a, parent,
      p0: h.position.clone(),
      q0: h.quaternion.clone(),
      expW,
      fastener: !!a.fastener,
      spinAxisLocal: isThread ? new THREE.Vector3(0, 1, 0) : null,
    };
    items.push(it);
    if (h === linkHolder) linkItem = it;
  }

  for (const sp of Object.values(sprPivots)) groups['02'].add(sp.g);
  groups['03'].add(spinner);
  groups['04'].add(wedge, crank);

  for (const g of Object.values(groups)) root.add(g);
  // V3 궤도 러버 최하단이 이미 y = 0.00 mm 접지 → 추가 바닥 오프셋 불필요!
  root.position.y = 0;

  const guide = createGuideLines(items.length, 0xef4444, 0.55);
  root.add(guide.object);

  const rest4Bar = solveWedge4Bar(0);
  const linkBasisX = new THREE.Vector3();
  const linkBasisY = new THREE.Vector3(1, 0, 0);
  const linkBasisZ = new THREE.Vector3();
  const linkMat = new THREE.Matrix4();

  let explode = 0;
  let boltsPref = true;
  let guidesOn = true;
  const hidden = {};
  const qSpin = new THREE.Quaternion(), invQ = new THREE.Quaternion();
  const locOff = new THREE.Vector3(), w0 = new THREE.Vector3(), w1 = new THREE.Vector3();

  // 웨지 각도 (0° = 기본 9° 경사, 38° = 최대 리프트) → 경첩 · 웨지 · 서보 크랭크 · 소12 링크 · S후크 0.0000 mm 연동
  function setWedge(deg) {
    const st = solveWedge4Bar(deg);
    wedge.rotation.x = st.deg * DEG;
    for (const pv of hingePivots) pv.rotation.z = (st.deg - TRACK.wedgeRestDeg) * DEG;
    const dCrank = -(st.crankRad - rest4Bar.crankRad);
    crank.rotation.x = dCrank;
    if (servoHub) servoHub.rotation.y = dCrank;
    if (linkHolder) {
      linkHolder.position.set(TRACK.wedgeLinkX, st.ty + 45.0 * st.uy, st.tz + 45.0 * st.ux);
      linkBasisX.set(0, st.uy, st.ux).normalize();
      linkBasisZ.crossVectors(linkBasisX, linkBasisY).normalize();
      linkMat.makeBasis(linkBasisX, linkBasisY, linkBasisZ);
      linkHolder.quaternion.setFromRotationMatrix(linkMat);
      if (linkItem) {
        linkItem.p0.copy(linkHolder.position);
        linkItem.q0.copy(linkHolder.quaternion);
      }
    }
    if (explode > 0.0001) applyPose();
    return st.err < 0.01;
  }

  // 궤도: dl > 0 = 왼쪽 전진(-Z), dr > 0 = 오른쪽 전진(-Z). 톱니 휠 + 36마디 + 36러버 정확 동기화
  const trX = new THREE.Vector3(), trY = new THREE.Vector3(), trZ = new THREE.Vector3(), trM = new THREE.Matrix4();
  function setTracks(dl, dr) {
    for (const L of links) {
      const off = L.side > 0 ? dr : dl;
      const f = trackFrame(L.d0 + off);
      L.h.position.set(TRACK.x * L.side, f.ya + f.ny * L.rOff, f.za + f.nz * L.rOff);
      trX.set(0, f.ty, f.tz);
      trY.set(0, f.ny, f.nz);
      trZ.crossVectors(trX, trY);
      trM.makeBasis(trX, trY, trZ);
      L.h.quaternion.setFromRotationMatrix(trM);
    }
    for (const sp of Object.values(sprPivots)) {
      sp.g.rotation.x = -(sp.side > 0 ? dr : dl) / TRACK.r;
    }
    for (const dh of driveHubs) {
      dh.spin.rotation.y = -(dh.side > 0 ? dr : dl) / TRACK.r * dh.side;
    }
  }

  function applyPose() {
    const t = explode;
    const showBoltNow = boltsPref || t > 0.001;
    root.updateMatrixWorld(true);
    const segs = [];
    for (const it of items) {
      const vis = !hidden[it.a.s] && (!it.fastener || showBoltNow);
      it.h.visible = vis;
      if (t <= 0.0001) {
        it.h.position.copy(it.p0);
        it.h.quaternion.copy(it.q0);
      } else {
        it.parent.getWorldQuaternion(invQ).invert();
        locOff.copy(it.expW).multiplyScalar(t).applyQuaternion(invQ);
        it.h.position.copy(it.p0).add(locOff);
        if (it.fastener && it.spinAxisLocal) {
          const turns = (it.expW.length() * t) / (BOLT_PITCH * 20);
          qSpin.setFromAxisAngle(it.spinAxisLocal, turns * TWO_PI);
          it.h.quaternion.copy(it.q0).multiply(qSpin);
        } else {
          it.h.quaternion.copy(it.q0);
        }
        if (guidesOn && vis && it.expW.lengthSq() > 4) {
          w0.copy(it.p0).applyMatrix4(it.parent.matrixWorld);
          w1.copy(it.h.position).applyMatrix4(it.parent.matrixWorld);
          if (w0.distanceToSquared(w1) > 1) segs.push([w0.x, w0.y, w0.z, w1.x, w1.y, w1.z]);
        }
      }
    }
    guide.update(segs);
  }

  function setExplode(t) { explode = Math.max(0, Math.min(1, t)); applyPose(); }
  function showBolts(on) { boltsPref = !!on; applyPose(); }
  function setGuides(on) { guidesOn = !!on; applyPose(); }
  function setHidden(sheet, hide) { hidden[sheet] = !!hide; applyPose(); }
  function reset() {
    setTracks(0, 0);
    setWedge(0);
    spinner.rotation.y = 0;
    explode = 0;
    applyPose();
  }

  setWedge(0);
  setTracks(0, 0);
  applyPose();
  return {
    root, groups, order, spinner,
    setWedge, setTracks, setExplode, showBolts, setGuides, setHidden, reset,
    count: ASSEMBLY.length,
  };
}
