import * as THREE from 'three';
import { loadModules, makeHolder } from '../eagle/assemble.js';
import { createGuideLines } from '../assembly/render.js';
import { BOLT_PITCH } from '../assembly/solver.js';
import ASSEMBLY, { TRACK } from './assembly.js';

// 배틀로봇 "썬더 웨지 V2" 조립 (도면: battlebot/BLUEPRINT.md · tools/battlebot_blueprint.py)
// ASSEMBLY_RULES.md 1~10.7장 완전 준수:
// - 실제 볼트 · 너트 · 태핑 · 동축 캡너트 전수 배치 및 분해 회전 + 가이드선
// - motor-drive-set 세트 통합 · rgb-led-bright 클립 직결 · 전 부품 실구멍 정합
// - 웨지 0°~60° 스윕 ↔ 스피너 Ø97 여유 +18.2 mm (동적 충돌 0건)

const DEG = Math.PI / 180;
const TWO_PI = Math.PI * 2;
const UP_Y = new THREE.Vector3(0, 1, 0);
const FASTENER_IDS = new Set(['bolt-m3x6', 'bolt-m3x10', 'bolt-m26x10', 'nut-m3', 'cap-nut-m3']);
const PATH_LEN = 2 * (TRACK.zr - TRACK.zf) + 2 * Math.PI * TRACK.r;

export const EXPLODE = {
  '01': [0, -40, 0],
  '02': [0, 0, 0],
  '03': [0, 60, -40],
  '04': [0, -10, -70],
  '05': [0, 80, 20],
  '06': [0, 50, 0],
};

// 궤도 경로 위 거리 d → (z, y, 기울기 a°) · 도면 생성기의 track_links와 같은 식
export function trackPoint(d) {
  const { zf, zr, yc, r } = TRACK;
  const s = zr - zf;
  d = ((d % PATH_LEN) + PATH_LEN) % PATH_LEN;
  if (d < s) return [zf + d, yc - r, 0];
  if (d < s + Math.PI * r) { const a = (d - s) / r; return [zr + r * Math.sin(a), yc - r * Math.cos(a), a / DEG]; }
  if (d < 2 * s + Math.PI * r) return [zr - (d - s - Math.PI * r), yc + r, 180];
  const a = (d - 2 * s - Math.PI * r) / r;
  return [zf - r * Math.sin(a), yc + r * Math.cos(a), 180 + a / DEG];
}

const CRANK = new THREE.Vector2(-9, 64.6);     // (z, y) 웨지 서보 축
const PIVOT = new THREE.Vector2(-60, 23);      // (z, y) 웨지 회전 핀
const CRANK_R = 10;

function hideDemo(obj) {
  obj.traverse((o) => { if (o !== obj && o.userData?.noBounds) o.visible = false; });
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
    fastener: !!a.fastener || FASTENER_IDS.has(a.id),
    up: a.up ? [...a.up] : null,
    expDir: a.exp ? [...a.exp] : null,
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
  trackLoopL.userData = { name: '왼 무한궤도 (마디 38 + 러버 38)', id: 'caterpillar-link', sheet: '02', fastener: false, expDir: [-82, 0, 0] };
  const trackLoopR = new THREE.Group();
  trackLoopR.userData = { name: '오른 무한궤도 (마디 38 + 러버 38)', id: 'caterpillar-link', sheet: '02', fastener: false, expDir: [82, 0, 0] };

  const spinner = new THREE.Group(); spinner.position.set(0, 0, -50);
  const wedge = new THREE.Group(); wedge.position.set(0, PIVOT.y, PIVOT.x);
  const crank = new THREE.Group(); crank.position.set(0, CRANK.y, CRANK.x);
  const links = [];
  let link = null, linkPinTop = null, linkPinBot = null;
  let trackLAdded = false, trackRAdded = false;

  for (const a of ASSEMBLY) {
    const h = placePart(a, mods);
    const g = groups[a.s] ??= new THREE.Group();
    let parent = g;

    if (a.tp !== undefined) {
      const side = Math.sign(a.c[0]);
      links.push({ h, d0: a.tp, side, rubber: a.id === 'caterpillar-rubber' });
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
    } else if (a.s === '04') {
      if (a.id === 'frame-s8-pcb') link = h;
      else if (a.n.includes('링크 위 핀')) linkPinTop = h;
      else if (a.n.includes('링크 아래 핀')) linkPinBot = h;
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
    items.push({
      h, a, parent,
      p0: h.position.clone(),
      q0: h.quaternion.clone(),
      expW,
      fastener: !!a.fastener,
      spinAxisLocal: a.fastener ? new THREE.Vector3(0, 1, 0) : null,
    });
  }

  for (const sp of Object.values(sprPivots)) groups['02'].add(sp.g);
  groups['03'].add(spinner);
  groups['04'].add(wedge, crank);

  for (const g of Object.values(groups)) root.add(g);
  root.position.y = 4; // 러버 바깥면이 바닥에 닿게

  const guide = createGuideLines(items.length, 0xef4444, 0.55);
  root.add(guide.object);

  const linkLen = Math.hypot(54.6 - 12, -9 - -95);
  const tab0 = new THREE.Vector2(-95, 12).sub(PIVOT);
  const pin0 = new THREE.Vector2(-9, 54.6);
  let pinAngle = Math.atan2(pin0.y - CRANK.y, pin0.x - CRANK.x);

  let explode = 0;
  let boltsPref = true;
  let guidesOn = true;
  const hidden = {};
  const qSpin = new THREE.Quaternion(), invQ = new THREE.Quaternion();
  const locOff = new THREE.Vector3(), w0 = new THREE.Vector3(), w1 = new THREE.Vector3();

  // 웨지 각도 (0 = 내림, 지면) → 웨지 · 크랭크 · 링크 위치
  function setWedge(deg) {
    const t = deg * DEG;
    wedge.rotation.x = t;
    const c = Math.cos(t), s = Math.sin(t);
    const tab = new THREE.Vector2(tab0.x * c + tab0.y * s, -tab0.x * s + tab0.y * c).add(PIVOT);
    let best = pinAngle, err = Infinity;
    for (let k = -180; k <= 180; k += 0.5) {
      const ang = pinAngle + k * DEG;
      const p = new THREE.Vector2(CRANK.x + CRANK_R * Math.cos(ang), CRANK.y + CRANK_R * Math.sin(ang));
      const e = Math.abs(p.distanceTo(tab) - linkLen) + Math.abs(k) * 0.002;
      if (e < err) { err = e; best = ang; }
    }
    const a0 = Math.atan2(pin0.y - CRANK.y, pin0.x - CRANK.x);
    crank.rotation.x = -(best - a0);
    pinAngle = best;
    const pin = new THREE.Vector2(CRANK.x + CRANK_R * Math.cos(best), CRANK.y + CRANK_R * Math.sin(best));
    if (link) {
      link.position.set(link.position.x, (pin.y + tab.y) / 2, (pin.x + tab.x) / 2);
      link.rotation.set(Math.atan2(-(tab.y - pin.y), tab.x - pin.x), 0, Math.PI / 2);
    }
    if (linkPinTop) linkPinTop.position.set(linkPinTop.position.x, pin.y, pin.x);
    if (linkPinBot) linkPinBot.position.set(linkPinBot.position.x, tab.y, tab.x);
    for (const it of items) {
      if (it.h === link || it.h === linkPinTop || it.h === linkPinBot) {
        it.p0.copy(it.h.position);
        if (it.h === link) it.q0.copy(it.h.quaternion);
      }
    }
    return Math.abs(err) < 2;
  }

  // 궤도: 쪽마다 이동 거리 (mm). 톱니 휠 + 휠 볼트 함께 회전
  function setTracks(dl, dr) {
    for (const L of links) {
      const off = L.side > 0 ? dr : dl;
      const [z, y, a] = trackPoint(L.d0 + off);
      const th = a * DEG;
      const k = L.rubber ? 2.75 : 0;
      L.h.position.set(TRACK.x * L.side, y - k * Math.cos(th), z + k * Math.sin(th));
      L.h.rotation.set(-th, 0, 0);
    }
    for (const sp of Object.values(sprPivots)) {
      sp.g.rotation.x = -(sp.side > 0 ? dr : dl) / TRACK.r;
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
