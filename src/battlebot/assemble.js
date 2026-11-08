import * as THREE from 'three';
import { loadModules, makeHolder } from '../eagle/assemble.js';
import ASSEMBLY, { TRACK } from './assembly.js';

// 배틀로봇 "썬더 웨지" 조립 (도면: battlebot/BLUEPRINT.md · tools/battlebot_blueprint.py)
// 움직이는 곳: 궤도 마디 (경로를 따라 이동), 톱니 휠, 스피너 (Y축), 웨지 (회전 핀 (0, 23, −60)의 X축), 웨지 서보 크랭크 + 링크

const DEG = Math.PI / 180;
const PATH_LEN = 2 * (TRACK.zr - TRACK.zf) + 2 * Math.PI * TRACK.r;

// 궤도 경로 위 거리 d → (z, y, 기울기 a°)  · 도면 생성기의 track_links와 같은 식
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

export async function buildBattlebot(loadPart, onProgress) {
  const mods = await loadModules(ASSEMBLY, loadPart, onProgress);
  const root = new THREE.Group();
  const groups = {};
  const spinner = new THREE.Group(); spinner.position.set(0, 0, -50);
  const wedge = new THREE.Group(); wedge.position.set(0, PIVOT.y, PIVOT.x);
  const crank = new THREE.Group(); crank.position.set(0, CRANK.y, CRANK.x);
  const links = [], sprockets = [];
  let link = null, linkTab = null, linkPinTop = null, linkPinBot = null;

  for (const a of ASSEMBLY) {
    const h = makeHolder(a, mods);
    let parent = groups[a.s] ??= new THREE.Group();
    if (a.tp !== undefined) {
      links.push({ h, d0: a.tp, side: Math.sign(a.c[0]), rubber: a.id === 'caterpillar-rubber' });
    } else if (a.id === 'caterpillar-sprocket' || a.id === 'caterpillar-wheel-guide') {
      sprockets.push({ h, side: Math.sign(a.c[0]), q0: h.quaternion.clone() });
    } else if (a.s === '03' && a.id !== 'dc-motor-400-rs' && a.id !== 'motor-frame-3x3') {
      parent = spinner; h.position.sub(spinner.position);
    } else if (a.s === '04') {
      if (a.id === 'frame-main-pcb' || a.id === 'battle-g' || a.n.includes('링크 탭')) {
        parent = wedge; h.position.sub(wedge.position);
        if (a.n.includes('링크 탭')) linkTab = h;
      } else if (a.id === 'wheel-guide-30-servo') {
        parent = crank; h.position.sub(crank.position);
      } else if (a.id === 'frame-s8-pcb') link = h;
      else if (a.n.includes('링크 위 핀')) linkPinTop = h;
      else if (a.n.includes('링크 아래 핀')) linkPinBot = h;
    }
    parent.add(h);
  }
  groups['03'].add(spinner);
  groups['04'].add(wedge, crank);
  for (const g of Object.values(groups)) root.add(g);
  root.position.y = 4;   // 러버 바깥면이 바닥에 닿게

  const linkLen = Math.hypot(54.6 - 12, -9 - -95);
  const tab0 = new THREE.Vector2(-95, 12).sub(PIVOT);            // 웨지 위 탭 (회전 핀 기준)
  const pin0 = new THREE.Vector2(-9, 54.6);
  let pinAngle = Math.atan2(pin0.y - CRANK.y, pin0.x - CRANK.x);  // 크랭크 핀 각도 (z, y 평면)

  // 웨지 각도 (0 = 내림, 지면) → 웨지 · 크랭크 · 링크 위치
  function setWedge(deg) {
    const t = deg * DEG;
    wedge.rotation.x = t;                                          // 앞 끝(−Z)이 올라간다
    const c = Math.cos(t), s = Math.sin(t);
    const tab = new THREE.Vector2(tab0.x * c + tab0.y * s, -tab0.x * s + tab0.y * c).add(PIVOT);
    // 크랭크 원 (중심 CRANK, 반지름 10) 위에서 탭과의 거리가 링크 길이인 점 (이전 각도에 가까운 쪽)
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
    return Math.abs(err) < 2;
  }

  // 궤도: 쪽마다 이동 거리 (mm). 톱니 휠은 같은 거리만큼 돈다
  function setTracks(dl, dr) {
    for (const L of links) {
      const off = L.side > 0 ? dr : dl;
      const [z, y, a] = trackPoint(L.d0 + off);
      const th = a * DEG;
      const k = L.rubber ? 2.75 : 0;
      L.h.position.set(TRACK.x * L.side, y - k * Math.cos(th), z + k * Math.sin(th));
      L.h.rotation.set(-th, 0, 0);
    }
    const qx = new THREE.Quaternion();
    for (const S of sprockets) S.h.quaternion.copy(qx.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -(S.side > 0 ? dr : dl) / TRACK.r)).multiply(S.q0);
  }
  setWedge(0); setTracks(0, 0);
  return { root, groups, spinner, setWedge, setTracks, count: ASSEMBLY.length };
}

export const EXPLODE = { '01': [0, -40, 0], '02': [0, 0, 0], '03': [0, 60, -40], '04': [0, -10, -70], '05': [0, 80, 20], '06': [0, 50, 0] };
