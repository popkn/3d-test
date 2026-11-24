import * as THREE from 'three';
import { DUAL_MECHS, DUAL_BY_CODE } from './catalog.js';

// 서보 2축 메커니즘 (서보 2개 × 서보 가이드 motor-guide 전용 · 15종 D01~D15)
const DEG = Math.PI / 180;
const UP_Y = new THREE.Vector3(0, 1, 0);

export const DUAL_SERVO_PART_IDS = [
  'frame-big-main', 'frame-main-pcb', 'frame-half-pcb', 'frame-m6-pcb',
  'frame-s3-pcb', 'frame-s4-pcb', 'frame-s5-pcb', 'frame-s7-pcb', 'frame-s8-pcb', 'frame-s12-pcb',
  'motor-frame-3x3', 'l-frame-2x2', 'hinge-3x3',
  'support-spacer', 'servo-digital', 'motor-guide',
  's-hook-35', 'grab', 'battle-g',
  'bolt-m3x6', 'bolt-m3x10', 'bolt-m26x10', 'nut-m3',
];

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

function placeLink2D(holder, pA, pB, rig, layer, h0, baseOff = 0) {
  const du = pB[0] - pA[0], dv = pB[1] - pA[1];
  const len = Math.hypot(du, dv) || 1;
  const uu = du / len, uv = dv / len;
  const midU = pA[0] - h0 * uu;
  const midV = pA[1] - h0 * uv;
  if (rig === 'H') {
    holder.position.set(midU, 53.2 + baseOff + 1.6 * (layer - 1), midV);
    setBasis(holder, [uu, 0, uv], [0, 1, 0]);
  } else {
    holder.position.set(midU, midV, -46.6 - baseOff - 1.6 * (layer - 1));
    setBasis(holder, [uu, uv, 0], [0, 0, -1]);
  }
}

function placeHook2D(holder, pt, rig, topLayer, baseOff = 0) {
  if (rig === 'H') {
    holder.position.set(pt[0], 53.2 + baseOff + 1.6 * topLayer, pt[1]);
    holder.quaternion.identity();
  } else {
    holder.position.set(pt[0], pt[1], -46.6 - baseOff - 1.6 * topLayer);
    setBasis(holder, [1, 0, 0], [0, 0, -1]);
  }
}

function cpPt(rig, x, h, z = 0) {
  return rig === 'H' ? [x, h, z] : [x, z, -h];
}
function cpUp(rig, outward = true) {
  if (rig === 'H') return outward ? [0, 1, 0] : [0, -1, 0];
  return outward ? [0, 0, -1] : [0, 0, 1];
}

export function solveDualMech(spec, deg1, deg2) {
  const k = spec.kin;
  const t = k.type;
  let err = 0;

  if (t === 'dualPincer') {
    const th1 = (deg1 + k.off1) * DEG;
    const th2 = (deg2 + k.off2) * DEG;
    const { S1, S2, PL, PR, R, Rout, L, jawLen } = k;
    const C1 = [S1[0] + R * Math.cos(th1), S1[1] + R * Math.sin(th1)];
    const C2 = [S2[0] + R * Math.cos(th2), S2[1] + R * Math.sin(th2)];
    const QL = ci(C1[0], C1[1], L, PL[0], PL[1], Rout, -1);
    const QR = ci(C2[0], C2[1], L, PR[0], PR[1], Rout, +1);
    const aL = Math.atan2(PL[1] - QL[1], PL[0] - QL[0]);
    const aR = Math.atan2(PR[1] - QR[1], PR[0] - QR[0]);
    const JL = [PL[0] + jawLen * Math.cos(aL), PL[1] + jawLen * Math.sin(aL)];
    const JR = [PR[0] + jawLen * Math.cos(aR), PR[1] + jawLen * Math.sin(aR)];
    err = Math.max(Math.abs(Math.hypot(QL[0] - C1[0], QL[1] - C1[1]) - L), Math.abs(Math.hypot(QR[0] - C2[0], QR[1] - C2[1]) - L));
    return {
      rad1: th1, rad2: th2, pts: { S1, S2, C1, C2, QL, QR, PL, PR, JL, JR },
      links: [
        { a: 'C1', b: 'QL', L, lay: 1 }, { a: 'QL', b: 'JL', L: Rout + jawLen, lay: 2 },
        { a: 'C2', b: 'QR', L, lay: 1 }, { a: 'QR', b: 'JR', L: Rout + jawLen, lay: 2 },
      ],
      pins: [
        { p: 'C1', lay: 1 }, { p: 'QL', lay: 2 }, { p: 'PL', lay: 2 },
        { p: 'C2', lay: 1 }, { p: 'QR', lay: 2 }, { p: 'PR', lay: 2 },
      ],
      trace: JR, statLabel: '집게간격', statVal: `${Math.hypot(JR[0] - JL[0], JR[1] - JL[1]).toFixed(1)} mm`, err,
    };
  }

  if (t === 'panTilt') {
    const panRad = (deg1 - 90) * DEG;
    const th2 = (deg2 + k.off2) * DEG;
    const { S2, P, R, Rout, L, armLen } = k;
    const C = [S2[0] + R * Math.cos(th2), S2[1] + R * Math.sin(th2)];
    const Q = ci(C[0], C[1], L, P[0], P[1], Rout, -1);
    const ang = Math.atan2(Q[1] - P[1], Q[0] - P[0]);
    const tip = [P[0] + armLen * Math.cos(ang), P[1] + armLen * Math.sin(ang)];
    err = Math.max(Math.abs(Math.hypot(Q[0] - C[0], Q[1] - C[1]) - L), Math.abs(Math.hypot(Q[0] - P[0], Q[1] - P[1]) - Rout));
    return {
      panRad, rad2: th2, pts: { S2, C, Q, P, tip },
      links: [{ a: 'C', b: 'Q', L, lay: 1 }, { a: 'P', b: 'tip', L: armLen, lay: 2 }],
      pins: [{ p: 'C', lay: 1 }, { p: 'Q', lay: 2 }, { p: 'P', lay: 2 }],
      trace: tip, statLabel: '팬/틸트', statVal: `${Math.round(deg1 - 90)}° / ${(ang / DEG).toFixed(0)}°`, err,
    };
  }

  if (t === 'dualWing') {
    const th1 = (deg1 + k.off1) * DEG;
    const th2 = (deg2 + k.off2) * DEG;
    const { S1, S2, PL, PR, R, Rout, L, wingLen } = k;
    const C1 = [S1[0] + R * Math.cos(th1), S1[1] + R * Math.sin(th1)];
    const C2 = [S2[0] + R * Math.cos(th2), S2[1] + R * Math.sin(th2)];
    const QL = ci(C1[0], C1[1], L, PL[0], PL[1], Rout, -1);
    const QR = ci(C2[0], C2[1], L, PR[0], PR[1], Rout, +1);
    const aL = Math.atan2(PL[1] - QL[1], PL[0] - QL[0]);
    const aR = Math.atan2(PR[1] - QR[1], PR[0] - QR[0]);
    const WL = [PL[0] + wingLen * Math.cos(aL), PL[1] + wingLen * Math.sin(aL)];
    const WR = [PR[0] + wingLen * Math.cos(aR), PR[1] + wingLen * Math.sin(aR)];
    err = Math.max(Math.abs(Math.hypot(QL[0] - C1[0], QL[1] - C1[1]) - L), Math.abs(Math.hypot(QR[0] - C2[0], QR[1] - C2[1]) - L));
    return {
      rad1: th1, rad2: th2, pts: { S1, S2, C1, C2, QL, QR, PL, PR, WL, WR },
      links: [
        { a: 'C1', b: 'QL', L, lay: 1 }, { a: 'QL', b: 'WL', L: Rout + wingLen, lay: 2 },
        { a: 'C2', b: 'QR', L, lay: 1 }, { a: 'QR', b: 'WR', L: Rout + wingLen, lay: 2 },
      ],
      pins: [
        { p: 'C1', lay: 1 }, { p: 'QL', lay: 2 }, { p: 'PL', lay: 2 },
        { p: 'C2', lay: 1 }, { p: 'QR', lay: 2 }, { p: 'PR', lay: 2 },
      ],
      trace: WR, statLabel: '좌/우 날개', statVal: `${(aL / DEG).toFixed(0)}° / ${(aR / DEG).toFixed(0)}°`, err,
    };
  }

  if (t === 'fiveBarXY' || t === 'pantograph2') {
    const { S1, S2, R, L } = k;
    const th1 = (deg1 + 25) * DEG;
    const th2 = (155 - deg2) * DEG;
    const C1 = [S1[0] + R * Math.cos(th1), S1[1] + R * Math.sin(th1)];
    const C2 = [S2[0] + R * Math.cos(th2), S2[1] + R * Math.sin(th2)];
    const E = ci(C1[0], C1[1], L, C2[0], C2[1], L, +1);
    err = Math.max(Math.abs(Math.hypot(E[0] - C1[0], E[1] - C1[1]) - L), Math.abs(Math.hypot(E[0] - C2[0], E[1] - C2[1]) - L));
    const pts = { S1, S2, C1, C2, E };
    if (t === 'pantograph2') {
      const ux = (E[0] - C1[0]) / L, uy = (E[1] - C1[1]) / L;
      const T = [C1[0] + k.Ltot * ux, C1[1] + k.Ltot * uy];
      pts.T = T;
      return {
        rad1: th1, rad2: th2, pts,
        links: [
          { a: 'S1', b: 'C1', L: R, lay: 1 }, { a: 'C1', b: 'T', L: k.Ltot, lay: 2, h0: -55 },
          { a: 'S2', b: 'C2', L: R, lay: 2 }, { a: 'C2', b: 'E', L, lay: 3 },
        ],
        pins: [{ p: 'C1', lay: 2 }, { p: 'C2', lay: 3 }, { p: 'E', lay: 3 }],
        trace: T, statLabel: '펜 좌표', statVal: `(${T[0].toFixed(0)}, ${T[1].toFixed(0)})`, err,
      };
    }
    return {
      rad1: th1, rad2: th2, pts,
      links: [
        { a: 'S1', b: 'C1', L: R, lay: 1 }, { a: 'C1', b: 'E', L, lay: 2 },
        { a: 'S2', b: 'C2', L: R, lay: 2 }, { a: 'C2', b: 'E', L, lay: 3 },
      ],
      pins: [{ p: 'C1', lay: 2 }, { p: 'C2', lay: 3 }, { p: 'E', lay: 3 }],
      trace: E, statLabel: 'XY 좌표', statVal: `(${E[0].toFixed(0)}, ${E[1].toFixed(0)})`, err,
    };
  }

  if (t === 'dualXYSlider') {
    const { S1, S2, R, L } = k;
    const th1 = (deg1 - 90) * DEG;
    const th2 = deg2 * DEG;
    const C1 = [S1[0] + R * Math.cos(th1), S1[1] + R * Math.sin(th1)];
    const X1 = [C1[0] + Math.sqrt(Math.max(0, L * L - (C1[1] - S1[1]) ** 2)), S1[1]];
    const C2 = [S2[0] + R * Math.cos(th2), S2[1] + R * Math.sin(th2)];
    const Z2 = [S2[0], C2[1] + Math.sqrt(Math.max(0, L * L - (C2[0] - S2[0]) ** 2))];
    err = Math.max(Math.abs(Math.hypot(X1[0] - C1[0], X1[1] - C1[1]) - L), Math.abs(Math.hypot(Z2[0] - C2[0], Z2[1] - C2[1]) - L));
    return {
      rad1: th1, rad2: th2, pts: { S1, S2, C1, X1, C2, Z2 },
      links: [{ a: 'C1', b: 'X1', L, lay: 1 }, { a: 'C2', b: 'Z2', L, lay: 1 }],
      pins: [{ p: 'C1', lay: 1 }, { p: 'X1', lay: 2 }, { p: 'C2', lay: 1 }, { p: 'Z2', lay: 2 }],
      sliders: [{ p: 'X1', axis: 'x', lay: 2 }, { p: 'Z2', axis: 'z', lay: 2 }],
      trace: X1, statLabel: 'X/Z 변위', statVal: `${(X1[0] - S1[0]).toFixed(0)} / ${(Z2[1] - S2[1]).toFixed(0)}`, err,
    };
  }

  if (t === 'dualOpposedSlider') {
    const { S1, S2, R, L } = k;
    const th1 = (deg1 + 90) * DEG;
    const th2 = (deg2 - 90) * DEG;
    const C1 = [S1[0] + R * Math.cos(th1), S1[1] + R * Math.sin(th1)];
    const XL = [C1[0] - Math.sqrt(Math.max(0, L * L - (C1[1] - S1[1]) ** 2)), S1[1]];
    const C2 = [S2[0] + R * Math.cos(th2), S2[1] + R * Math.sin(th2)];
    const XR = [C2[0] + Math.sqrt(Math.max(0, L * L - (C2[1] - S2[1]) ** 2)), S2[1]];
    err = Math.max(Math.abs(Math.hypot(XL[0] - C1[0], XL[1] - C1[1]) - L), Math.abs(Math.hypot(XR[0] - C2[0], XR[1] - C2[1]) - L));
    return {
      rad1: th1, rad2: th2, pts: { S1, S2, C1, XL, C2, XR },
      links: [{ a: 'C1', b: 'XL', L, lay: 1 }, { a: 'C2', b: 'XR', L, lay: 1 }],
      pins: [{ p: 'C1', lay: 1 }, { p: 'XL', lay: 2 }, { p: 'C2', lay: 1 }, { p: 'XR', lay: 2 }],
      sliders: [{ p: 'XL', axis: 'x', lay: 2 }, { p: 'XR', axis: 'x', lay: 2 }],
      trace: XR, statLabel: '양측폭', statVal: `${(XR[0] - XL[0]).toFixed(1)} mm`, err,
    };
  }

  if (t === 'scara5') {
    const { S1, S2, R1, R2, Rtab, L, L2 } = k;
    const th1 = deg1 * DEG;
    const th2 = deg2 * DEG;
    const E = [S1[0] + R1 * Math.cos(th1), S1[1] + R1 * Math.sin(th1)];
    const C2 = [S2[0] + R2 * Math.cos(th2), S2[1] + R2 * Math.sin(th2)];
    const Q = ci(E[0], E[1], Rtab, C2[0], C2[1], L, +1);
    const ang = Math.atan2(E[1] - Q[1], E[0] - Q[0]);
    const W = [E[0] + L2 * Math.cos(ang), E[1] + L2 * Math.sin(ang)];
    err = Math.max(Math.abs(Math.hypot(Q[0] - E[0], Q[1] - E[1]) - Rtab), Math.abs(Math.hypot(Q[0] - C2[0], Q[1] - C2[1]) - L));
    return {
      rad1: th1, rad2: th2, pts: { S1, S2, E, C2, Q, W },
      links: [
        { a: 'S1', b: 'E', L: R1, lay: 1 }, { a: 'Q', b: 'W', L: Rtab + L2, lay: 2 },
        { a: 'S2', b: 'C2', L: R2, lay: 2 }, { a: 'C2', b: 'Q', L, lay: 3 },
      ],
      pins: [{ p: 'E', lay: 2 }, { p: 'C2', lay: 3 }, { p: 'Q', lay: 3 }],
      trace: W, statLabel: '손목 좌표', statVal: `(${W[0].toFixed(0)}, ${W[1].toFixed(0)})`, err,
    };
  }

  if (t === 'varStroke') {
    const { S1, S2, R1, R2, L, Rout, armLen } = k;
    const th1 = (deg1 + k.off1) * DEG;
    const th2 = deg2 * DEG;
    const C1 = [S1[0] + R1 * Math.cos(th1), S1[1] + R1 * Math.sin(th1)];
    const P2 = [S2[0] + R2 * Math.cos(th2), S2[1] + R2 * Math.sin(th2)];
    const Q = ci(C1[0], C1[1], L, P2[0], P2[1], Rout, +1);
    const ang = Math.atan2(Q[1] - P2[1], Q[0] - P2[0]);
    const tip = [P2[0] + armLen * Math.cos(ang), P2[1] + armLen * Math.sin(ang)];
    err = Math.max(Math.abs(Math.hypot(Q[0] - C1[0], Q[1] - C1[1]) - L), Math.abs(Math.hypot(Q[0] - P2[0], Q[1] - P2[1]) - Rout));
    return {
      rad1: th1, rad2: th2, pts: { S1, S2, C1, P2, Q, tip },
      links: [{ a: 'C1', b: 'Q', L, lay: 1 }, { a: 'S2', b: 'P2', L: R2, lay: 1 }, { a: 'P2', b: 'tip', L: armLen, lay: 2 }],
      pins: [{ p: 'C1', lay: 1 }, { p: 'Q', lay: 2 }, { p: 'P2', lay: 2 }],
      trace: tip, statLabel: '출력각', statVal: `${(ang / DEG).toFixed(1)}°`, err,
    };
  }

  if (t === 'reachJaw') {
    const { S1, P1, S2, R, Lcar, Rjaw, Ljaw, jawTip } = k;
    const th1 = deg1 * DEG;
    const th2 = deg2 * DEG;
    const C1 = [S1[0] + R * Math.cos(th1), S1[1] + R * Math.sin(th1)];
    const Q1 = [P1[0] + R * Math.cos(th1), P1[1] + R * Math.sin(th1)];
    const M1 = [Q1[0], Q1[1] - 10];
    const C2 = [S2[0] + R * Math.cos(th2), S2[1] + R * Math.sin(th2)];
    const J = ci(M1[0], M1[1], Rjaw, C2[0], C2[1], Ljaw, +1);
    const ang = Math.atan2(J[1] - M1[1], J[0] - M1[0]);
    const JT = [M1[0] + (Rjaw + jawTip) * Math.cos(ang), M1[1] + (Rjaw + jawTip) * Math.sin(ang)];
    err = Math.max(Math.abs(Math.hypot(Q1[0] - C1[0], Q1[1] - C1[1]) - Lcar), Math.abs(Math.hypot(J[0] - C2[0], J[1] - C2[1]) - Ljaw));
    return {
      rad1: th1, rad2: th2, pts: { S1, P1, S2, C1, Q1, M1, C2, J, JT },
      links: [
        { a: 'S1', b: 'C1', L: R, lay: 1 }, { a: 'P1', b: 'Q1', L: R, lay: 1 }, { a: 'C1', b: 'Q1', L: Lcar, lay: 2 },
        { a: 'S2', b: 'C2', L: R, lay: 1 }, { a: 'C2', b: 'J', L: Ljaw, lay: 2 }, { a: 'M1', b: 'JT', L: Rjaw + jawTip, lay: 3 },
      ],
      pins: [
        { p: 'C1', lay: 2 }, { p: 'P1', lay: 1 }, { p: 'Q1', lay: 2 },
        { p: 'M1', lay: 3 }, { p: 'C2', lay: 2 }, { p: 'J', lay: 3 },
      ],
      trace: JT, statLabel: '리치/턱각', statVal: `${Q1[0].toFixed(0)}mm / ${(ang / DEG).toFixed(0)}°`, err,
    };
  }

  if (t === 'steerScissor') {
    const { S1, S2, R, Ldrv, Lbar, stages } = k;
    const th1 = deg1 * DEG;
    const th2 = deg2 * DEG;
    const B0 = [S2[0] + R * Math.cos(th2), S2[1] + R * Math.sin(th2)];
    const C1 = [S1[0] + R * Math.cos(th1), S1[1] + R * Math.sin(th1)];
    const b1dx = C1[0] - Math.sqrt(Math.max(0, Ldrv * Ldrv - C1[1] * C1[1]));
    const B1 = [b1dx - 20, 0], B1d = [b1dx, 0];
    const span = Math.hypot(B1[0] - B0[0], B1[1] - B0[1]);
    const h = Math.sqrt(Math.max(1, Lbar * Lbar - span * span));
    const ux = (B1[0] - B0[0]) / span, uy = (B1[1] - B0[1]) / span;
    const nx = -uy, ny = ux;
    const pts = { S1, S2, B0, C1, B1, B1d };
    const links = [{ a: 'S2', b: 'B0', L: R, lay: 2 }, { a: 'S1', b: 'C1', L: R, lay: 1 }, { a: 'C1', b: 'B1d', L: Ldrv, lay: 2 }];
    const pins = [{ p: 'B0', lay: 2 }, { p: 'C1', lay: 2 }, { p: 'B1d', lay: 2 }, { p: 'B1', lay: 2 }];
    for (let i = 0; i < stages; i++) {
      const l0 = `L${i}`, r0 = `R${i}`, l1 = `L${i + 1}`, r1 = `R${i + 1}`, m = `M${i}`;
      pts[l0] = [B0[0] + i * h * nx, B0[1] + i * h * ny];
      pts[r0] = [B1[0] + i * h * nx, B1[1] + i * h * ny];
      pts[l1] = [B0[0] + (i + 1) * h * nx, B0[1] + (i + 1) * h * ny];
      pts[r1] = [B1[0] + (i + 1) * h * nx, B1[1] + (i + 1) * h * ny];
      pts[m] = [B0[0] + 0.5 * span * ux + (i + 0.5) * h * nx, B0[1] + 0.5 * span * uy + (i + 0.5) * h * ny];
      links.push({ a: l0, b: r1, L: Lbar, lay: 1 }, { a: r0, b: l1, L: Lbar, lay: 2 });
      pins.push({ p: m, lay: 2 });
      if (i > 0) pins.push({ p: l0, lay: 2 }, { p: r0, lay: 2 });
    }
    const tip = [B0[0] + 0.5 * span * ux + stages * h * nx, B0[1] + 0.5 * span * uy + stages * h * ny];
    pts.tip = tip;
    return {
      rad1: th1, rad2: th2, pts, links, pins, sliders: [{ p: 'B1', axis: 'x', lay: 1, off: 10 }],
      trace: tip, statLabel: '팁 좌표', statVal: `(${tip[0].toFixed(0)}, ${tip[1].toFixed(0)})`,
      err: Math.abs(Math.hypot(B1d[0] - C1[0], B1d[1] - C1[1]) - Ldrv),
    };
  }

  if (t === 'fiveBarLeg') {
    const { S1, S2, R, L, Ltot } = k;
    const th1 = (-180 + deg1) * DEG;
    const th2 = (-deg2) * DEG;
    const C1 = [S1[0] + R * Math.cos(th1), S1[1] + R * Math.sin(th1)];
    const C2 = [S2[0] + R * Math.cos(th2), S2[1] + R * Math.sin(th2)];
    const K = ci(C1[0], C1[1], L, C2[0], C2[1], L, -1);
    const ux = (K[0] - C1[0]) / L, uy = (K[1] - C1[1]) / L;
    const F = [C1[0] + Ltot * ux, C1[1] + Ltot * uy];
    err = Math.max(Math.abs(Math.hypot(K[0] - C1[0], K[1] - C1[1]) - L), Math.abs(Math.hypot(K[0] - C2[0], K[1] - C2[1]) - L));
    return {
      rad1: th1, rad2: th2, pts: { S1, S2, C1, C2, K, F },
      links: [
        { a: 'S1', b: 'C1', L: R, lay: 1 }, { a: 'C1', b: 'F', L: Ltot, lay: 2 },
        { a: 'S2', b: 'C2', L: R, lay: 2 }, { a: 'C2', b: 'K', L, lay: 3 },
      ],
      pins: [{ p: 'C1', lay: 2 }, { p: 'C2', lay: 3 }, { p: 'K', lay: 3 }],
      trace: F, statLabel: '발끝 위치', statVal: `(${F[0].toFixed(0)}, ${F[1].toFixed(0)})`, err,
    };
  }

  if (t === 'dualWalk2') {
    const { S1, S2, P1, P2, R, Rout, Lc, Ltot } = k;
    const th1 = (deg1 + k.off1) * DEG;
    const th2 = (deg2 + k.off2) * DEG;
    const C1 = [S1[0] + R * Math.cos(th1), S1[1] + R * Math.sin(th1)];
    const C2 = [S2[0] + R * Math.cos(th2), S2[1] + R * Math.sin(th2)];
    const QL = ci(C1[0], C1[1], Lc, P1[0], P1[1], Rout, +1);
    const QR = ci(C2[0], C2[1], Lc, P2[0], P2[1], Rout, -1);
    const uLx = (QL[0] - C1[0]) / Lc, uLy = (QL[1] - C1[1]) / Lc;
    const uRx = (QR[0] - C2[0]) / Lc, uRy = (QR[1] - C2[1]) / Lc;
    const FL = [C1[0] + Ltot * uLx, C1[1] + Ltot * uLy];
    const FR = [C2[0] + Ltot * uRx, C2[1] + Ltot * uRy];
    err = Math.max(Math.abs(Math.hypot(QL[0] - C1[0], QL[1] - C1[1]) - Lc), Math.abs(Math.hypot(QR[0] - C2[0], QR[1] - C2[1]) - Lc));
    return {
      rad1: th1, rad2: th2, pts: { S1, S2, C1, C2, QL, QR, P1, P2, FL, FR },
      links: [
        { a: 'C1', b: 'FL', L: Ltot, lay: 1 }, { a: 'P1', b: 'QL', L: Rout, lay: 2 },
        { a: 'C2', b: 'FR', L: Ltot, lay: 1 }, { a: 'P2', b: 'QR', L: Rout, lay: 2 },
      ],
      pins: [
        { p: 'C1', lay: 1 }, { p: 'QL', lay: 2 }, { p: 'P1', lay: 2 },
        { p: 'C2', lay: 1 }, { p: 'QR', lay: 2 }, { p: 'P2', lay: 2 },
      ],
      trace: FR, statLabel: '좌/우 발높이', statVal: `${FL[1].toFixed(0)} / ${FR[1].toFixed(0)} mm`, err,
    };
  }

  if (t === 'excavator6') {
    const { S1, S2, P1, R, Rtab, Ldrv, Lboom, Lsec, Rsc } = k;
    const th1 = (deg1 + k.off1) * DEG;
    const th2 = deg2 * DEG;
    const C1 = [S1[0] + R * Math.cos(th1), S1[1] + R * Math.sin(th1)];
    const Q = ci(C1[0], C1[1], Ldrv, P1[0], P1[1], Rtab, -1);
    const ba = Math.atan2(Q[1] - P1[1], Q[0] - P1[0]);
    const tip = [P1[0] + Lboom * Math.cos(ba), P1[1] + Lboom * Math.sin(ba)];
    const C2 = [S2[0] + R * Math.cos(th2), S2[1] + R * Math.sin(th2)];
    const K1 = ci(tip[0], tip[1], Rsc, C2[0], C2[1], Lsec, +1);
    const K2 = ci(tip[0], tip[1], Rsc, C2[0], C2[1], Lsec, -1);
    const K = K1[1] > K2[1] ? K1 : K2;
    const sa = Math.atan2(tip[1] - K[1], tip[0] - K[0]);
    const lip = [tip[0] + 20 * Math.cos(sa), tip[1] + 20 * Math.sin(sa)];
    err = Math.max(Math.abs(Math.hypot(Q[0] - C1[0], Q[1] - C1[1]) - Ldrv), Math.abs(Math.hypot(K[0] - C2[0], K[1] - C2[1]) - Lsec));
    return {
      rad1: th1, rad2: th2, pts: { S1, S2, C1, C2, Q, P1, tip, K, lip },
      links: [
        { a: 'C1', b: 'Q', L: Ldrv, lay: 1 },
        { a: 'P1', b: 'tip', L: Lboom, lay: 2 },
        { a: 'S2', b: 'C2', L: 20, lay: 1, h0: 0 },
        { a: 'C2', b: 'K', L: Lsec, lay: 2 },
        { a: 'K', b: 'lip', L: Rsc + 20, lay: 1 },
      ],
      pins: [
        { p: 'C1', lay: 1 }, { p: 'Q', lay: 2 }, { p: 'P1', lay: 2 },
        { p: 'C2', lay: 2 }, { p: 'K', lay: 2 }, { p: 'tip', lay: 2 },
      ],
      trace: lip, statLabel: '붐/버킷각', statVal: `${(ba / DEG).toFixed(0)}° / ${(sa / DEG).toFixed(0)}°`, err,
    };
  }

  if (t === 'dualWedge') {
    const solveSide = (deg) => {
      const lift = (deg / 180) * k.maxLift;
      const ang = (lift - k.restDeg) * DEG;
      const tz = k.PZ - k.tabU * Math.cos(ang) + k.tabV * Math.sin(ang);
      const ty = k.PY + k.tabU * Math.sin(ang) + k.tabV * Math.cos(ang);
      const dz = tz - k.SZ, dy = ty - k.SY;
      const d = Math.hypot(dz, dy);
      const ca = Math.max(-1, Math.min(1, (k.R * k.R + d * d - k.L * k.L) / (2 * k.R * d)));
      const crankRad = Math.atan2(dy, dz) - Math.acos(ca);
      const cz = k.SZ + k.R * Math.cos(crankRad), cy = k.SY + k.R * Math.sin(crankRad);
      return { lift, ang, tz, ty, cz, cy, crankRad, ux: (cz - tz) / k.L, uy: (cy - ty) / k.L, err: Math.abs(Math.hypot(cz - tz, cy - ty) - k.L) };
    };
    const L = solveSide(deg1);
    const R = solveSide(deg2);
    return { L, R, statLabel: '좌/우 웨지', statVal: `${L.lift.toFixed(1)}° / ${R.lift.toFixed(1)}°`, err: Math.max(L.err, R.err) };
  }

  throw new Error(`Unknown dual mech type: ${t}`);
}

function buildDualRig(spec, mods) {
  const root = new THREE.Group();
  const hingePivots = [];
  for (const p of spec.staticParts) {
    const { g, handles } = makePart(mods, p.id, p.o, p.xdir, p.up, p.length);
    if (p.id === 'hinge-3x3' && handles?.pivot) hingePivots.push({ x: p.o[0], pv: handles.pivot });
    root.add(g);
  }

  const rig = spec.rig;
  const k = spec.kin;
  const rRest = solveDualMech(spec, spec.rest1, spec.rest2);

  // 특수 리그 1: D02 2축 팬-틸트 짐벌 (3D 공간 Yaw × Pitch)
  if (rig === 'V_PANTILT') {
    const panPivot = new THREE.Group();
    panPivot.position.set(0, 53.2, 0);
    root.add(panPivot);

    // Hole A 가이드라인 고정 소7 + 중6 + L자 2×2 × 2 + 수직 벽(frame-main-pcb) + 서보 2 + 틸트 4절
    panPivot.add(
      makePart(mods, 'motor-guide', [-5, -2.8, 0], [-1, 0, 0], [0, 1, 0]).g,
      makePart(mods, 'frame-s7-pcb', [0, 0, 0], [1, 0, 0], [0, 1, 0]).g,
      makePart(mods, 'bolt-m26x10', [0, -8.4, 0], null, [0, 1, 0]).g,
      makePart(mods, 'frame-m6-pcb', [5, 1.6, 5], [1, 0, 0], [0, 1, 0]).g,
    );
    // 소7 + 중6 체결 (x=+10만 단독, x=±20은 L자 2×2와 통합 체결 · x=-10은 motor-guide 회피)
    panPivot.add(
      makePart(mods, 'bolt-m3x6', [10, -2.8, 0], null, [0, 1, 0]).g,
      makePart(mods, 'nut-m3', [10, -2.4, 0], null, [0, 1, 0]).g,
    );
    for (const lx of [-20, 20]) {
      panPivot.add(
        makePart(mods, 'l-frame-2x2', [lx, 3.2, -5.0], [0, 0, -1], [0, 1, 0]).g,
        // z=0: 소7(0..1.6) + 중6(1.6..3.2) + L자(3.2..4.2) = 4.2mm → 너트 y=-2.4..0.0
        makePart(mods, 'bolt-m3x6', [lx, -1.8, 0], null, [0, 1, 0]).g,
        makePart(mods, 'nut-m3', [lx, -2.4, 0], null, [0, 1, 0]).g,
        // z=10: 중6(1.6..3.2) + L자(3.2..4.2) = 2.6mm → 너트 y=-0.8..1.6
        makePart(mods, 'bolt-m3x6', [lx, -1.8, 10], null, [0, 1, 0]).g,
        makePart(mods, 'nut-m3', [lx, -0.8, 10], null, [0, 1, 0]).g,
      );
      for (const by of [8.2, 18.2]) {
        // 수직벽(-6.6..-5.0) + L자(-5.0..-4.0): 헤드 z=-4.0, up=(0,0,1), 너트 z=-9.0..-6.6
        panPivot.add(
          makePart(mods, 'bolt-m3x6', [lx, by, -10.0], null, [0, 0, 1]).g,
          makePart(mods, 'nut-m3', [lx, by, -9.0], null, [0, 0, 1]).g,
        );
      }
    }
    panPivot.add(makePart(mods, 'frame-main-pcb', [5, 43.2, -6.6], [1, 0, 0], [0, 0, 1]).g);
    // 서보 2 (틸트 OUT2) 수직 벽에 장착: shaft=(0, 30, -53.2), xdir=(0,1,0) → body=(0, 40, -10.0)
    for (const ey of [15.0, 65.0]) {
      for (const ex of [-5.0, 5.0]) {
        panPivot.add(
          makePart(mods, 'support-spacer', [ex, ey, -6.6], null, [0, 0, -1], 25).g,
          makePart(mods, 'bolt-m3x6', [ex, ey, -11.0], null, [0, 0, 1]).g,
          makePart(mods, 'nut-m3', [ex, ey, -34.0], null, [0, 0, -1]).g,
        );
      }
    }
    panPivot.add(makePart(mods, 'servo-digital', [0, 40.0, -10.0], [0, 1, 0], [0, 0, -1]).g);
    // 틸트 출력 피벗 받침 P=(0, 70): Q(+X측) 회피해 ax=-20에 배치
    for (const ey of [60.0, 80.0]) {
      panPivot.add(
        makePart(mods, 'support-spacer', [-20, ey, -6.6], null, [0, 0, -1], 25).g,
        makePart(mods, 'bolt-m3x6', [-20, ey, -11.0], null, [0, 0, 1]).g,
        makePart(mods, 'support-spacer', [-20, ey, -31.6], null, [0, 0, -1], 20).g,
        makePart(mods, 'nut-m3', [-20, ey, -53.2], null, [0, 0, -1]).g,
      );
    }
    panPivot.add(
      makePart(mods, 'frame-s3-pcb', [-20, 70, -51.6], [0, 1, 0], [0, 0, -1]).g,
      makePart(mods, 'frame-s3-pcb', [-10, 70, -53.2], [1, 0, 0], [0, 0, -1]).g,
      makePart(mods, 'bolt-m3x6', [-20, 70, -48.8], null, [0, 0, -1]).g,
      makePart(mods, 'nut-m3', [-20, 70, -49.2], null, [0, 0, -1]).g,
    );

    const crank2 = new THREE.Group();
    crank2.position.set(k.S2[0], k.S2[1], -53.2);
    panPivot.add(crank2);
    crank2.add(
      makePart(mods, 'motor-guide', [5, 0, 2.8], [1, 0, 0], [0, 0, -1]).g,
      makePart(mods, 'bolt-m26x10', [0, 0, 10.0], null, [0, 0, -1]).g,
    );

    const linkObjs = rRest.links.map((lk) => {
      const bs = barSpecFor(lk.L);
      const { g } = makePart(mods, bs.id, [0, 0, 0], [1, 0, 0], [0, 1, 0]);
      panPivot.add(g);
      return { g, lk, h0: lk.h0 ?? bs.h0 };
    });
    const pinObjs = rRest.pins.map((pn) => {
      const { g } = makePart(mods, 's-hook-35', [0, 0, 0], null, [0, 1, 0]);
      panPivot.add(g);
      return { g, pn };
    });
    const headGrab = makePart(mods, 'grab', [0, 0, 0], [1, 0, 0], [0, 1, 0]).g;
    panPivot.add(headGrab);

    const setAngles = (d1, d2) => {
      const r = solveDualMech(spec, d1, d2);
      panPivot.rotation.y = -r.panRad;
      crank2.rotation.z = r.rad2;
      for (let i = 0; i < linkObjs.length; i++) {
        const { g, h0 } = linkObjs[i];
        const lk = r.links[i];
        placeLink2D(g, r.pts[lk.a], r.pts[lk.b], 'V', lk.lay, h0, 6.6);
      }
      for (let i = 0; i < pinObjs.length; i++) {
        const pn = r.pins[i];
        placeHook2D(pinObjs[i].g, r.pts[pn.p], 'V', pn.lay, 6.6);
      }
      headGrab.position.set(r.pts.tip[0] + 2, r.pts.tip[1], -54.0);
      setBasis(headGrab, [0, 1, 0], [1, 0, 0]);
      return r;
    };
    setAngles(spec.rest1, spec.rest2);
    return { root, setAngles };
  }

  // 특수 리그 2: D15 2축 독립 배틀 웨지 (좌·우 각 frame-half-pcb + hinge-3x3 + motor-guide Hole B)
  if (rig === 'V_DUAL_WEDGE') {
    const restA = k.restDeg * DEG;
    const ca = Math.cos(restA), sa = Math.sin(restA);
    const wUp = [0, ca, -sa], wX = [1, 0, 0];
    const wPt = (x, u, v) => [x, -u * sa + v * ca, -u * ca - v * sa];

    const makeWedgeSide = (sign) => {
      const lx = sign * k.linkX;
      const wp = new THREE.Group();
      wp.position.set(0, k.PY, k.PZ);
      root.add(wp);
      wp.add(
        makePart(mods, 'frame-half-pcb', wPt(sign * 35, 45, -2.0), wX, wUp).g,
        makePart(mods, 'motor-frame-3x3', wPt(lx, k.tabU, -0.4), [sign, 0, 0], wUp).g,
        makePart(mods, 's-hook-35', wPt(lx + sign * 1.6, k.tabU, k.tabV), null, [sign, 0, 0]).g,
      );
      const cp = new THREE.Group();
      cp.position.set(lx, k.SY, k.SZ);
      root.add(cp);
      cp.add(
        makePart(mods, 'motor-guide', [-sign * 2.8, 0, 5.0], [0, 0, 1], [sign, 0, 0]).g,
        makePart(mods, 'bolt-m26x10', [-sign * 10.0, 0, 0], null, [sign, 0, 0]).g,
        makePart(mods, 's-hook-35', [sign * 1.6, 0, k.R], null, [sign, 0, 0]).g,
      );
      const coupler = makePart(mods, 'frame-s8-pcb', [lx, 0, 0], [0, 0, 1], [sign, 0, 0]).g;
      root.add(coupler);
      return { wp, cp, coupler, sign, lx };
    };

    const sideL = makeWedgeSide(-1);
    const sideR = makeWedgeSide(+1);

    const setAngles = (d1, d2) => {
      const r = solveDualMech(spec, d1, d2);
      const apply = (sd, st) => {
        sd.wp.rotation.x = st.lift * DEG;
        sd.cp.rotation.x = -st.crankRad;
        sd.coupler.position.set(sd.lx, st.ty + 35 * st.uy, st.tz + 35 * st.ux);
        setBasis(sd.coupler, [0, st.uy, st.ux], [sd.sign, 0, 0]);
      };
      apply(sideL, r.L);
      apply(sideR, r.R);
      for (const h of hingePivots) {
        h.pv.rotation.z = ((h.x < 0 ? r.L.lift : r.R.lift) - k.restDeg) * DEG;
      }
      return r;
    };
    setAngles(spec.rest1, spec.rest2);
    return { root, setAngles };
  }

  // 공통 수평(H) / 수직(V) 2서보 크랭크 허브 (100% motor-guide 전용!)
  const outUp = cpUp(rig, true);
  const xPos = [1, 0, 0], xNeg = [-1, 0, 0];
  const makeHub = (S, sk, shim) => {
    const off = 1.6 * (shim || 0);
    const pivot = new THREE.Group();
    pivot.position.set(S[0], rig === 'H' ? 53.2 + off : S[1], rig === 'H' ? S[1] : -46.6 - off);
    root.add(pivot);
    const hasBar = rRest.links.some((lk) => lk.a === sk);
    const boltOff = hasBar ? -8.4 : -10.0;
    pivot.add(
      makePart(mods, 'motor-guide', cpPt(rig, hasBar ? -5.0 : 5.0, -2.8), hasBar ? xNeg : xPos, outUp).g,
      makePart(mods, 'bolt-m26x10', cpPt(rig, 0.0, boltOff), null, outUp).g,
    );
    return pivot;
  };
  const crank1 = makeHub(k.S1, 'S1', k.shim1);
  const crank2 = makeHub(k.S2, 'S2', k.shim2);

  // 2D 리사주 궤적 가이드라인
  const trajPts = [];
  const [lo1, hi1] = spec.range1, [lo2, hi2] = spec.range2;
  for (let i = 0; i <= 60; i++) {
    const u = (i / 60) * Math.PI * 2;
    const d1 = (lo1 + hi1) / 2 + ((hi1 - lo1) / 2) * Math.sin(u);
    const d2 = (lo2 + hi2) / 2 + ((hi2 - lo2) / 2) * Math.sin(2 * u);
    const r = solveDualMech(spec, d1, d2);
    if (r.trace) {
      trajPts.push(rig === 'H' ? new THREE.Vector3(r.trace[0], 60.5, r.trace[1]) : new THREE.Vector3(r.trace[0], r.trace[1], -53.5));
    }
  }
  const tierCol = { 1: 0x2f6fe0, 2: 0x1f9d60, 3: 0xe87a1e, 4: 0x8b46d9, 5: 0xe03636 }[spec.tier] || 0x2f6fe0;
  if (trajPts.length >= 2) {
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(trajPts), new THREE.LineBasicMaterial({ color: tierCol, transparent: true, opacity: 0.85 })));
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

  const sliderObjs = (rRest.sliders || []).map((sl) => {
    const xdir = sl.axis === 'z' ? [0, 0, 1] : [1, 0, 0];
    const { g } = makePart(mods, 'frame-s3-pcb', [0, 0, 0], xdir, [0, 1, 0]);
    root.add(g);
    return { g, sl };
  });

  let scoopGrab = null;
  if (k.type === 'excavator6') {
    scoopGrab = makePart(mods, 'grab', [0, 0, 0], [1, 0, 0], [0, 1, 0]).g;
    root.add(scoopGrab);
  }

  const setAngles = (d1, d2) => {
    const r = solveDualMech(spec, d1, d2);
    if (rig === 'H') {
      crank1.rotation.y = -r.rad1;
      crank2.rotation.y = -r.rad2;
    } else {
      crank1.rotation.z = r.rad1;
      crank2.rotation.z = r.rad2;
    }
    for (let i = 0; i < linkObjs.length; i++) {
      const { g, h0 } = linkObjs[i];
      const lk = r.links[i];
      placeLink2D(g, r.pts[lk.a], r.pts[lk.b], rig, lk.lay, h0);
    }
    for (let i = 0; i < pinObjs.length; i++) {
      const pn = r.pins[i];
      placeHook2D(pinObjs[i].g, r.pts[pn.p], rig, pn.lay);
    }
    for (let i = 0; i < sliderObjs.length; i++) {
      const { g, sl } = sliderObjs[i];
      const pt = r.pts[sl.p];
      const y = 53.2 + 1.6 * ((sl.lay ?? 2) - 1);
      const off = sl.off || 0;
      if (sl.axis === 'z') g.position.set(pt[0], y, pt[1] + off);
      else g.position.set(pt[0] + off, y, pt[1]);
    }
    if (scoopGrab && r.pts.lip) {
      scoopGrab.position.set(r.pts.lip[0] + 2, r.pts.lip[1], -47.4);
      setBasis(scoopGrab, [0, 1, 0], [1, 0, 0]);
    }
    return r;
  };

  setAngles(spec.rest1, spec.rest2);
  return { root, setAngles };
}

export async function buildDualServoLab(loadPart, onProgress, opts = {}) {
  const partIds = opts.partIds || DUAL_SERVO_PART_IDS;
  const specs = opts.filter ? DUAL_MECHS.filter(opts.filter) : DUAL_MECHS;
  const mods = {};
  for (let i = 0; i < partIds.length; i++) {
    const id = partIds[i];
    mods[id] = await loadPart(id);
    if (onProgress) onProgress((i + 1) / partIds.length);
  }

  const root = new THREE.Group();
  const rigs = {};
  for (const sp of specs) {
    const rig = buildDualRig(sp, mods);
    rig.root.visible = false;
    root.add(rig.root);
    rigs[sp.code] = rig;
  }

  let activeCode = opts.initialCode || specs[0].code;
  let deg1 = DUAL_BY_CODE[activeCode].rest1;
  let deg2 = DUAL_BY_CODE[activeCode].rest2;
  let lastResult = null;

  function select(code) {
    if (!rigs[code]) return null;
    for (const [c, r] of Object.entries(rigs)) r.root.visible = (c === code);
    activeCode = code;
    const sp = DUAL_BY_CODE[code];
    deg1 = sp.rest1;
    deg2 = sp.rest2;
    lastResult = rigs[code].setAngles(deg1, deg2);
    return sp;
  }

  function setAngles(d1, d2) {
    const sp = DUAL_BY_CODE[activeCode];
    deg1 = Math.max(sp.range1[0], Math.min(sp.range1[1], d1));
    deg2 = Math.max(sp.range2[0], Math.min(sp.range2[1], d2));
    lastResult = rigs[activeCode].setAngles(deg1, deg2);
    return lastResult;
  }

  select(activeCode);
  return {
    root, rigs, select, setAngles,
    getActive: () => ({ spec: DUAL_BY_CODE[activeCode], deg1, deg2, res: lastResult }),
    count: specs.length,
  };
}
