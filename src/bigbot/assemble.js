import * as THREE from 'three';
import { loadModules, makeHolder } from '../eagle/assemble.js';
import ASSEMBLY from './assembly.js';

// 큰 배틀로봇 "썬더 타이탄 6륜" 조립 (도면: bigbot/BLUEPRINT.md · tools/bigbot_blueprint.py)
// 움직이는 곳: 버기 바퀴 6 (X축), 앞 스피너 (Y축, z −135), 뒤 드럼 (X축, (y 59, z 145)), 웨지 (회전 핀 (y 30, z −158)), 웨지 서보 크랭크 + 링크

const DEG = Math.PI / 180;
const SPIN_Z = -135;
const DRUM = new THREE.Vector2(145, 59);       // (z, y)
const PIVOT = new THREE.Vector2(-158, 30);     // (z, y) 웨지 회전 핀
const CRANK = new THREE.Vector2(-85, 40);      // (z, y) 웨지 서보 축
const CRANK_R = 10;
const TAB0 = new THREE.Vector2(-195, 12);      // (z, y) 웨지 위 탭 (내린 상태)
const PIN0 = new THREE.Vector2(-85, 30);       // (z, y) 크랭크 핀 (내린 상태)
export const WEDGE_REST = Math.asin(30 / 78) / DEG;   // 내린 웨지 기울기 (앞 끝 지면)
export const WEDGE_MAX = WEDGE_REST + 45;              // 수평에서 45°까지 (스피너 날과 안 부딪힘)
export const WHEEL_R = 40;

export async function buildBigbot(loadPart, onProgress) {
  const mods = await loadModules(ASSEMBLY, loadPart, onProgress);
  const root = new THREE.Group();
  const groups = {};
  const spinner = new THREE.Group(); spinner.position.set(0, 0, SPIN_Z);
  const drum = new THREE.Group(); drum.position.set(0, DRUM.y, DRUM.x);
  const wedge = new THREE.Group(); wedge.position.set(0, PIVOT.y, PIVOT.x);
  const crank = new THREE.Group(); crank.position.set(0, CRANK.y, CRANK.x);
  const wheels = [];
  let link = null, pinTop = null, pinBot = null;

  for (const a of ASSEMBLY) {
    const h = makeHolder(a, mods);
    let parent = groups[a.s] ??= new THREE.Group();
    const mover = a.id !== 'dc-motor-400-rs' && a.id !== 'motor-frame-3x3';
    if (a.id === 'wheel-80-buggy-set') wheels.push({ h, side: Math.sign(a.c[0]), q0: h.quaternion.clone() });
    else if (a.s === '03' && mover) { parent = spinner; h.position.sub(spinner.position); }
    else if (a.s === '05' && mover) { parent = drum; h.position.sub(drum.position); }
    else if (a.s === '04') {
      if (a.id === 'frame-main-pcb' || a.id === 'battle-g' || a.n.includes('링크 탭')) { parent = wedge; h.position.sub(wedge.position); }
      else if (a.id === 'wheel-guide-30-servo') { parent = crank; h.position.sub(crank.position); }
      else if (a.id === 'frame-m16-pcb') link = h;
      else if (a.n.includes('링크 위 핀')) pinTop = h;
      else if (a.n.includes('링크 아래 핀')) pinBot = h;
    }
    parent.add(h);
  }
  groups['03'].add(spinner);
  groups['04'].add(wedge, crank);
  groups['05'].add(drum);
  for (const g of Object.values(groups)) root.add(g);

  const linkLen = PIN0.distanceTo(TAB0);
  const tab0 = TAB0.clone().sub(PIVOT);
  let pinAngle = Math.atan2(PIN0.y - CRANK.y, PIN0.x - CRANK.x);
  const a0 = pinAngle;
  // 웨지 들기 (0 = 내림 · 앞 끝 지면, 최대 WEDGE_MAX)
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
    crank.rotation.x = -(best - a0);
    pinAngle = best;
    const pin = new THREE.Vector2(CRANK.x + CRANK_R * Math.cos(best), CRANK.y + CRANK_R * Math.sin(best));
    if (link) {
      link.position.set(link.position.x, (pin.y + tab.y) / 2, (pin.x + tab.x) / 2);
      link.rotation.set(Math.atan2(-(tab.y - pin.y), tab.x - pin.x), 0, Math.PI / 2);
    }
    if (pinTop) pinTop.position.set(pinTop.position.x, pin.y, pin.x);
    if (pinBot) pinBot.position.set(pinBot.position.x, tab.y, tab.x);
  }
  // 바퀴: 쪽마다 굴러간 거리 (mm)
  const qx = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);
  function setWheels(dl, dr) {
    for (const W of wheels) W.h.quaternion.copy(qx.setFromAxisAngle(X, -(W.side > 0 ? dr : dl) / WHEEL_R)).multiply(W.q0);
  }
  setWedge(0); setWheels(0, 0);
  return { root, groups, spinner, drum, setWedge, setWheels, count: ASSEMBLY.length };
}

export const EXPLODE = { '01': [0, -60, 0], '02': [0, -25, 0], '03': [0, 50, -110], '04': [0, -10, -150], '05': [0, 40, 130], '06': [0, 110, 0], '07': [0, 175, 0] };
