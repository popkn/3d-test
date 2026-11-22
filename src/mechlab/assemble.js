import * as THREE from 'three';
import { MECHS, MECH_BY_CODE } from './catalog.js';

// 서보 메커니즘 30종(M01~M15 · S01~S15) + 모터 메커니즘 15종(W01~W15) = 총 45종 실시간 3D 기구학 엔진
const DEG = Math.PI / 180;
const TIER_STEP = 11.6; // PCB 1.6 mm + support-spacer L=10 mm
const UP_Y = new THREE.Vector3(0, 1, 0);

export const SERVO_PART_IDS = [
  'frame-big-main', 'frame-main-pcb', 'frame-m6-pcb',
  'frame-s3-pcb', 'frame-s4-pcb', 'frame-s5-pcb', 'frame-s7-pcb', 'frame-s8-pcb', 'frame-s12-pcb',
  'motor-frame-3x3', 'l-frame-2x2', 'hinge-3x3',
  'support-spacer', 'servo-digital',
  'motor-guide', 'wheel-guide-30-servo',
  's-hook-35', 'battle-g', 'grab', 'caterpillar-sprocket',
  'bolt-m3x6', 'bolt-m3x10', 'bolt-m26x10', 'nut-m3',
];

export const MOTOR_PART_IDS = [
  'frame-big-main', 'frame-main-pcb', 'frame-m6-pcb',
  'frame-s3-pcb', 'frame-s4-pcb', 'frame-s5-pcb', 'frame-s7-pcb', 'frame-s8-pcb', 'frame-s12-pcb',
  'l-frame-2x2', 'support-spacer', 'dc-motor-130-rs',
  'wheel-guide-30-nylon', 'wheel-guide-40-yellow',
  's-hook-35', 'battle-g', 'caterpillar-sprocket',
  'bolt-m3x6', 'bolt-m3x10', 'bolt-m26x10', 'nut-m3',
];

export const MECHLAB_PART_IDS = [...new Set([...SERVO_PART_IDS, ...MOTOR_PART_IDS])];

function ci(x1, y1, r1, x2, y2, r2, sgn = 1) {
  const dx = x2 - x1, dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  if (d < 1e-9 || d > r1 + r2 + 1e-5 || d < Math.abs(r1 - r2) - 1e-5) return [x1, y1];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  return [x1 + (a * dx) / d - (sgn * h * dy) / d, y1 + (a * dy) / d + (sgn * h * dx) / d];
}

function hideDemo(obj) {
  obj.traverse((o) => { if (o !== obj && o.userData?.noBounds) o.visible = false; });
}

const _X = new THREE.Vector3(), _Y = new THREE.Vector3(), _Z = new THREE.Vector3(), _M = new THREE.Matrix4();
function setBasis(obj, xdir, up) {
  _X.set(xdir[0], xdir[1], xdir[2]).normalize();
  _Y.set(up[0], up[1], up[2]).normalize();
  _Z.crossVectors(_X, _Y).normalize();
  _M.makeBasis(_X, _Y, _Z);
  obj.quaternion.setFromRotationMatrix(_M);
}

function makePart(mods, pid, o, xdir, up, length) {
  const m = mods[pid].build();
  hideDemo(m.object3d);
  if (pid === 'support-spacer' && length && m.handles?.setLength) m.handles.setLength(length);
  const g = new THREE.Group();
  g.userData = { id: pid };
  g.add(m.object3d);
  if (xdir && up) {
    setBasis(g, xdir, up);
  } else if (up) {
    const Y = new THREE.Vector3(up[0], up[1], up[2]).normalize();
    if (Y.y < -0.9999) g.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
    else g.quaternion.setFromUnitVectors(UP_Y, Y);
  }
  if (o) g.position.set(o[0], o[1], o[2]);
  return { g, handles: m.handles || null };
}

function barSpecFor(L) {
  if (L <= 20.1) return { id: 'frame-s3-pcb', h0: -10, h1: 10 };
  if (L <= 30.1) return { id: 'frame-s4-pcb', h0: -15, h1: 15 };
  if (L <= 40.1) return { id: 'frame-s5-pcb', h0: -20, h1: 20 };
  if (L <= 50.1) return { id: 'frame-s7-pcb', h0: -30, h1: 20 };
  if (L <= 60.1) return { id: 'frame-s7-pcb', h0: -30, h1: 30 };
  if (L <= 70.1) return { id: 'frame-s8-pcb', h0: -35, h1: 35 };
  if (L <= 80.1) return { id: 'frame-s12-pcb', h0: -45, h1: 35 };
  if (L <= 90.1) return { id: 'frame-s12-pcb', h0: -45, h1: 45 };
  return { id: 'frame-s12-pcb', h0: -55, h1: 55 };
}

function placeLink2D(holder, pA, pB, rig, layer, h0, tier = 0) {
  const du = pB[0] - pA[0], dv = pB[1] - pA[1];
  const len = Math.hypot(du, dv) || 1;
  const uu = du / len, uv = dv / len;
  const midU = pA[0] - h0 * uu;
  const midV = pA[1] - h0 * uv;
  if (rig === 'H') {
    holder.position.set(midU, 53.2 + tier * TIER_STEP + 1.6 * (layer - 1), midV);
    setBasis(holder, [uu, 0, uv], [0, 1, 0]);
  } else {
    holder.position.set(midU, midV, -46.6 - tier * TIER_STEP - 1.6 * (layer - 1));
    setBasis(holder, [uu, uv, 0], [0, 0, -1]);
  }
}

function placeHook2D(holder, pt, rig, topLayer, tier = 0) {
  if (rig === 'H') {
    holder.position.set(pt[0], 53.2 + tier * TIER_STEP + 1.6 * topLayer, pt[1]);
    holder.quaternion.identity();
  } else {
    holder.position.set(pt[0], pt[1], -46.6 - tier * TIER_STEP - 1.6 * topLayer);
    setBasis(holder, [1, 0, 0], [0, 0, -1]);
  }
}

// crankPivot 로컬 (x=crankRad방향, h=축 바깥방향, z=crankRad+90°방향) → Three.js 좌표
function cpPt(rig, x, h, z = 0) {
  return rig === 'H' ? [x, h, z] : [x, z, -h];
}
function cpUp(rig, outward = true) {
  if (rig === 'H') return outward ? [0, 1, 0] : [0, -1, 0];
  return outward ? [0, 0, -1] : [0, 0, 1];
}

export function solveMech(spec, deg) {
  const k = spec.kin;
  const t = k.type;
  const th = (deg + (k.crankOff || 0)) * DEG;
  let err = 0;

  if (t === 'rocker4' || t === 'hammer360') {
    const { S, P, R, Rout, L, armLen } = k;
    const C = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const Q = ci(C[0], C[1], L, P[0], P[1], Rout, k.sgn ?? 1);
    const ang = Math.atan2(Q[1] - P[1], Q[0] - P[0]);
    const tip = [P[0] + armLen * Math.cos(ang), P[1] + armLen * Math.sin(ang)];
    err = Math.max(Math.abs(Math.hypot(Q[0] - C[0], Q[1] - C[1]) - L), Math.abs(Math.hypot(Q[0] - P[0], Q[1] - P[1]) - Rout));
    return {
      crankRad: th, pts: { S, C, Q, P, tip },
      links: [{ a: 'C', b: 'Q', L, lay: 1 }, { a: 'P', b: 'tip', L: armLen, lay: 2 }],
      pins: [{ p: 'C', lay: 1 }, { p: 'Q', lay: 2 }, { p: 'P', lay: 2 }],
      trace: tip, statLabel: t === 'hammer360' ? '해머각' : '레버각', statVal: `${(ang / DEG).toFixed(1)}°`, err,
    };
  }

  if (t === 'wedge4') {
    const lift = (deg / 180) * k.maxLift;
    const ang = (lift - k.restDeg) * DEG;
    const tz = k.PZ - k.tabU * Math.cos(ang) + k.tabV * Math.sin(ang);
    const ty = k.PY + k.tabU * Math.sin(ang) + k.tabV * Math.cos(ang);
    const dz = tz - k.SZ, dy = ty - k.SY;
    const d = Math.hypot(dz, dy);
    const ca = Math.max(-1, Math.min(1, (k.R * k.R + d * d - k.L * k.L) / (2 * k.R * d)));
    const crankRad = Math.atan2(dy, dz) - Math.acos(ca);
    const cz = k.SZ + k.R * Math.cos(crankRad), cy = k.SY + k.R * Math.sin(crankRad);
    err = Math.abs(Math.hypot(cz - tz, cy - ty) - k.L);
    return {
      lift, ang, tz, ty, cz, cy, crankRad,
      ux: (cz - tz) / k.L, uy: (cy - ty) / k.L,
      statLabel: '웨지', statVal: `${lift.toFixed(1)}°`, err,
    };
  }

  if (t === 'parallel4') {
    const { S, P, R, L } = k;
    const C = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const Q = [P[0] + R * Math.cos(th), P[1] + R * Math.sin(th)];
    const M = [(C[0] + Q[0]) / 2, (C[1] + Q[1]) / 2];
    const isMg = spec.guidePart === 'motor-guide';
    if (R >= 25) {
      return {
        crankRad: th, pts: { S, C, Q, P, M },
        links: [{ a: 'S', b: 'C', L: R, lay: 1 }, { a: 'C', b: 'Q', L, lay: 2 }, { a: 'P', b: 'Q', L: R, lay: 3 }],
        pins: [{ p: 'C', lay: 2 }, { p: 'Q', lay: 3 }, { p: 'P', lay: 4 }],
        trace: M, statLabel: '수평오차', statVal: '0.0°', err: Math.abs(Math.hypot(Q[0] - C[0], Q[1] - C[1]) - L),
      };
    }
    return {
      crankRad: th, pts: { S, C, Q, P, M },
      links: isMg
        ? [
            { a: 'S', b: 'C', L: 20, lay: 1, h0: 0, h1: 10 },
            { a: 'P', b: 'Q', L: 20, lay: 1, h0: 0, h1: 10 },
            { a: 'C', b: 'Q', L, lay: 2 },
          ]
        : [
            { a: 'C', b: 'Q', L, lay: 1 },
            { a: 'P', b: 'Q', L: 20, lay: 2, h0: 0, h1: 10 },
          ],
      pins: isMg
        ? [{ p: 'C', lay: 2 }, { p: 'Q', lay: 2 }, { p: 'P', lay: 1 }]
        : [{ p: 'C', lay: 1 }, { p: 'Q', lay: 2 }, { p: 'P', lay: 3 }],
      trace: M, statLabel: '수평오차', statVal: '0.0°', err: Math.abs(Math.hypot(Q[0] - C[0], Q[1] - C[1]) - L),
    };
  }

  if (t === 'parallel360') {
    const { S, P1, P2, R, Rout, Rtray, L, Ltray } = k;
    const C = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const Q1 = ci(C[0], C[1], L, P1[0], P1[1], Rout, 1);
    const ang = Math.atan2(Q1[1] - P1[1], Q1[0] - P1[0]);
    const T1 = [P1[0] + Rtray * Math.cos(ang), P1[1] + Rtray * Math.sin(ang)];
    const T2 = [P2[0] + Rtray * Math.cos(ang), P2[1] + Rtray * Math.sin(ang)];
    const M = [(T1[0] + T2[0]) / 2, (T1[1] + T2[1]) / 2];
    err = Math.max(
      Math.abs(Math.hypot(Q1[0] - C[0], Q1[1] - C[1]) - L),
      Math.abs(Math.hypot(Q1[0] - P1[0], Q1[1] - P1[1]) - Rout),
      Math.abs(Math.hypot(T2[0] - T1[0], T2[1] - T1[1]) - Ltray),
    );
    return {
      crankRad: th, pts: { S, C, Q1, P1, P2, T1, T2, M },
      links: [
        { a: 'C', b: 'Q1', L, lay: 1 },
        { a: 'P1', b: 'T1', L: Rtray, lay: 2 },
        { a: 'P2', b: 'T2', L: Rtray, lay: 2 },
        { a: 'T1', b: 'T2', L: Ltray, lay: 1 },
      ],
      pins: [
        { p: 'C', lay: 1 }, { p: 'Q1', lay: 2 }, { p: 'P1', lay: 2 },
        { p: 'T1', lay: 2 }, { p: 'T2', lay: 2 }, { p: 'P2', lay: 2 },
      ],
      trace: M, statLabel: '수평오차', statVal: '0.0°', err,
    };
  }

  if (t === 'dualGripperTier' || t === 'parallelGripperTier') {
    const { S, PL, PR, R, Rout, L, jawLen } = k;
    const rad = deg * DEG;
    const C1 = [S[0] - R * Math.cos(rad), S[1] - R * Math.sin(rad)];
    const C2 = [S[0] + R * Math.cos(rad), S[1] + R * Math.sin(rad)];
    const QL = ci(C1[0], C1[1], L, PL[0], PL[1], Rout, -1);
    const QR = ci(C2[0], C2[1], L, PR[0], PR[1], Rout, +1);
    const aL = Math.atan2(QL[1] - PL[1], QL[0] - PL[0]) + Math.PI;
    const aR = Math.atan2(QR[1] - PR[1], QR[0] - PR[0]) + Math.PI;
    const JL = [PL[0] + jawLen * Math.cos(aL), PL[1] + jawLen * Math.sin(aL)];
    const JR = [PR[0] + jawLen * Math.cos(aR), PR[1] + jawLen * Math.sin(aR)];
    const isWheel = spec.spacerTier === 'wheel-opp';
    const t0 = isWheel ? 1 : 0, t1 = isWheel ? 2 : 1;
    const cLay = isWheel ? 1 : 2;
    const jLay = isWheel ? 2 : 1;
    const topPin = isWheel ? 2 : 2;
    const pts = { S, C1, C2, QL, QR, PL, PR, JL, JR };
    const links = [
      { a: 'C1', b: 'QL', L, lay: cLay, tier: t0 },
      { a: 'QL', b: 'JL', L: Rout + jawLen, lay: jLay, tier: t0 },
      { a: 'C2', b: 'QR', L, lay: cLay, tier: t1 },
      { a: 'QR', b: 'JR', L: Rout + jawLen, lay: jLay, tier: t1 },
    ];
    const pins = [
      { p: 'C1', lay: cLay, tier: t0 }, { p: 'QL', lay: topPin, tier: t0 }, { p: 'PL', lay: jLay, tier: t0 },
      { p: 'C2', lay: cLay, tier: t1 }, { p: 'QR', lay: topPin, tier: t1 }, { p: 'PR', lay: jLay, tier: t1 },
    ];
    if (t === 'parallelGripperTier') {
      const dx = k.parDx;
      pts.PL2 = [PL[0] - dx, PL[1]]; pts.PR2 = [PR[0] + dx, PR[1]];
      pts.JL2 = [JL[0] - dx, JL[1]]; pts.JR2 = [JR[0] + dx, JR[1]];
      const barLay = isWheel ? 3 : 2;
      links.push(
        { a: 'PL2', b: 'JL2', L: jawLen, lay: jLay, tier: t0 },
        { a: 'JL', b: 'JL2', L: dx, lay: barLay, tier: t0 },
        { a: 'PR2', b: 'JR2', L: jawLen, lay: jLay, tier: t1 },
        { a: 'JR', b: 'JR2', L: dx, lay: barLay, tier: t1 },
      );
      pins.push(
        { p: 'PL2', lay: jLay, tier: t0 }, { p: 'JL', lay: barLay, tier: t0 }, { p: 'JL2', lay: barLay, tier: t0 },
        { p: 'PR2', lay: jLay, tier: t1 }, { p: 'JR', lay: barLay, tier: t1 }, { p: 'JR2', lay: barLay, tier: t1 },
      );
    }
    return {
      crankRad: rad, pts, links, pins, trace: JR,
      statLabel: '집게간격', statVal: `${Math.hypot(JR[0] - JL[0], JR[1] - JL[1]).toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(QL[0] - C1[0], QL[1] - C1[1]) - L), Math.abs(Math.hypot(QR[0] - C2[0], QR[1] - C2[1]) - L)),
    };
  }

  if (t === 'flappingWingTier') {
    const { S, PL, PR, R, Rout, L, wingLen } = k;
    const rad = (deg - 180) * DEG;
    const C1 = [S[0] - R * Math.cos(rad), S[1] - R * Math.sin(rad)];
    const C2 = [S[0] + R * Math.cos(rad), S[1] + R * Math.sin(rad)];
    const QL = ci(C1[0], C1[1], L, PL[0], PL[1], Rout, +1);
    const QR = ci(C2[0], C2[1], L, PR[0], PR[1], Rout, -1);
    const aL = Math.atan2(PL[1] - QL[1], PL[0] - QL[0]);
    const aR = Math.atan2(PR[1] - QR[1], PR[0] - QR[0]);
    const WL = [PL[0] + wingLen * Math.cos(aL), PL[1] + wingLen * Math.sin(aL)];
    const WR = [PR[0] + wingLen * Math.cos(aR), PR[1] + wingLen * Math.sin(aR)];
    const isWheel = spec.spacerTier === 'wheel-opp';
    const t0 = isWheel ? 1 : 0, t1 = isWheel ? 2 : 1;
    const cLay = isWheel ? 1 : 2;
    const wLay = isWheel ? 2 : 1;
    return {
      crankRad: rad, pts: { S, C1, C2, QL, QR, PL, PR, WL, WR },
      links: [
        { a: 'C1', b: 'QL', L, lay: cLay, tier: t0 },
        { a: 'QL', b: 'WL', L: Rout + wingLen, lay: wLay, tier: t0, h0: -55 },
        { a: 'C2', b: 'QR', L, lay: cLay, tier: t1 },
        { a: 'QR', b: 'WR', L: Rout + wingLen, lay: wLay, tier: t1, h0: -55 },
      ],
      pins: [
        { p: 'C1', lay: cLay, tier: t0 }, { p: 'QL', lay: 2, tier: t0 }, { p: 'PL', lay: wLay, tier: t0 },
        { p: 'C2', lay: cLay, tier: t1 }, { p: 'QR', lay: 2, tier: t1 }, { p: 'PR', lay: wLay, tier: t1 },
      ],
      trace: WR, statLabel: '날개각', statVal: `${(aR / DEG).toFixed(1)}°`,
      err: Math.max(Math.abs(Math.hypot(QL[0] - C1[0], QL[1] - C1[1]) - L), Math.abs(Math.hypot(QR[0] - C2[0], QR[1] - C2[1]) - L)),
    };
  }

  if (t === 'flappingWing1') {
    const { S, PL, PR, R, Rout, L, wingLen } = k;
    const L2 = k.L2 ?? L;
    const mOff = k.mOff ?? 10;
    const C1 = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const QL = ci(C1[0], C1[1], L, PL[0], PL[1], Rout, -1);
    const ux = (QL[0] - C1[0]) / L, uy = (QL[1] - C1[1]) / L;
    const M = [C1[0] + mOff * ux, C1[1] + mOff * uy];
    const QR = ci(M[0], M[1], L2, PR[0], PR[1], Rout, +1);
    const aL = Math.atan2(PL[1] - QL[1], PL[0] - QL[0]);
    const aR = Math.atan2(PR[1] - QR[1], PR[0] - QR[0]);
    const WL = [PL[0] + wingLen * Math.cos(aL), PL[1] + wingLen * Math.sin(aL)];
    const WR = [PR[0] + wingLen * Math.cos(aR), PR[1] + wingLen * Math.sin(aR)];
    return {
      crankRad: th, pts: { S, C1, M, QL, QR, PL, PR, WL, WR },
      links: [
        { a: 'C1', b: 'QL', L, lay: 1, h0: -20 },
        { a: 'M', b: 'QR', L: L2, lay: 2 },
        { a: 'QL', b: 'WL', L: Rout + wingLen, lay: 2 },
        { a: 'QR', b: 'WR', L: Rout + wingLen, lay: 1 },
      ],
      pins: [
        { p: 'C1', lay: 1 }, { p: 'M', lay: 2 }, { p: 'QL', lay: 2 },
        { p: 'QR', lay: 2 }, { p: 'PL', lay: 2 }, { p: 'PR', lay: 1 },
      ],
      trace: WR, statLabel: '날개각', statVal: `${(aR / DEG).toFixed(1)}°`,
      err: Math.max(Math.abs(Math.hypot(QL[0] - C1[0], QL[1] - C1[1]) - L), Math.abs(Math.hypot(QR[0] - M[0], QR[1] - M[1]) - L2)),
    };
  }

  if (t === 'slider' || t === 'offsetSlider') {
    const { S, R, L } = k;
    const rz = k.railZ ?? S[1];
    const C = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const sx = C[0] + Math.sqrt(Math.max(0, L * L - (C[1] - rz) ** 2));
    const X = [sx, rz];
    return {
      crankRad: th, pts: { S, C, X },
      links: [{ a: 'C', b: 'X', L, lay: 1, h0: -30 }],
      pins: [{ p: 'C', lay: 1 }, { p: 'X', lay: 2 }],
      sliders: [{ p: 'X', axis: 'x', lay: 2 }],
      trace: X, statLabel: t === 'offsetSlider' ? '급속귀환' : '변위', statVal: `${(sx - S[0]).toFixed(1)} mm`,
      err: Math.abs(Math.hypot(X[0] - C[0], X[1] - C[1]) - L),
    };
  }

  if (t === 'dualSliderTier') {
    const { S, R, L } = k;
    const C1 = [S[0] - R * Math.cos(th), S[1] - R * Math.sin(th)];
    const C2 = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const xL = C1[0] - Math.sqrt(Math.max(0, L * L - (C1[1] - S[1]) ** 2));
    const xR = C2[0] + Math.sqrt(Math.max(0, L * L - (C2[1] - S[1]) ** 2));
    const XL = [xL, S[1]], XR = [xR, S[1]];
    const isWheel = spec.spacerTier === 'wheel-opp';
    const t0 = isWheel ? 1 : 0, t1 = isWheel ? 2 : 1;
    const cLay = isWheel ? 1 : 2;
    const sLay = isWheel ? 2 : 1;
    return {
      crankRad: th, pts: { S, C1, C2, XL, XR },
      links: [
        { a: 'C1', b: 'XL', L, lay: cLay, tier: t0 },
        { a: 'C2', b: 'XR', L, lay: cLay, tier: t1 },
      ],
      pins: [
        { p: 'C1', lay: cLay, tier: t0 }, { p: 'XL', lay: 2, tier: t0 },
        { p: 'C2', lay: cLay, tier: t1 }, { p: 'XR', lay: 2, tier: t1 },
      ],
      sliders: [
        { p: 'XL', axis: 'x', lay: sLay, tier: t0 },
        { p: 'XR', axis: 'x', lay: sLay, tier: t1 },
      ],
      trace: XR, statLabel: '양측폭', statVal: `${(xR - xL).toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(XL[0] - C1[0], XL[1] - C1[1]) - L), Math.abs(Math.hypot(XR[0] - C2[0], XR[1] - C2[1]) - L)),
    };
  }

  if (t === 'dualSlider1') {
    const { S, R, L } = k;
    const L2 = k.L2 ?? 50;
    const mOff = k.mOff ?? 10;
    const C1 = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const xR = C1[0] + Math.sqrt(Math.max(0, L * L - (C1[1] - S[1]) ** 2));
    const XR = [xR, S[1]];
    const ux = (XR[0] - C1[0]) / L, uy = (XR[1] - C1[1]) / L;
    const M = [C1[0] + mOff * ux, C1[1] + mOff * uy];
    const xL = M[0] - Math.sqrt(Math.max(0, L2 * L2 - (M[1] - S[1]) ** 2));
    const XL = [xL, S[1]];
    return {
      crankRad: th, pts: { S, C1, M, XR, XL },
      links: [{ a: 'C1', b: 'XR', L, lay: 1 }, { a: 'M', b: 'XL', L: L2, lay: 2 }],
      pins: [{ p: 'C1', lay: 1 }, { p: 'M', lay: 2 }, { p: 'XR', lay: 2 }, { p: 'XL', lay: 2 }],
      sliders: [{ p: 'XR', axis: 'x', lay: 2 }, { p: 'XL', axis: 'x', lay: 1 }],
      trace: XR, statLabel: '양측폭', statVal: `${(xR - xL).toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(XR[0] - C1[0], XR[1] - C1[1]) - L), Math.abs(Math.hypot(XL[0] - M[0], XL[1] - M[1]) - L2)),
    };
  }

  if (t === 'vTwin90Tier') {
    const { S, R1, R2, L1, L2 } = k;
    const rad = (deg - 90) * DEG;
    const C1 = [S[0] + R1 * Math.cos(rad), S[1] + R1 * Math.sin(rad)];
    const C2 = [S[0] + R2 * Math.cos(rad + Math.PI / 2), S[1] + R2 * Math.sin(rad + Math.PI / 2)];
    const XX = [C1[0] + Math.sqrt(Math.max(0, L1 * L1 - (C1[1] - S[1]) ** 2)), S[1]];
    const XZ = [S[0], C2[1] + Math.sqrt(Math.max(0, L2 * L2 - (C2[0] - S[0]) ** 2))];
    return {
      crankRad: rad, pts: { S, C1, C2, XX, XZ },
      links: [
        { a: 'C1', b: 'XX', L: L1, lay: 1, tier: 0 },
        { a: 'C2', b: 'XZ', L: L2, lay: 1, tier: 1 },
      ],
      pins: [
        { p: 'C1', lay: 1, tier: 0 }, { p: 'XX', lay: 2, tier: 0 },
        { p: 'C2', lay: 1, tier: 1 }, { p: 'XZ', lay: 2, tier: 1 },
      ],
      sliders: [
        { p: 'XX', axis: 'x', lay: 2, tier: 0 },
        { p: 'XZ', axis: 'z', lay: 2, tier: 1 },
      ],
      trace: XX, statLabel: 'X/Z행정', statVal: `${(XX[0] - S[0]).toFixed(0)}/${(XZ[1] - S[1]).toFixed(0)}`,
      err: Math.max(Math.abs(Math.hypot(XX[0] - C1[0], XX[1] - C1[1]) - L1), Math.abs(Math.hypot(XZ[0] - C2[0], XZ[1] - C2[1]) - L2)),
    };
  }

  if (t === 'vTwin90') {
    const { S, R, L } = k;
    const L2 = k.L2 ?? 50;
    const mOff = k.mOff ?? 10;
    const C1 = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const XX = [C1[0] + Math.sqrt(Math.max(0, L * L - (C1[1] - S[1]) ** 2)), S[1]];
    const ux = (XX[0] - C1[0]) / L, uy = (XX[1] - C1[1]) / L;
    const M = [C1[0] + mOff * ux, C1[1] + mOff * uy];
    const XZ = [S[0], M[1] + Math.sqrt(Math.max(0, L2 * L2 - (M[0] - S[0]) ** 2))];
    return {
      crankRad: th, pts: { S, C1, M, XX, XZ },
      links: [{ a: 'C1', b: 'XX', L, lay: 1 }, { a: 'M', b: 'XZ', L: L2, lay: 2 }],
      pins: [{ p: 'C1', lay: 1 }, { p: 'M', lay: 2 }, { p: 'XX', lay: 2 }, { p: 'XZ', lay: 2 }],
      sliders: [{ p: 'XX', axis: 'x', lay: 2 }, { p: 'XZ', axis: 'z', lay: 1 }],
      trace: XX, statLabel: 'X/Z행정', statVal: `${(XX[0] - S[0]).toFixed(0)}/${(XZ[1] - S[1]).toFixed(0)}`,
      err: Math.max(Math.abs(Math.hypot(XX[0] - C1[0], XX[1] - C1[1]) - L), Math.abs(Math.hypot(XZ[0] - M[0], XZ[1] - M[1]) - L2)),
    };
  }

  if (t === 'dragLink') {
    const { S, P, R1, R2, L } = k;
    const C = [S[0] + R1 * Math.cos(th), S[1] + R1 * Math.sin(th)];
    const Q = ci(C[0], C[1], L, P[0], P[1], R2, +1);
    const outA = Math.atan2(Q[1] - P[1], Q[0] - P[0]);
    return {
      crankRad: th, pts: { S, C, Q, P },
      links: [{ a: 'S', b: 'C', L: R1, lay: 1 }, { a: 'C', b: 'Q', L, lay: 2 }, { a: 'P', b: 'Q', L: R2, lay: 3 }],
      pins: [{ p: 'C', lay: 2 }, { p: 'Q', lay: 3 }, { p: 'P', lay: 4 }],
      trace: Q, statLabel: '출력각', statVal: `${(((outA / DEG) + 360) % 360).toFixed(0)}°`,
      err: Math.max(Math.abs(Math.hypot(Q[0] - C[0], Q[1] - C[1]) - L), Math.abs(Math.hypot(Q[0] - P[0], Q[1] - P[1]) - R2)),
    };
  }

  if (t === 'hoeken360') {
    const { S, P, R, Lc, Rout } = k;
    const C = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const Q = ci(C[0], C[1], Lc, P[0], P[1], Rout, +1);
    const T = [C[0] + 2 * (Q[0] - C[0]), C[1] + 2 * (Q[1] - C[1])];
    return {
      crankRad: th, pts: { S, C, Q, P, T },
      links: [{ a: 'C', b: 'T', L: Lc * 2, lay: 1 }, { a: 'P', b: 'Q', L: Rout, lay: 2 }],
      pins: [{ p: 'C', lay: 1 }, { p: 'Q', lay: 2 }, { p: 'P', lay: 2 }],
      trace: T, statLabel: '직선이송', statVal: `${T[0].toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(Q[0] - C[0], Q[1] - C[1]) - Lc), Math.abs(Math.hypot(Q[0] - P[0], Q[1] - P[1]) - Rout)),
    };
  }

  if (t === 'toggle') {
    const { S, P, R, L1, L2in, L2, L3, railZ, holeA } = k;
    const rad = (deg - 90) * DEG;
    const C = [S[0] + R * Math.cos(rad), S[1] + R * Math.sin(rad)];
    const Kin = ci(P[0], P[1], L2in, C[0], C[1], L1, +1);
    const ang = Math.atan2(Kin[1] - P[1], Kin[0] - P[0]);
    const K = [P[0] + L2 * Math.cos(ang), P[1] + L2 * Math.sin(ang)];
    const xS = K[0] + Math.sqrt(Math.max(0, L3 * L3 - (K[1] - railZ) ** 2));
    const X = [xS, railZ];
    const oc = K[1] - railZ;
    return {
      crankRad: rad, pts: { S, P, C, Kin, K, X },
      links: holeA
        ? [{ a: 'C', b: 'Kin', L: L1, lay: 2 }, { a: 'P', b: 'K', L: L2, lay: 1 }, { a: 'K', b: 'X', L: L3, lay: 2 }]
        : [{ a: 'C', b: 'Kin', L: L1, lay: 1 }, { a: 'P', b: 'K', L: L2, lay: 2 }, { a: 'K', b: 'X', L: L3, lay: 1 }],
      pins: holeA
        ? [{ p: 'C', lay: 2 }, { p: 'Kin', lay: 2 }, { p: 'P', lay: 1 }, { p: 'K', lay: 2 }, { p: 'X', lay: 2 }]
        : [{ p: 'C', lay: 1 }, { p: 'Kin', lay: 2 }, { p: 'P', lay: 2 }, { p: 'K', lay: 2 }, { p: 'X', lay: 2 }],
      sliders: [{ p: 'X', axis: 'x', lay: holeA ? 1 : 2 }],
      trace: X, statLabel: oc >= 0 ? '잠금상태' : '클램프', statVal: oc >= 0 ? `잠김(+${oc.toFixed(1)})` : `${xS.toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(Kin[0] - C[0], Kin[1] - C[1]) - L1), Math.abs(Math.hypot(K[0] - P[0], K[1] - P[1]) - L2), Math.abs(Math.hypot(X[0] - K[0], X[1] - K[1]) - L3)),
    };
  }

  if (t === 'wattLine') {
    const { S, P, R1, R2, Lc, thMin, thMax } = k;
    const wth = (thMin + (deg / 180) * (thMax - thMin)) * DEG;
    const S0 = [S[0], -10], P0 = [P[0], 10];
    const A = [S0[0] + R1 * Math.cos(wth), S0[1] + R1 * Math.sin(wth)];
    const B = ci(A[0], A[1], Lc, P0[0], P0[1], R2, +1);
    const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    return {
      crankRad: wth, pts: { S: S0, P: P0, A, B, M },
      links: [{ a: 'S', b: 'A', L: R1, lay: 1 }, { a: 'A', b: 'B', L: Lc, lay: 2 }, { a: 'P', b: 'B', L: R2, lay: 1 }],
      pins: [{ p: 'A', lay: 2 }, { p: 'B', lay: 2 }, { p: 'P', lay: 1 }],
      trace: M, statLabel: '직선Z', statVal: `${M[1].toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(B[0] - A[0], B[1] - A[1]) - Lc), Math.abs(Math.hypot(B[0] - P0[0], B[1] - P0[1]) - R2)),
    };
  }

  if (t === 'scissor') {
    const { S, R, Ldrv, Lbar, stages, baseX } = k;
    const C = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const b1dx = C[0] - Math.sqrt(Math.max(0, Ldrv * Ldrv - (C[1] - S[1]) ** 2));
    const b1x = b1dx - 20;
    const span = Math.max(8, Math.min(Lbar - 4, b1x - baseX));
    const h = Math.sqrt(Math.max(1, Lbar * Lbar - span * span));
    const pts = { S, C, B0: [baseX, 0], B1: [baseX + span, 0], B1d: [baseX + span + 20, 0] };
    const links = [{ a: 'S', b: 'C', L: R, lay: 1 }, { a: 'C', b: 'B1d', L: Ldrv, lay: 2 }];
    const pins = [{ p: 'C', lay: 2 }, { p: 'B1d', lay: 2 }, { p: 'B0', lay: 1 }, { p: 'B1', lay: 2 }];
    for (let i = 0; i < stages; i++) {
      const y0 = i * h, y1 = (i + 1) * h, ym = (i + 0.5) * h;
      const l0 = `L${i}`, r0 = `R${i}`, l1 = `L${i + 1}`, r1 = `R${i + 1}`, m = `M${i}`;
      pts[l0] = [baseX, y0]; pts[r0] = [baseX + span, y0]; pts[l1] = [baseX, y1]; pts[r1] = [baseX + span, y1]; pts[m] = [baseX + span / 2, ym];
      links.push({ a: l0, b: r1, L: Lbar, lay: 1 }, { a: r0, b: l1, L: Lbar, lay: 2 });
      pins.push({ p: m, lay: 2 });
      if (i > 0) pins.push({ p: l0, lay: 2 }, { p: r0, lay: 2 });
    }
    const tip = [baseX + span / 2, stages * h];
    pts.tip = tip;
    return {
      crankRad: th, pts, links, pins, sliders: [{ p: 'B1', axis: 'x', lay: 1, off: 10 }],
      trace: tip, statLabel: '신축길이', statVal: `${(stages * h).toFixed(1)} mm`,
      err: Math.abs(Math.hypot(pts.B1d[0] - C[0], pts.B1d[1] - C[1]) - Ldrv),
    };
  }

  if (t === 'walkingLeg') {
    const { S, P, R, Rout, Lc, Ltot } = k;
    const C = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const Q = ci(C[0], C[1], Lc, P[0], P[1], Rout, -1);
    const ux = (Q[0] - C[0]) / Lc, uy = (Q[1] - C[1]) / Lc;
    const F = [C[0] + Ltot * ux, C[1] + Ltot * uy];
    return {
      crankRad: th, pts: { S, C, Q, P, F },
      links: [{ a: 'C', b: 'F', L: Ltot, lay: 1 }, { a: 'P', b: 'Q', L: Rout, lay: 2 }],
      pins: [{ p: 'C', lay: 1 }, { p: 'Q', lay: 2 }, { p: 'P', lay: 2 }],
      trace: F, statLabel: '발끝높이', statVal: `${F[1].toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(Q[0] - C[0], Q[1] - C[1]) - Lc), Math.abs(Math.hypot(Q[0] - P[0], Q[1] - P[1]) - Rout)),
    };
  }

  if (t === 'dualWalk360') {
    const { S, PL, PR, R, Rout, Lc, L2, Ltot } = k;
    const mOff = k.mOff ?? 10;
    const LtotL = k.LtotL ?? Ltot;
    const C1 = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const QR = ci(C1[0], C1[1], Lc, PR[0], PR[1], Rout, -1);
    const uRx = (QR[0] - C1[0]) / Lc, uRy = (QR[1] - C1[1]) / Lc;
    const FR = [C1[0] + Ltot * uRx, C1[1] + Ltot * uRy];
    const M = [C1[0] + mOff * uRx, C1[1] + mOff * uRy];
    const QL = ci(M[0], M[1], L2, PL[0], PL[1], Rout, +1);
    const uLx = (QL[0] - M[0]) / L2, uLy = (QL[1] - M[1]) / L2;
    const FL = [M[0] + LtotL * uLx, M[1] + LtotL * uLy];
    return {
      crankRad: th, pts: { S, C1, M, QR, QL, PR, PL, FR, FL },
      links: [
        { a: 'C1', b: 'FR', L: Ltot, lay: 1 }, { a: 'PR', b: 'QR', L: Rout, lay: 2 },
        { a: 'M', b: 'FL', L: LtotL, lay: 2 }, { a: 'PL', b: 'QL', L: Rout, lay: 1 },
      ],
      pins: [
        { p: 'C1', lay: 1 }, { p: 'M', lay: 2 }, { p: 'QR', lay: 2 },
        { p: 'QL', lay: 2 }, { p: 'PR', lay: 2 }, { p: 'PL', lay: 1 },
      ],
      trace: FR, statLabel: '좌/우발', statVal: `${FL[1].toFixed(0)}/${FR[1].toFixed(0)}`,
      err: Math.max(Math.abs(Math.hypot(QR[0] - C1[0], QR[1] - C1[1]) - Lc), Math.abs(Math.hypot(QL[0] - M[0], QL[1] - M[1]) - L2)),
    };
  }

  if (t === 'dualStageTier') {
    const { S, R, LA, LB, PA, RA } = k;
    const C1 = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const xB = C1[0] + Math.sqrt(Math.max(0, LB * LB - (C1[1] - S[1]) ** 2));
    const XB = [xB, S[1]];
    const QA = ci(C1[0], C1[1], LA, PA[0], PA[1], RA, -1);
    const aA = Math.atan2(QA[1] - PA[1], QA[0] - PA[0]);
    const hatch = [PA[0] + 40 * Math.cos(aA), PA[1] + 40 * Math.sin(aA)];
    return {
      crankRad: th, pts: { S, C1, QA, PA, hatch, XB },
      links: [
        { a: 'C1', b: 'XB', L: LB, lay: 2, tier: 0 },
        { a: 'C1', b: 'QA', L: LA, lay: 2, tier: 1 },
        { a: 'PA', b: 'hatch', L: 40, lay: 1, tier: 1 },
      ],
      pins: [
        { p: 'C1', lay: 2, tier: 0 }, { p: 'XB', lay: 2, tier: 0 },
        { p: 'C1', lay: 2, tier: 1 }, { p: 'QA', lay: 2, tier: 1 }, { p: 'PA', lay: 1, tier: 1 },
      ],
      sliders: [{ p: 'XB', axis: 'x', lay: 1, tier: 0 }],
      trace: XB, statLabel: deg < 90 ? '해치각' : '푸셔X', statVal: deg < 90 ? `${(aA / DEG).toFixed(0)}°` : `${xB.toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(QA[0] - C1[0], QA[1] - C1[1]) - LA), Math.abs(Math.hypot(XB[0] - C1[0], XB[1] - C1[1]) - LB)),
    };
  }

  if (t === 'dualStage90Tier') {
    const { S, R1, R2, LA, LB, PA, RA } = k;
    const rad = (deg - 90) * DEG;
    const C1 = [S[0] + R1 * Math.cos(rad), S[1] + R1 * Math.sin(rad)];
    const C2 = [S[0] + R2 * Math.cos(rad - Math.PI / 2), S[1] + R2 * Math.sin(rad - Math.PI / 2)];
    const xB = C1[0] + Math.sqrt(Math.max(0, LB * LB - (C1[1] - S[1]) ** 2));
    const XB = [xB, S[1]];
    const QA = ci(C2[0], C2[1], LA, PA[0], PA[1], RA, +1);
    const aA = Math.atan2(QA[1] - PA[1], QA[0] - PA[0]);
    const hatch = [PA[0] + 40 * Math.cos(aA), PA[1] + 40 * Math.sin(aA)];
    return {
      crankRad: rad, pts: { S, C1, C2, QA, PA, hatch, XB },
      links: [
        { a: 'C1', b: 'XB', L: LB, lay: 1, tier: 0 },
        { a: 'C2', b: 'QA', L: LA, lay: 1, tier: 1 },
        { a: 'PA', b: 'hatch', L: 40, lay: 2, tier: 1 },
      ],
      pins: [
        { p: 'C1', lay: 1, tier: 0 }, { p: 'XB', lay: 2, tier: 0 },
        { p: 'C2', lay: 1, tier: 1 }, { p: 'QA', lay: 2, tier: 1 }, { p: 'PA', lay: 2, tier: 1 },
      ],
      sliders: [{ p: 'XB', axis: 'x', lay: 2, tier: 0 }],
      trace: XB, statLabel: deg < 90 ? '해치각' : '푸셔X', statVal: deg < 90 ? `${(aA / DEG).toFixed(0)}°` : `${xB.toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(QA[0] - C2[0], QA[1] - C2[1]) - LA), Math.abs(Math.hypot(XB[0] - C1[0], XB[1] - C1[1]) - LB)),
    };
  }

  if (t === 'scoop6') {
    const { S, P1, R, Rtab, Ldrv, Lboom, P2, Lsec, Rsc } = k;
    const C = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const Q = ci(C[0], C[1], Ldrv, P1[0], P1[1], Rtab, -1);
    const ba = Math.atan2(Q[1] - P1[1], Q[0] - P1[0]);
    const tip = [P1[0] + Lboom * Math.cos(ba), P1[1] + Lboom * Math.sin(ba)];
    const K1 = ci(tip[0], tip[1], Rsc, P2[0], P2[1], Lsec, +1);
    const K2 = ci(tip[0], tip[1], Rsc, P2[0], P2[1], Lsec, -1);
    const K = K1[1] > K2[1] ? K1 : K2;
    const sa = Math.atan2(tip[1] - K[1], tip[0] - K[0]);
    const lip = [tip[0] + 20 * Math.cos(sa), tip[1] + 20 * Math.sin(sa)];
    return {
      crankRad: th, pts: { S, C, Q, P1, P2, tip, K, lip },
      links: [
        { a: 'C', b: 'Q', L: Ldrv, lay: 1 },
        { a: 'P1', b: 'tip', L: Lboom, lay: 2 },
        { a: 'P2', b: 'K', L: Lsec, lay: 2 },
        { a: 'K', b: 'lip', L: Rsc + 20, lay: 1 },
      ],
      pins: [
        { p: 'C', lay: 1 }, { p: 'Q', lay: 2 }, { p: 'P1', lay: 2 },
        { p: 'P2', lay: 2 }, { p: 'tip', lay: 2 }, { p: 'K', lay: 2 },
      ],
      trace: lip, statLabel: '붐/스쿱', statVal: `${(ba / DEG).toFixed(0)}°/${(sa / DEG).toFixed(0)}°`,
      err: Math.max(Math.abs(Math.hypot(Q[0] - C[0], Q[1] - C[1]) - Ldrv), Math.abs(Math.hypot(K[0] - P2[0], K[1] - P2[1]) - Lsec)),
    };
  }

  if (t === 'dwellPress6') {
    const { S, P, R, Lc, Rout, pressX, Lpress } = k;
    const C = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const Q = ci(C[0], C[1], Lc, P[0], P[1], Rout, +1);
    const T = [C[0] + 2 * (Q[0] - C[0]), C[1] + 2 * (Q[1] - C[1])];
    const dx = pressX - T[0];
    const yP = T[1] - Math.sqrt(Math.max(0, Lpress * Lpress - dx * dx));
    const PR = [pressX, yP];
    const PR_BOT = [pressX, Math.max(12, yP - 20)];
    return {
      crankRad: th, pts: { S, C, Q, P, T, PR, PR_BOT },
      links: [
        { a: 'C', b: 'T', L: Lc * 2, lay: 1 },
        { a: 'P', b: 'Q', L: Rout, lay: 2 },
        { a: 'T', b: 'PR', L: Lpress, lay: 2 },
        { a: 'PR', b: 'PR_BOT', L: 20, lay: 1 },
      ],
      pins: [{ p: 'C', lay: 1 }, { p: 'Q', lay: 2 }, { p: 'P', lay: 2 }, { p: 'T', lay: 2 }, { p: 'PR', lay: 2 }],
      trace: PR, statLabel: yP < 56 ? '하단정지' : '프레스Y', statVal: `${yP.toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(Q[0] - C[0], Q[1] - C[1]) - Lc), Math.abs(Math.hypot(PR[0] - T[0], PR[1] - T[1]) - Lpress)),
    };
  }

  if (t === 'ratchet3d') {
    const { S, PB, R, RB1, RB2, L1, PW, RW } = k;
    const Lp = k.Lpawl ?? 50;
    const C = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const Q1 = ci(C[0], C[1], L1, PB[0], PB[1], RB1, -1);
    const a2 = Math.atan2(PB[1] - Q1[1], PB[0] - Q1[0]);
    const Q2 = [PB[0] + RB2 * Math.cos(a2), PB[1] + RB2 * Math.sin(a2)];
    const dxp = Math.sqrt(Math.max(1, Lp * Lp - (PW[1] + RW - Q2[1]) ** 2));
    const Pawl = [Q2[0] + dxp, PW[1] + RW];
    return {
      crankRad: th, pts: { S, C, Q1, PB, Q2, Pawl, PW },
      links: [
        { a: 'C', b: 'Q1', L: L1, lay: 1 },
        { a: 'Q1', b: 'Q2', L: RB1 + RB2, lay: 2 },
        { a: 'Q2', b: 'Pawl', L: Lp, lay: 1 },
      ],
      pins: [{ p: 'C', lay: 1 }, { p: 'Q1', lay: 2 }, { p: 'PB', lay: 2 }, { p: 'Q2', lay: 2 }],
      trace: Pawl, pawlX: Pawl[0], statLabel: '인덱스누적', statVal: '0°',
      err: Math.abs(Math.hypot(Q1[0] - C[0], Q1[1] - C[1]) - L1),
    };
  }
  throw new Error(`Unknown mech type: ${t}`);
}

function buildSingleRig(spec, mods) {
  const root = new THREE.Group();
  const hingePivots = [];
  for (const p of spec.staticParts) {
    const { g, handles } = makePart(mods, p.id, p.o, p.xdir, p.up, p.length);
    if (p.id === 'hinge-3x3' && handles?.pivot) hingePivots.push(handles.pivot);
    root.add(g);
  }

  const rig = spec.rig;
  const k = spec.kin;
  const rRest = solveMech(spec, spec.rest);

  // 출력 궤적 가이드라인 (360° 연속 메커니즘은 닫힌 루프)
  const trajPts = [];
  const [lo, hi] = spec.range;
  const traceTier = spec.spacerTier === 'wheel-opp' ? 2 : (spec.spacerTier ? 1 : 0);
  for (let d = lo; d <= hi; d += 3) {
    const r = solveMech(spec, d);
    if (rig === 'V_WEDGE') {
      trajPts.push(new THREE.Vector3(0, k.PY + 80 * Math.sin(r.ang), k.PZ - 80 * Math.cos(r.ang)));
    } else if (r.trace) {
      trajPts.push(rig === 'H'
        ? new THREE.Vector3(r.trace[0], 59.5 + traceTier * TIER_STEP, r.trace[1])
        : new THREE.Vector3(r.trace[0], r.trace[1], -52.5 - traceTier * TIER_STEP));
    }
  }
  const tierCol = { 1: 0x2f6fe0, 2: 0x1f9d60, 3: 0xe87a1e, 4: 0x8b46d9, 5: 0xe03636 }[spec.tier] || 0xe8432a;
  if (trajPts.length >= 2) {
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(trajPts), new THREE.LineBasicMaterial({ color: tierCol, transparent: true, opacity: 0.85 })));
  }

  // 특수 리그: M02 썬더 웨지 4절 링크 (실물 motor-guide Hole B ±90° 이내)
  if (rig === 'V_WEDGE') {
    const wedgePivot = new THREE.Group();
    wedgePivot.position.set(0, k.PY, k.PZ);
    root.add(wedgePivot);

    const restA = k.restDeg * DEG;
    const ca = Math.cos(restA), sa = Math.sin(restA);
    const wUp = [0, ca, -sa], wX = [1, 0, 0];
    const wPt = (x, u, v) => [x, -u * sa + v * ca, -u * ca - v * sa];

    wedgePivot.add(
      makePart(mods, 'frame-main-pcb', wPt(0, 45, -2.0), wX, wUp).g,
      makePart(mods, 'battle-g', wPt(0, 85, -0.4), wX, wUp).g,
      makePart(mods, 'motor-frame-3x3', wPt(k.linkX, k.tabU, -0.4), wX, wUp).g,
      makePart(mods, 's-hook-35', wPt(k.linkX + 1.6, k.tabU, k.tabV), null, [1, 0, 0]).g,
    );

    const crankPivot = new THREE.Group();
    crankPivot.position.set(k.linkX, k.SY, k.SZ);
    root.add(crankPivot);
    // 실물 motor-guide: Hole A(x=-5) → (0,0,0), Hole B(x=+5) → (0,0,+10), 상면 y=2.8 → x=0.0(세계 59.0)
    crankPivot.add(
      makePart(mods, 'motor-guide', [-2.8, 0, 5.0], [0, 0, 1], [1, 0, 0]).g,
      makePart(mods, 'bolt-m26x10', [-10.0, 0, 0], null, [1, 0, 0]).g,
      makePart(mods, 's-hook-35', [1.6, 0, k.R], null, [1, 0, 0]).g,
    );
    const coupler = makePart(mods, 'frame-s8-pcb', [k.linkX, 0, 0], [0, 0, 1], [1, 0, 0]).g;
    root.add(coupler);

    const setAngle = (deg) => {
      const r = solveMech(spec, deg);
      wedgePivot.rotation.x = r.lift * DEG;
      for (const pv of hingePivots) pv.rotation.z = (r.lift - k.restDeg) * DEG;
      crankPivot.rotation.x = -r.crankRad;
      coupler.position.set(k.linkX, r.ty + 35 * r.uy, r.tz + 35 * r.ux);
      setBasis(coupler, [0, r.uy, r.ux], [1, 0, 0]);
      return r;
    };
    setAngle(spec.rest);
    return { root, setAngle };
  }

  // 공통 수평(H: Layer 0 상면 Y=53.2) / 수직(V: Layer 0 전면 Z=-46.6) 크랭크 허브
  const sx = k.S[0], sy = (k.type === 'wattLine') ? -10 : k.S[1];
  const crankPivot = new THREE.Group();
  crankPivot.position.set(sx, rig === 'H' ? 53.2 : sy, rig === 'H' ? sy : -46.6);
  root.add(crankPivot);

  const gid = spec.guidePart || 'motor-guide';
  const stMode = spec.spacerTier || null;
  const outUp = cpUp(rig, true);
  const inUp = cpUp(rig, false);
  const xPos = [1, 0, 0];
  const xNeg = [-1, 0, 0];
  const zPos = rig === 'H' ? [0, 0, 1] : [0, 1, 0];

  if (stMode === 'motor-guide-opp') {
    // M04/M05/M06/M08: Hole A 가이드라인 고정 소5(-10..+30, C1=-10) → 서포트 L=10(+20,+30) → 2층 소3(+10..+30, C2=+10)
    crankPivot.add(
      makePart(mods, 'motor-guide', cpPt(rig, 5.0, -2.8), xPos, outUp).g,
      makePart(mods, 'frame-s5-pcb', cpPt(rig, 10.0, 0.0), xPos, outUp).g,
      makePart(mods, 'bolt-m26x10', cpPt(rig, 0.0, -8.4), null, outUp).g,
      makePart(mods, 'support-spacer', cpPt(rig, 20.0, 1.6), null, outUp, 10).g,
      makePart(mods, 'bolt-m3x6', cpPt(rig, 20.0, 6.0), null, inUp).g,
      makePart(mods, 'support-spacer', cpPt(rig, 30.0, 1.6), null, outUp, 10).g,
      makePart(mods, 'bolt-m3x6', cpPt(rig, 30.0, 6.0), null, inUp).g,
      makePart(mods, 'frame-s3-pcb', cpPt(rig, 20.0, 11.6), xPos, outUp).g,
      makePart(mods, 'nut-m3', cpPt(rig, 20.0, 13.2), null, outUp).g,
      makePart(mods, 'nut-m3', cpPt(rig, 30.0, 13.2), null, outUp).g,
    );
  } else if (stMode === 'motor-guide-same') {
    // M13: Hole A 고정 소4(-20..+10, C1=+10) → 서포트 L=10(-10,-20) → 2층 소4(-20..+10, C2=+10)
    crankPivot.add(
      makePart(mods, 'motor-guide', cpPt(rig, -5.0, -2.8), xNeg, outUp).g,
      makePart(mods, 'frame-s4-pcb', cpPt(rig, -5.0, 0.0), xPos, outUp).g,
      makePart(mods, 'bolt-m26x10', cpPt(rig, 0.0, -8.4), null, outUp).g,
      makePart(mods, 'support-spacer', cpPt(rig, -10.0, 1.6), null, outUp, 10).g,
      makePart(mods, 'bolt-m3x10', cpPt(rig, -10.0, 7.2), null, inUp).g,
      makePart(mods, 'support-spacer', cpPt(rig, -20.0, 1.6), null, outUp, 10).g,
      makePart(mods, 'bolt-m3x6', cpPt(rig, -20.0, 6.0), null, inUp).g,
      makePart(mods, 'frame-s4-pcb', cpPt(rig, -5.0, 11.6), xPos, outUp).g,
      makePart(mods, 'nut-m3', cpPt(rig, -10.0, 13.2), null, outUp).g,
      makePart(mods, 'nut-m3', cpPt(rig, -20.0, 13.2), null, outUp).g,
    );
  } else if (stMode === 'wheel-opp') {
    // S04/S05/S06/S08: 서보 휠가이드 → 서포트 L=10 → 1층 중6(C1=-10) → 서포트 L=10(+20,+30) → 2층 소3(C2=+10)
    const bz = rig === 'H' ? -10.0 : 10.0;
    crankPivot.add(
      makePart(mods, gid, cpPt(rig, 0.0, -0.3), xPos, inUp).g,
      makePart(mods, 'bolt-m26x10', cpPt(rig, 0.0, -10.0), null, outUp).g,
      makePart(mods, 'support-spacer', cpPt(rig, 10.0, 0.0, 0.0), null, outUp, 10).g,
      makePart(mods, 'bolt-m3x6', cpPt(rig, 10.0, 3.0, 0.0), null, inUp).g,
      makePart(mods, 'support-spacer', cpPt(rig, 0.0, 0.0, bz), null, outUp, 10).g,
      makePart(mods, 'bolt-m3x6', cpPt(rig, 0.0, 3.0, bz), null, inUp).g,
      makePart(mods, 'frame-m6-pcb', cpPt(rig, 5.0, 10.0, bz / 2), xPos, outUp).g,
      makePart(mods, 'nut-m3', cpPt(rig, 10.0, 11.6, 0.0), null, outUp).g,
      makePart(mods, 'nut-m3', cpPt(rig, 0.0, 11.6, bz), null, outUp).g,
      makePart(mods, 'support-spacer', cpPt(rig, 20.0, 11.6, 0.0), null, outUp, 10).g,
      makePart(mods, 'bolt-m3x6', cpPt(rig, 20.0, 16.0, 0.0), null, inUp).g,
      makePart(mods, 'support-spacer', cpPt(rig, 30.0, 11.6, 0.0), null, outUp, 10).g,
      makePart(mods, 'bolt-m3x6', cpPt(rig, 30.0, 16.0, 0.0), null, inUp).g,
      makePart(mods, 'frame-s3-pcb', cpPt(rig, 20.0, 21.6, 0.0), xPos, outUp).g,
      makePart(mods, 'nut-m3', cpPt(rig, 20.0, 23.2, 0.0), null, outUp).g,
      makePart(mods, 'nut-m3', cpPt(rig, 30.0, 23.2, 0.0), null, outUp).g,
    );
  } else if (stMode === 'wheel-90-pos' || stMode === 'wheel-90-neg') {
    // S09/S13: 서보 휠가이드(C1=+10) → 십자 서포트 L=10(0,±10) → 2층 90° 소4(C2=0,±20)
    const zMid = stMode === 'wheel-90-pos' ? 5.0 : -5.0;
    crankPivot.add(
      makePart(mods, gid, cpPt(rig, 0.0, -0.3), xPos, inUp).g,
      makePart(mods, 'bolt-m26x10', cpPt(rig, 0.0, -10.0), null, outUp).g,
      makePart(mods, 'support-spacer', cpPt(rig, 0.0, 0.0, -10.0), null, outUp, 10).g,
      makePart(mods, 'bolt-m3x6', cpPt(rig, 0.0, 3.0, -10.0), null, inUp).g,
      makePart(mods, 'support-spacer', cpPt(rig, 0.0, 0.0, 10.0), null, outUp, 10).g,
      makePart(mods, 'bolt-m3x6', cpPt(rig, 0.0, 3.0, 10.0), null, inUp).g,
      makePart(mods, 'frame-s4-pcb', cpPt(rig, 0.0, 10.0, zMid), zPos, outUp).g,
      makePart(mods, 'nut-m3', cpPt(rig, 0.0, 11.6, -10.0), null, outUp).g,
      makePart(mods, 'nut-m3', cpPt(rig, 0.0, 11.6, 10.0), null, outUp).g,
    );
  } else if (gid === 'motor-guide') {
    const hasCenterBar = rRest.links.some((lk) => lk.a === 'S' && lk.lay === 1) || !!k.holeA;
    const flipMg = (k.type === 'parallel4' || !!k.holeA);
    const boltOff = hasCenterBar ? -8.4 : -10.0;
    crankPivot.add(
      makePart(mods, 'motor-guide', cpPt(rig, flipMg ? -5.0 : 5.0, -2.8), flipMg ? xNeg : xPos, outUp).g,
      makePart(mods, 'bolt-m26x10', cpPt(rig, 0.0, boltOff), null, outUp).g,
    );
    if (k.holeA) {
      // M09: Hole A 가이드라인에 소3 프레임 1볼트 고정 → C(+10)은 공중 돌출(2장 밀착)
      crankPivot.add(makePart(mods, 'frame-s3-pcb', cpPt(rig, 0.0, 0.0), xPos, outUp).g);
    }
  } else {
    const hasCenterBar = rRest.links.some((lk) => lk.a === 'S' && lk.lay === 1);
    const boltOff = hasCenterBar ? -8.4 : -10.0;
    const isYellow40 = (gid === 'wheel-guide-40-yellow');
    const wgOff = isYellow40 ? -2.7 : -0.3;
    crankPivot.add(
      makePart(mods, gid, cpPt(rig, 0.0, wgOff), xPos, isYellow40 ? outUp : inUp).g,
      makePart(mods, 'bolt-m26x10', cpPt(rig, 0.0, boltOff), null, outUp).g,
    );
  }

  const linkObjs = rRest.links.map((lk) => {
    const bs = barSpecFor(lk.L);
    const { g } = makePart(mods, bs.id, [0, 0, 0], [1, 0, 0], [0, 1, 0]);
    root.add(g);
    return { g, lk, h0: lk.h0 ?? bs.h0 };
  });

  const pinObjs = rRest.pins.map((pn) => {
    const { g } = makePart(mods, 's-hook-35', [0, 0, 0], null, [0, 1, 0]);
    root.add(g);
    return { g, pn };
  });

  // 실물 PCB 슬라이더 캐리지(소3 PCB)
  const sliderObjs = (rRest.sliders || []).map((sl) => {
    const xdir = sl.axis === 'z' ? [0, 0, 1] : [1, 0, 0];
    const { g } = makePart(mods, 'frame-s3-pcb', [0, 0, 0], xdir, [0, 1, 0]);
    root.add(g);
    return { g, sl };
  });

  let ratchetWheel = null, ratchetCum = 0, lastPawlX = null;
  if (k.type === 'ratchet3d') {
    ratchetWheel = new THREE.Group();
    ratchetWheel.position.set(k.PW[0], k.PW[1], -51.6);
    ratchetWheel.add(makePart(mods, 'caterpillar-sprocket', [0, -30, 0], [1, 0, 0], [0, 1, 0]).g);
    root.add(ratchetWheel);
  }

  let scoopGrab = null;
  if (k.type === 'scoop6') {
    scoopGrab = makePart(mods, 'grab', [0, 0, 0], [1, 0, 0], [0, 1, 0]).g;
    root.add(scoopGrab);
  }

  let hammerBlade = null;
  if (k.type === 'hammer360') {
    hammerBlade = makePart(mods, 'battle-g', [0, 0, 0], [1, 0, 0], [0, 1, 0]).g;
    root.add(hammerBlade);
  }

  const setAngle = (deg) => {
    const r = solveMech(spec, deg);
    if (rig === 'H') crankPivot.rotation.y = -r.crankRad;
    else crankPivot.rotation.z = r.crankRad;

    for (let i = 0; i < linkObjs.length; i++) {
      const { g, h0 } = linkObjs[i];
      const lk = r.links[i];
      placeLink2D(g, r.pts[lk.a], r.pts[lk.b], rig, lk.lay, h0, lk.tier || 0);
    }
    for (let i = 0; i < pinObjs.length; i++) {
      const pn = r.pins[i];
      placeHook2D(pinObjs[i].g, r.pts[pn.p], rig, pn.lay, pn.tier || 0);
    }
    for (let i = 0; i < sliderObjs.length; i++) {
      const { g, sl } = sliderObjs[i];
      const pt = r.pts[sl.p];
      const y = 53.2 + (sl.tier || 0) * TIER_STEP + 1.6 * ((sl.lay ?? 2) - 1);
      const off = sl.off || 0;
      if (sl.axis === 'z') g.position.set(pt[0], y, pt[1] + off);
      else g.position.set(pt[0] + off, y, pt[1]);
    }
    if (ratchetWheel && r.pawlX !== undefined) {
      if (lastPawlX !== null && r.pawlX > lastPawlX) ratchetCum += (r.pawlX - lastPawlX) / k.RW;
      lastPawlX = r.pawlX;
      ratchetWheel.rotation.z = -ratchetCum;
      r.statVal = `${Math.round(ratchetCum / DEG)}° (${(ratchetCum / (Math.PI * 2)).toFixed(1)}회전)`;
    }
    if (scoopGrab && r.pts.tip && r.pts.lip) {
      scoopGrab.position.set(r.pts.lip[0] + 2, r.pts.lip[1], -47.4);
      setBasis(scoopGrab, [0, 1, 0], [1, 0, 0]);
    }
    if (hammerBlade && r.pts.P && r.pts.tip) {
      const ang = Math.atan2(r.pts.tip[1] - r.pts.P[1], r.pts.tip[0] - r.pts.P[0]);
      hammerBlade.position.set(r.pts.tip[0], r.pts.tip[1], -49.8);
      setBasis(hammerBlade, [Math.cos(ang), Math.sin(ang), 0], [0, 0, -1]);
    }
    return r;
  };

  const resetRatchet = () => { ratchetCum = 0; lastPawlX = null; };
  setAngle(spec.rest);
  return { root, setAngle, resetRatchet };
}

export async function buildMechLab(loadPart, onProgress, opts = {}) {
  const partIds = opts.partIds || MECHLAB_PART_IDS;
  const specs = opts.filter ? MECHS.filter(opts.filter) : MECHS;
  const mods = {};
  for (let i = 0; i < partIds.length; i++) {
    const id = partIds[i];
    mods[id] = await loadPart(id);
    if (onProgress) onProgress((i + 1) / partIds.length);
  }

  const root = new THREE.Group();
  const rigs = {};
  for (const sp of specs) {
    const rig = buildSingleRig(sp, mods);
    rig.root.visible = false;
    root.add(rig.root);
    rigs[sp.code] = rig;
  }

  let activeCode = opts.initialCode || specs[0].code;
  let activeDeg = MECH_BY_CODE[activeCode].rest;
  let lastResult = null;

  function select(code) {
    if (!rigs[code]) return null;
    for (const [c, r] of Object.entries(rigs)) r.root.visible = (c === code);
    activeCode = code;
    const sp = MECH_BY_CODE[code];
    activeDeg = sp.rest;
    if (rigs[code].resetRatchet) rigs[code].resetRatchet();
    lastResult = rigs[code].setAngle(activeDeg);
    return sp;
  }

  function setAngle(deg) {
    const sp = MECH_BY_CODE[activeCode];
    const [lo, hi] = sp.range;
    activeDeg = sp.robot === 'motor' ? ((deg % 360) + 360) % 360 : Math.max(lo, Math.min(hi, deg));
    lastResult = rigs[activeCode].setAngle(activeDeg);
    return lastResult;
  }

  select(activeCode);
  return {
    root, rigs, select, setAngle,
    getActive: () => ({ spec: MECH_BY_CODE[activeCode], deg: activeDeg, res: lastResult }),
    count: specs.length,
  };
}
