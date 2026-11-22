import * as THREE from 'three';
import { MECHS, MECH_BY_CODE } from './catalog.js';

// 서보 가이드 15종(M01~M15) + DC 모터 휠 가이드 15종(W01~W15) = 총 30종 실시간 3D 기구학 엔진
const DEG = Math.PI / 180;
const UP_Y = new THREE.Vector3(0, 1, 0);

export const MECHLAB_PART_IDS = [
  'frame-big-main', 'frame-main-pcb', 'frame-m6-pcb',
  'frame-s3-pcb', 'frame-s4-pcb', 'frame-s5-pcb', 'frame-s7-pcb', 'frame-s8-pcb', 'frame-s12-pcb',
  'motor-frame-3x3', 'l-frame-2x2', 'hinge-3x3',
  'axle-guide', 'shaft-75', 'support-spacer',
  'servo-digital', 'dc-motor-130-rs',
  'wheel-guide-30-servo', 'wheel-guide-30-nylon', 'wheel-guide-40-yellow',
  's-hook-35', 'battle-g', 'grab', 'caterpillar-sprocket',
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
  if (L <= 50.1) return { id: 'frame-s7-pcb', h0: -25, h1: 25 };
  if (L <= 60.1) return { id: 'frame-s7-pcb', h0: -30, h1: 30 };
  if (L <= 70.1) return { id: 'frame-s8-pcb', h0: -35, h1: 35 };
  if (L <= 80.1) return { id: 'frame-s12-pcb', h0: -45, h1: 35 };
  if (L <= 90.1) return { id: 'frame-s12-pcb', h0: -45, h1: 45 };
  return { id: 'frame-s12-pcb', h0: -55, h1: 55 };
}

function placeLink2D(holder, pA, pB, rig, layer, h0) {
  const du = pB[0] - pA[0], dv = pB[1] - pA[1];
  const len = Math.hypot(du, dv) || 1;
  const uu = du / len, uv = dv / len;
  const midU = pA[0] - h0 * uu;
  const midV = pA[1] - h0 * uv;
  if (rig === 'H') {
    holder.position.set(midU, 51.6 + 1.6 * (layer - 1), midV);
    setBasis(holder, [uu, 0, uv], [0, 1, 0]);
  } else {
    holder.position.set(midU, midV, -40.0 - 1.6 * (layer - 1));
    setBasis(holder, [uu, uv, 0], [0, 0, -1]);
  }
}

function placeHook2D(holder, pt, rig, topLayer) {
  if (rig === 'H') {
    holder.position.set(pt[0], 51.6 + 1.6 * topLayer, pt[1]);
    holder.quaternion.identity();
  } else {
    holder.position.set(pt[0], pt[1], -40.0 - 1.6 * topLayer);
    setBasis(holder, [1, 0, 0], [0, 0, -1]);
  }
}

export function solveMech(spec, deg) {
  const k = spec.kin;
  const t = k.type;
  const th = deg * DEG;
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
    return {
      crankRad: th, pts: { S, C, Q, P, M },
      links: [{ a: 'C', b: 'Q', L, lay: 1 }, { a: 'P', b: 'Q', L: 20, lay: 2, h0: 0, h1: 10 }],
      pins: [{ p: 'C', lay: 1 }, { p: 'Q', lay: 2 }, { p: 'P', lay: 2 }],
      trace: M, statLabel: '수평오차', statVal: '0.0°', err: Math.abs(Math.hypot(Q[0] - C[0], Q[1] - C[1]) - L),
    };
  }

  if (t === 'dualGripper' || t === 'parallelGripper') {
    const { S, PL, PR, R, Rout, L, jawLen } = k;
    const C1 = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const C2 = [S[0] - R * Math.cos(th), S[1] - R * Math.sin(th)];
    const QL = ci(C1[0], C1[1], L, PL[0], PL[1], Rout, -1);
    const QR = ci(C2[0], C2[1], L, PR[0], PR[1], Rout, +1);
    const aL = Math.atan2(QL[1] - PL[1], QL[0] - PL[0]) + Math.PI;
    const aR = Math.atan2(QR[1] - PR[1], QR[0] - PR[0]) + Math.PI;
    const JL = [PL[0] + jawLen * Math.cos(aL), PL[1] + jawLen * Math.sin(aL)];
    const JR = [PR[0] + jawLen * Math.cos(aR), PR[1] + jawLen * Math.sin(aR)];
    const pts = { S, C1, C2, QL, QR, PL, PR, JL, JR };
    const links = [
      { a: 'C1', b: 'QL', L, lay: 1 }, { a: 'C2', b: 'QR', L, lay: 1 },
      { a: 'QL', b: 'JL', L: Rout + jawLen, lay: 2 }, { a: 'QR', b: 'JR', L: Rout + jawLen, lay: 2 },
    ];
    const pins = [{ p: 'C1', lay: 1 }, { p: 'C2', lay: 1 }, { p: 'QL', lay: 2 }, { p: 'QR', lay: 2 }, { p: 'PL', lay: 2 }, { p: 'PR', lay: 2 }];
    if (t === 'parallelGripper') {
      const dx = k.parDx;
      pts.PL2 = [PL[0] - dx, PL[1]]; pts.PR2 = [PR[0] + dx, PR[1]];
      pts.JL2 = [JL[0] - dx, JL[1]]; pts.JR2 = [JR[0] + dx, JR[1]];
      links.push({ a: 'PL2', b: 'JL2', L: jawLen, lay: 2 }, { a: 'PR2', b: 'JR2', L: jawLen, lay: 2 }, { a: 'JL', b: 'JL2', L: dx, lay: 3 }, { a: 'JR', b: 'JR2', L: dx, lay: 3 });
      pins.push({ p: 'PL2', lay: 2 }, { p: 'PR2', lay: 2 }, { p: 'JL', lay: 3 }, { p: 'JR', lay: 3 });
    }
    return {
      crankRad: th, pts, links, pins, trace: JR,
      statLabel: '집게간격', statVal: `${Math.hypot(JR[0] - JL[0], JR[1] - JL[1]).toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(QL[0] - C1[0], QL[1] - C1[1]) - L), Math.abs(Math.hypot(QR[0] - C2[0], QR[1] - C2[1]) - L)),
    };
  }

  if (t === 'flappingWing') {
    const { S, PL, PR, R, Rout, L, wingLen } = k;
    const C1 = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const C2 = [S[0] - R * Math.cos(th), S[1] - R * Math.sin(th)];
    const QL = ci(C1[0], C1[1], L, PL[0], PL[1], Rout, +1);
    const QR = ci(C2[0], C2[1], L, PR[0], PR[1], Rout, -1);
    const aL = Math.atan2(QL[1] - PL[1], QL[0] - PL[0]) - Math.PI / 2;
    const aR = Math.atan2(QR[1] - PR[1], QR[0] - PR[0]) + Math.PI / 2;
    const WL = [PL[0] + wingLen * Math.cos(aL), PL[1] + wingLen * Math.sin(aL)];
    const WR = [PR[0] + wingLen * Math.cos(aR), PR[1] + wingLen * Math.sin(aR)];
    return {
      crankRad: th, pts: { S, C1, C2, QL, QR, PL, PR, WL, WR },
      links: [
        { a: 'C1', b: 'QL', L, lay: 1 }, { a: 'C2', b: 'QR', L, lay: 1 },
        { a: 'PL', b: 'QL', L: Rout, lay: 2 }, { a: 'PR', b: 'QR', L: Rout, lay: 2 },
        { a: 'PL', b: 'WL', L: wingLen, lay: 3 }, { a: 'PR', b: 'WR', L: wingLen, lay: 3 },
      ],
      pins: [{ p: 'C1', lay: 1 }, { p: 'C2', lay: 1 }, { p: 'QL', lay: 2 }, { p: 'QR', lay: 2 }, { p: 'PL', lay: 3 }, { p: 'PR', lay: 3 }],
      trace: WR, statLabel: '날개각', statVal: `${(aR / DEG).toFixed(1)}°`,
      err: Math.max(Math.abs(Math.hypot(QL[0] - C1[0], QL[1] - C1[1]) - L), Math.abs(Math.hypot(QR[0] - C2[0], QR[1] - C2[1]) - L)),
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
      links: [{ a: 'C', b: 'X', L, lay: 1 }],
      pins: [{ p: 'C', lay: 1 }, { p: 'X', lay: 2 }],
      sliders: [{ p: 'X', axis: 'x' }],
      trace: X, statLabel: t === 'offsetSlider' ? '급속귀환' : '변위', statVal: `${(sx - S[0]).toFixed(1)} mm`,
      err: Math.abs(Math.hypot(X[0] - C[0], X[1] - C[1]) - L),
    };
  }

  if (t === 'dualSlider') {
    const { S, R, L } = k;
    const C1 = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const C2 = [S[0] - R * Math.cos(th), S[1] - R * Math.sin(th)];
    const xR = C1[0] + Math.sqrt(Math.max(0, L * L - (C1[1] - S[1]) ** 2));
    const xL = C2[0] - Math.sqrt(Math.max(0, L * L - (C2[1] - S[1]) ** 2));
    const XR = [xR, S[1]], XL = [xL, S[1]];
    return {
      crankRad: th, pts: { S, C1, C2, XR, XL },
      links: [{ a: 'C1', b: 'XR', L, lay: 1 }, { a: 'C2', b: 'XL', L, lay: 1 }],
      pins: [{ p: 'C1', lay: 1 }, { p: 'C2', lay: 1 }, { p: 'XR', lay: 2 }, { p: 'XL', lay: 2 }],
      sliders: [{ p: 'XR', axis: 'x' }, { p: 'XL', axis: 'x' }],
      trace: XR, statLabel: '양측폭', statVal: `${(xR - xL).toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(XR[0] - C1[0], XR[1] - C1[1]) - L), Math.abs(Math.hypot(XL[0] - C2[0], XL[1] - C2[1]) - L)),
    };
  }

  if (t === 'vTwin90') {
    const { S, R, L } = k;
    const CX = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const CZ = [S[0] + R * Math.cos(th - Math.PI / 2), S[1] + R * Math.sin(th - Math.PI / 2)];
    const XX = [CX[0] + Math.sqrt(Math.max(0, L * L - (CX[1] - S[1]) ** 2)), S[1]];
    const XZ = [S[0], CZ[1] + Math.sqrt(Math.max(0, L * L - (CZ[0] - S[0]) ** 2))];
    return {
      crankRad: th, pts: { S, CX, CZ, XX, XZ },
      links: [{ a: 'CX', b: 'XX', L, lay: 1 }, { a: 'CZ', b: 'XZ', L, lay: 2 }],
      pins: [{ p: 'CX', lay: 1 }, { p: 'CZ', lay: 2 }, { p: 'XX', lay: 2 }, { p: 'XZ', lay: 2 }],
      sliders: [{ p: 'XX', axis: 'x' }, { p: 'XZ', axis: 'z' }],
      trace: XX, statLabel: 'X/Z행정', statVal: `${(XX[0] - S[0]).toFixed(0)}/${(XZ[1] - S[1]).toFixed(0)}`,
      err: Math.max(Math.abs(Math.hypot(XX[0] - CX[0], XX[1] - CX[1]) - L), Math.abs(Math.hypot(XZ[0] - CZ[0], XZ[1] - CZ[1]) - L)),
    };
  }

  if (t === 'dragLink') {
    const { S, P, R1, R2, L } = k;
    const C = [S[0] + R1 * Math.cos(th), S[1] + R1 * Math.sin(th)];
    const Q = ci(C[0], C[1], L, P[0], P[1], R2, +1);
    const outA = Math.atan2(Q[1] - P[1], Q[0] - P[0]);
    return {
      crankRad: th, pts: { S, C, Q, P },
      links: [{ a: 'S', b: 'C', L: R1, lay: 1 }, { a: 'C', b: 'Q', L, lay: 2 }, { a: 'P', b: 'Q', L: R2, lay: 1 }],
      pins: [{ p: 'C', lay: 2 }, { p: 'Q', lay: 2 }, { p: 'P', lay: 2 }],
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
    const { S, P, R, L1, L2, L3, railZ } = k;
    const rad = (deg - 90) * DEG;
    const C = [S[0] + R * Math.cos(rad), S[1] + R * Math.sin(rad)];
    const K = ci(P[0], P[1], L2, C[0], C[1], L1, +1);
    const xS = K[0] + Math.sqrt(Math.max(0, L3 * L3 - (K[1] - railZ) ** 2));
    const X = [xS, railZ];
    const oc = K[1] - railZ;
    return {
      crankRad: rad, pts: { S, P, C, K, X },
      links: [{ a: 'C', b: 'K', L: L1, lay: 1 }, { a: 'P', b: 'K', L: L2, lay: 2 }, { a: 'K', b: 'X', L: L3, lay: 3 }],
      pins: [{ p: 'C', lay: 1 }, { p: 'K', lay: 3 }, { p: 'P', lay: 2 }, { p: 'X', lay: 3 }],
      sliders: [{ p: 'X', axis: 'x' }],
      trace: X, statLabel: oc >= 0 ? '잠금상태' : '클램프', statVal: oc >= 0 ? `잠김(+${oc.toFixed(1)})` : `${xS.toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(K[0] - C[0], K[1] - C[1]) - L1), Math.abs(Math.hypot(K[0] - P[0], K[1] - P[1]) - L2), Math.abs(Math.hypot(X[0] - K[0], X[1] - K[1]) - L3)),
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
      pins: [{ p: 'A', lay: 2 }, { p: 'B', lay: 2 }, { p: 'P', lay: 2 }, { p: 'M', lay: 2 }],
      trace: M, statLabel: '직선Z', statVal: `${M[1].toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(B[0] - A[0], B[1] - A[1]) - Lc), Math.abs(Math.hypot(B[0] - P0[0], B[1] - P0[1]) - R2)),
    };
  }

  if (t === 'scissor') {
    const { S, R, Ldrv, Lbar, stages, baseX } = k;
    const C = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const xs = C[0] + Math.sqrt(Math.max(0, Ldrv * Ldrv - (C[1] - S[1]) ** 2));
    const span = Math.max(8, Math.min(Lbar - 4, xs - baseX));
    const h = Math.sqrt(Math.max(1, Lbar * Lbar - span * span));
    const pts = { S, C, B0: [baseX, 0], B1: [baseX + span, 0] };
    const links = [{ a: 'S', b: 'C', L: R, lay: 1 }, { a: 'C', b: 'B1', L: Ldrv, lay: 2 }];
    const pins = [{ p: 'C', lay: 2 }, { p: 'B0', lay: 3 }, { p: 'B1', lay: 3 }];
    for (let i = 0; i < stages; i++) {
      const y0 = i * h, y1 = (i + 1) * h, ym = (i + 0.5) * h;
      const l0 = `L${i}`, r0 = `R${i}`, l1 = `L${i + 1}`, r1 = `R${i + 1}`, m = `M${i}`;
      pts[l0] = [baseX, y0]; pts[r0] = [baseX + span, y0]; pts[l1] = [baseX, y1]; pts[r1] = [baseX + span, y1]; pts[m] = [baseX + span / 2, ym];
      links.push({ a: l0, b: r1, L: Lbar, lay: 2 }, { a: r0, b: l1, L: Lbar, lay: 3 });
      pins.push({ p: m, lay: 3 });
      if (i > 0) pins.push({ p: l0, lay: 3 }, { p: r0, lay: 3 });
    }
    const tip = [baseX + span / 2, stages * h];
    pts.tip = tip;
    return {
      crankRad: th, pts, links, pins, sliders: [{ p: 'B1', axis: 'x' }],
      trace: tip, statLabel: '신축길이', statVal: `${(stages * h).toFixed(1)} mm`,
      err: Math.abs(Math.hypot(pts.B1[0] - C[0], pts.B1[1] - C[1]) - Ldrv),
    };
  }

  if (t === 'walkingLeg') {
    const { S, P, R, Rout, Lc, footU, footV } = k;
    const C = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const Q = ci(C[0], C[1], Lc, P[0], P[1], Rout, +1);
    const ux = (Q[0] - C[0]) / Lc, uy = (Q[1] - C[1]) / Lc;
    const F = [C[0] + footU * ux - footV * uy, C[1] + footU * uy + footV * ux];
    return {
      crankRad: th, pts: { S, C, Q, P, F },
      links: [{ a: 'C', b: 'Q', L: Lc, lay: 1 }, { a: 'P', b: 'Q', L: Rout, lay: 2 }, { a: 'Q', b: 'F', L: 40, lay: 3 }],
      pins: [{ p: 'C', lay: 1 }, { p: 'Q', lay: 3 }, { p: 'P', lay: 2 }, { p: 'F', lay: 3 }],
      trace: F, statLabel: '발끝높이', statVal: `${F[1].toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(Q[0] - C[0], Q[1] - C[1]) - Lc), Math.abs(Math.hypot(Q[0] - P[0], Q[1] - P[1]) - Rout)),
    };
  }

  if (t === 'dualWalk360') {
    const { S, PL, PR, R, Rout, Lc, footU, footV } = k;
    const C1 = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const C2 = [S[0] - R * Math.cos(th), S[1] - R * Math.sin(th)];
    const QR = ci(C1[0], C1[1], Lc, PR[0], PR[1], Rout, +1);
    const QL = ci(C2[0], C2[1], Lc, PL[0], PL[1], Rout, -1);
    const uRx = (QR[0] - C1[0]) / Lc, uRy = (QR[1] - C1[1]) / Lc;
    const uLx = (QL[0] - C2[0]) / Lc, uLy = (QL[1] - C2[1]) / Lc;
    const FR = [C1[0] + footU * uRx - footV * uRy, C1[1] + footU * uRy + footV * uRx];
    const FL = [C2[0] + footU * uLx + footV * uLy, C2[1] + footU * uLy - footV * uLx];
    return {
      crankRad: th, pts: { S, C1, C2, QR, QL, PR, PL, FR, FL },
      links: [
        { a: 'C1', b: 'QR', L: Lc, lay: 1 }, { a: 'PR', b: 'QR', L: Rout, lay: 2 }, { a: 'QR', b: 'FR', L: 40, lay: 3 },
        { a: 'C2', b: 'QL', L: Lc, lay: 1 }, { a: 'PL', b: 'QL', L: Rout, lay: 2 }, { a: 'QL', b: 'FL', L: 40, lay: 3 },
      ],
      pins: [
        { p: 'C1', lay: 1 }, { p: 'C2', lay: 1 }, { p: 'QR', lay: 3 }, { p: 'QL', lay: 3 },
        { p: 'PR', lay: 2 }, { p: 'PL', lay: 2 }, { p: 'FR', lay: 3 }, { p: 'FL', lay: 3 },
      ],
      trace: FR, statLabel: '좌/우발', statVal: `${FL[1].toFixed(0)}/${FR[1].toFixed(0)}`,
      err: Math.max(Math.abs(Math.hypot(QR[0] - C1[0], QR[1] - C1[1]) - Lc), Math.abs(Math.hypot(QL[0] - C2[0], QL[1] - C2[1]) - Lc)),
    };
  }

  if (t === 'dualStage90') {
    const { S, R, LA, LB, PA, RA } = k;
    const CA = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const CB = [S[0] + R * Math.cos(th - Math.PI / 2), S[1] + R * Math.sin(th - Math.PI / 2)];
    const QA = ci(CA[0], CA[1], LA, PA[0], PA[1], RA, +1);
    const xB = CB[0] + Math.sqrt(Math.max(0, LB * LB - (CB[1] - S[1]) ** 2));
    const XB = [xB, S[1]];
    const aA = Math.atan2(QA[1] - PA[1], QA[0] - PA[0]);
    const hatch = [PA[0] + 50 * Math.cos(aA), PA[1] + 50 * Math.sin(aA)];
    return {
      crankRad: th, pts: { S, CA, CB, QA, PA, hatch, XB },
      links: [{ a: 'CA', b: 'QA', L: LA, lay: 1 }, { a: 'PA', b: 'hatch', L: 50, lay: 2 }, { a: 'CB', b: 'XB', L: LB, lay: 1 }],
      pins: [{ p: 'CA', lay: 1 }, { p: 'CB', lay: 1 }, { p: 'QA', lay: 2 }, { p: 'PA', lay: 2 }, { p: 'XB', lay: 2 }],
      sliders: [{ p: 'XB', axis: 'x' }],
      trace: XB, statLabel: deg < 90 ? '1단 해치' : '2단 푸셔', statVal: deg < 90 ? `${(aA / DEG).toFixed(0)}°` : `${xB.toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(QA[0] - CA[0], QA[1] - CA[1]) - LA), Math.abs(Math.hypot(XB[0] - CB[0], XB[1] - CB[1]) - LB)),
    };
  }

  if (t === 'scoop6') {
    const { S, P1, R, Rtab, Ldrv, Lboom, P2, Lsec, Rsc } = k;
    const C = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const Q = ci(C[0], C[1], Ldrv, P1[0], P1[1], Rtab, +1);
    const ba = Math.atan2(Q[1] - P1[1], Q[0] - P1[0]) - 90 * DEG;
    const tip = [P1[0] + Lboom * Math.cos(ba), P1[1] + Lboom * Math.sin(ba)];
    const K = ci(tip[0], tip[1], Rsc, P2[0], P2[1], Lsec, +1);
    const sa = Math.atan2(K[1] - tip[1], K[0] - tip[0]) - 90 * DEG;
    const lip = [tip[0] + 30 * Math.cos(sa), tip[1] + 30 * Math.sin(sa)];
    return {
      crankRad: th, pts: { S, C, Q, P1, P2, tip, K, lip },
      links: [
        { a: 'C', b: 'Q', L: Ldrv, lay: 1 }, { a: 'P1', b: 'Q', L: Rtab, lay: 2 }, { a: 'P1', b: 'tip', L: Lboom, lay: 2 },
        { a: 'P2', b: 'K', L: Lsec, lay: 3 }, { a: 'tip', b: 'K', L: Rsc, lay: 2 }, { a: 'tip', b: 'lip', L: 30, lay: 2 },
      ],
      pins: [{ p: 'C', lay: 1 }, { p: 'Q', lay: 2 }, { p: 'P1', lay: 2 }, { p: 'P2', lay: 3 }, { p: 'tip', lay: 2 }, { p: 'K', lay: 3 }],
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
        { a: 'T', b: 'PR', L: Lpress, lay: 3 },
        { a: 'PR', b: 'PR_BOT', L: 20, lay: 2 },
      ],
      pins: [{ p: 'C', lay: 1 }, { p: 'Q', lay: 2 }, { p: 'P', lay: 2 }, { p: 'T', lay: 3 }, { p: 'PR', lay: 3 }],
      trace: PR, statLabel: yP < 56 ? '하단정지' : '프레스Y', statVal: `${yP.toFixed(1)} mm`,
      err: Math.max(Math.abs(Math.hypot(Q[0] - C[0], Q[1] - C[1]) - Lc), Math.abs(Math.hypot(PR[0] - T[0], PR[1] - T[1]) - Lpress)),
    };
  }

  if (t === 'ratchet3d') {
    const { S, PB, R, RB1, RB2, L1, PW, RW } = k;
    const C = [S[0] + R * Math.cos(th), S[1] + R * Math.sin(th)];
    const Q1 = ci(C[0], C[1], L1, PB[0], PB[1], RB1, +1);
    const a1 = Math.atan2(Q1[1] - PB[1], Q1[0] - PB[0]);
    const a2 = a1 - Math.PI / 2;
    const Q2 = [PB[0] + RB2 * Math.cos(a2), PB[1] + RB2 * Math.sin(a2)];
    const dxp = Math.sqrt(Math.max(1, 40 * 40 - (PW[1] + RW - Q2[1]) ** 2));
    const Pawl = [Q2[0] + dxp, PW[1] + RW];
    return {
      crankRad: th, pts: { S, C, Q1, PB, Q2, Pawl, PW },
      links: [
        { a: 'C', b: 'Q1', L: L1, lay: 1 }, { a: 'PB', b: 'Q1', L: RB1, lay: 2 },
        { a: 'PB', b: 'Q2', L: RB2, lay: 2 }, { a: 'Q2', b: 'Pawl', L: 40, lay: 3 },
      ],
      pins: [{ p: 'C', lay: 1 }, { p: 'Q1', lay: 2 }, { p: 'PB', lay: 2 }, { p: 'Q2', lay: 3 }, { p: 'Pawl', lay: 3 }],
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

  // 출력 궤적 가이드라인 (360° 연속 메커니즘은 닫힌 루프!)
  const trajPts = [];
  const [lo, hi] = spec.range;
  for (let d = lo; d <= hi; d += 3) {
    const r = solveMech(spec, d);
    if (rig === 'V_WEDGE') {
      trajPts.push(new THREE.Vector3(0, k.PY + 80 * Math.sin(r.ang), k.PZ - 80 * Math.cos(r.ang)));
    } else if (r.trace) {
      trajPts.push(rig === 'H'
        ? new THREE.Vector3(r.trace[0], 58.5, r.trace[1])
        : new THREE.Vector3(r.trace[0], r.trace[1], -47.0));
    }
  }
  const tierCol = { 1: 0x2f6fe0, 2: 0x1f9d60, 3: 0xe87a1e, 4: 0x8b46d9, 5: 0xe03636 }[spec.tier] || 0xe8432a;
  if (trajPts.length >= 2) {
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(trajPts), new THREE.LineBasicMaterial({ color: tierCol, transparent: true, opacity: 0.85 })));
  }

  // 특수 리그: M02 썬더 웨지 4절 링크
  if (rig === 'V_WEDGE') {
    const wedgePivot = new THREE.Group();
    wedgePivot.position.set(0, k.PY, k.PZ);
    root.add(wedgePivot);

    const restA = k.restDeg * DEG;
    const ca = Math.cos(restA), sa = Math.sin(restA);
    const wUp = [0, ca, -sa], wX = [1, 0, 0];
    const wPt = (x, u, v) => [x, -u * sa + v * ca, -u * ca - v * sa];

    wedgePivot.add(
      makePart(mods, 'frame-main-pcb', wPt(0, 40, -4.6), wX, wUp).g,
      makePart(mods, 'battle-g', wPt(0, 80, -3.0), wX, wUp).g,
      makePart(mods, 'motor-frame-3x3', wPt(k.linkX, k.tabU, -3.0), wX, wUp).g,
      makePart(mods, 's-hook-35', wPt(k.linkX + 1.6, k.tabU, k.tabV), null, [1, 0, 0]).g,
    );

    const crankPivot = new THREE.Group();
    crankPivot.position.set(k.linkX, k.SY, k.SZ);
    root.add(crankPivot);
    crankPivot.add(
      makePart(mods, 'wheel-guide-30-servo', [0, 0, 0], [0, 0, 1], [-1, 0, 0]).g,
      makePart(mods, 'bolt-m26x10', [0.3, 0, 0], null, [1, 0, 0]).g,
      makePart(mods, 's-hook-35', [1.6, 0, k.R], null, [1, 0, 0]).g,
    );
    const coupler = makePart(mods, 'frame-s12-pcb', [k.linkX, 0, 0], [0, 0, 1], [1, 0, 0]).g;
    root.add(coupler);

    const setAngle = (deg) => {
      const r = solveMech(spec, deg);
      wedgePivot.rotation.x = r.lift * DEG;
      for (const pv of hingePivots) pv.rotation.z = (r.lift - k.restDeg) * DEG;
      crankPivot.rotation.x = -r.crankRad;
      coupler.position.set(k.linkX, r.ty + 45 * r.uy, r.tz + 45 * r.ux);
      setBasis(coupler, [0, r.uy, r.ux], [1, 0, 0]);
      return r;
    };
    setAngle(spec.rest);
    return { root, setAngle };
  }

  // 공통 수평(H) / 수직(V) 크랭크 허브: 서보 가이드 / Ø30 나일론 / Ø40 노랑 휠 가이드 자동 정합!
  const sx = k.S[0], sy = (k.type === 'wattLine') ? -10 : k.S[1];
  const crankPivot = new THREE.Group();
  crankPivot.position.set(sx, rig === 'H' ? 51.6 : sy, rig === 'H' ? sy : -40.0);
  root.add(crankPivot);

  const gid = spec.guidePart || 'wheel-guide-30-servo';
  const isYellow40 = (gid === 'wheel-guide-40-yellow');
  // wheel-guide-40-yellow은 허브가 -Y 아래로 돌출, 평면 윗면이 y=+2.4 → 평면을 crankPivot=0에 맞추기 위해 오프셋 -2.4!
  const wgPos = isYellow40 ? (rig === 'H' ? [0, -2.4, 0] : [0, 0, 2.4]) : [0, 0, 0];
  const wgUp = isYellow40 ? (rig === 'H' ? [0, 1, 0] : [0, 0, -1]) : (rig === 'H' ? [0, -1, 0] : [0, 0, 1]);
  crankPivot.add(
    makePart(mods, gid, wgPos, [1, 0, 0], wgUp).g,
    makePart(mods, 'bolt-m26x10', rig === 'H' ? [0, 0.3, 0] : [0, 0, -0.3], null, rig === 'H' ? [0, 1, 0] : [0, 0, -1]).g,
  );

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
    const { g } = makePart(mods, 'shaft-75', [0, 0, 0], xdir, [0, 1, 0]);
    root.add(g);
    return { g, sl };
  });

  let ratchetWheel = null, ratchetCum = 0, lastPawlX = null;
  if (k.type === 'ratchet3d') {
    ratchetWheel = new THREE.Group();
    ratchetWheel.position.set(k.PW[0], k.PW[1], -43.2);
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
      placeLink2D(g, r.pts[lk.a], r.pts[lk.b], rig, lk.lay, h0);
    }
    for (let i = 0; i < pinObjs.length; i++) {
      placeHook2D(pinObjs[i].g, r.pts[r.pins[i].p], rig, r.pins[i].lay);
    }
    for (let i = 0; i < sliderObjs.length; i++) {
      const pt = r.pts[sliderObjs[i].sl.p];
      sliderObjs[i].g.position.set(pt[0], 50.5, pt[1]);
    }
    if (ratchetWheel && r.pawlX !== undefined) {
      if (lastPawlX !== null && r.pawlX > lastPawlX) ratchetCum += (r.pawlX - lastPawlX) / k.RW;
      lastPawlX = r.pawlX;
      ratchetWheel.rotation.z = -ratchetCum;
      r.statVal = `${Math.round(ratchetCum / DEG)}° (${(ratchetCum / (Math.PI * 2)).toFixed(1)}회전)`;
    }
    if (scoopGrab && r.pts.tip && r.pts.lip) {
      const ang = Math.atan2(r.pts.lip[1] - r.pts.tip[1], r.pts.lip[0] - r.pts.tip[0]);
      scoopGrab.position.set(r.pts.tip[0], r.pts.tip[1], -43.2);
      setBasis(scoopGrab, [0, 0, -1], [Math.sin(ang), -Math.cos(ang), 0]);
    }
    if (hammerBlade && r.pts.P && r.pts.tip) {
      const ang = Math.atan2(r.pts.tip[1] - r.pts.P[1], r.pts.tip[0] - r.pts.P[0]);
      hammerBlade.position.set(r.pts.tip[0], r.pts.tip[1], -43.2);
      setBasis(hammerBlade, [Math.cos(ang), Math.sin(ang), 0], [0, 0, -1]);
    }
    return r;
  };

  const resetRatchet = () => { ratchetCum = 0; lastPawlX = null; };
  setAngle(spec.rest);
  return { root, setAngle, resetRatchet };
}

export async function buildMechLab(loadPart, onProgress) {
  const mods = {};
  for (let i = 0; i < MECHLAB_PART_IDS.length; i++) {
    const id = MECHLAB_PART_IDS[i];
    mods[id] = await loadPart(id);
    if (onProgress) onProgress((i + 1) / MECHLAB_PART_IDS.length);
  }

  const root = new THREE.Group();
  const rigs = {};
  for (const sp of MECHS) {
    const rig = buildSingleRig(sp, mods);
    rig.root.visible = false;
    root.add(rig.root);
    rigs[sp.code] = rig;
  }

  let activeCode = 'M01';
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
    activeDeg = sp.guide === 'wheel' ? ((deg % 360) + 360) % 360 : Math.max(lo, Math.min(hi, deg));
    lastResult = rigs[activeCode].setAngle(activeDeg);
    return lastResult;
  }

  select('M01');
  return {
    root, rigs, select, setAngle,
    getActive: () => ({ spec: MECH_BY_CODE[activeCode], deg: activeDeg, res: lastResult }),
    count: MECHS.length,
  };
}
