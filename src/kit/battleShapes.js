import * as THREE from 'three';
import { makeBattleFrame } from './battleFrame.js';

// 배틀무기 실제 모양 (사용자 사진 · 구멍 간격 10 mm로 크기 환산, 약 7.8 px = 1 mm)
// 좌표: x 오른쪽, z 아래 (사진 아래 = +z), 단위 mm. 판은 흰 FR-4 1.6T + 빨강 인쇄.
// 여러 장이 한 세트인 부품: U (별 1/3 조각 × 3), V (도끼 반쪽 × 2), T (초승달 반쪽 × 2, 한 장은 뒤집음)

const RED = '#d8324f';
const WHITE = '#f4f3ee';
const P = (pts) => pts.map(([x, z]) => [x, z]);
const poly = (g, X, Y, pts) => { g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z)))); g.closePath(); };
// 둥근 모서리 다각형 (꼭짓점마다 반지름 r)
export function rounded(pts, r = 2, seg = 4) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const k = Math.min(r, da / 2, db / 2);
    const u = [p[0] + (a[0] - p[0]) / da * k, p[1] + (a[1] - p[1]) / da * k], v = [p[0] + (b[0] - p[0]) / db * k, p[1] + (b[1] - p[1]) / db * k];
    for (let j = 0; j <= seg; j++) { const t = j / seg, w0 = (1 - t) ** 2, w1 = 2 * t * (1 - t), w2 = t * t; out.push([u[0] * w0 + p[0] * w1 + v[0] * w2, u[1] * w0 + p[1] * w1 + v[1] * w2]); }
  }
  return out;
}

// 모양 → 가운데 맞춘 판 (bbox 가운데 = 원점)
function frameFrom(shape) {
  const { outline, holes, paint } = shape;
  const xs = outline.map((p) => p[0]), zs = outline.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
  const sh = (p) => [p[0] - cx, p[1] - cz, ...p.slice(2)];
  const W = Math.max(...xs) - Math.min(...xs), D = Math.max(...zs) - Math.min(...zs);
  const pnt = (g, X, Y) => paint(g, (x) => X(x - cx), (z) => Y(z - cz));
  pnt.keepHoleRings = shape.rings === false;
  const mesh = makeBattleFrame({ outline: outline.map(sh), holes: holes.map(sh), width: W + 0.5, depth: D + 0.5, paint: pnt, rings: shape.rings !== false });
  return { mesh, W, D, cx, cz, holes: holes.map(sh) };
}

// ── S 방패: 위가 좁은 사다리꼴, 빨간 테두리 줄, 가운데 큰 구멍 + 꽃잎 홈 6
export function shapeS() {
  const base = [[-12, -46], [12, -46], [26, -39], [41, 42], [38, 46], [-38, 46], [-41, 42], [-26, -39]];
  const outline = rounded(base, 3);
  const holes = [[-15, -27.5], [15, -27.5], [-15, 32.5], [15, 32.5], [0, 2.5, 6]];
  for (let k = 0; k < 6; k++) {                       // 꽃잎 홈 (반지름 방향으로 긴 홈 → 구멍 2개로)
    const a = k * Math.PI / 3;
    for (const r of [11.8, 14.2]) holes.push([Math.cos(a) * r, 2.5 + Math.sin(a) * r, 1.55]);
  }
  const inner = rounded([[-10, -40.5], [10, -40.5], [21.5, -34.5], [35, 38], [33, 40.5], [-33, 40.5], [-35, 38], [-21.5, -34.5]], 3);
  return {
    outline, holes, rings: false,
    paint(g, X, Y) {
      g.lineWidth = (X(3.2) - X(0)); g.strokeStyle = RED; g.lineJoin = 'round';
      poly(g, X, Y, inner); g.stroke();
      g.fillStyle = RED;                               // 꽃: 가운데 고리 + 꽃잎 6
      g.beginPath(); g.arc(X(0), Y(2.5), X(9.5) - X(0), 0, Math.PI * 2); g.fill();
      for (let k = 0; k < 6; k++) {
        const a = k * Math.PI / 3;
        g.beginPath(); g.ellipse(X(Math.cos(a) * 13), Y(2.5 + Math.sin(a) * 13), X(5.6) - X(0), X(4) - X(0), a, 0, Math.PI * 2); g.fill();
      }
    },
  };
}

// ── U 별 조각 (12각 별의 1/3, 120°): 세 장을 모으면 지름 97 별. 별 가운데에서 반지름 10에 구멍 2
export const U_R = 48.5, U_V = 36.5;
export function shapeU() {
  const pt = (deg, r) => [Math.sin(deg * Math.PI / 180) * r, -Math.cos(deg * Math.PI / 180) * r];   // 0° = 위(−z)
  const outline = [pt(-60, 3), pt(-60, U_V)];
  for (let d = -45; d <= 45; d += 30) outline.push(pt(d, U_R), pt(d + 15, U_V));
  outline.push(pt(60, 3), pt(0, 3));
  const holes = [pt(-30, 10), pt(30, 10)];
  return {
    outline, holes,
    paint(g, X, Y) {
      g.fillStyle = RED;
      const kite = (deg, r0, r1, w) => { poly(g, X, Y, [pt(deg, r0), pt(deg - w, (r0 + r1) / 2), pt(deg, r1), pt(deg + w, (r0 + r1) / 2)]); g.fill(); };
      for (let d = -45; d <= 45; d += 30) kite(d, 22, 45, 7);          // 뾰족 끝으로 가는 긴 마름모
      for (let d = -30; d <= 30; d += 30) kite(d, 15, 31, 6);          // 골 쪽 작은 마름모
      for (const d of [-52, 52]) kite(d, 16, 30, 4);
    },
  };
}

// ── V 도끼 반쪽: 안쪽 흰 띠 (구멍 2, 간격 10) + 바깥 큰 날 (톱니 홈), 빨간 바탕 + 흰 X 무늬
export function shapeV() {
  const s = 1 / 7.83, px = (x, y) => [(x - 366) * s, (y - 327) * s];     // 사진 좌표 → mm (두 장의 이음선 가운데 = 원점)
  const base = [[366, 205], [300, 205], [258, 168], [278, 104], [214, 14], [150, 24], [72, 92], [26, 188], [10, 300], [12, 362], [62, 346], [40, 420], [64, 520], [120, 600], [188, 642], [212, 622], [270, 560], [252, 520], [300, 452], [366, 452]].map(([x, y]) => px(x, y));
  const outline = rounded(base, 1.5, 3);
  const holes = [[-3.9, -5], [-3.9, 5]];
  return {
    outline, holes,
    paint(g, X, Y) {
      g.fillStyle = RED;
      const blade = [[300, 214], [260, 176], [282, 104], [218, 30], [156, 40], [86, 102], [42, 196], [28, 300], [32, 352], [74, 340], [58, 418], [80, 514], [130, 590], [190, 628], [252, 560], [236, 520], [300, 444]].map(([x, y]) => px(x, y));
      poly(g, X, Y, blade); g.fill();
      g.strokeStyle = WHITE; g.lineWidth = X(1.8) - X(0);
      const c = px(205, 327);
      for (const [a, b] of [[px(120, 120), px(290, 540)], [px(290, 120), px(120, 540)]]) { g.beginPath(); g.moveTo(X(a[0]), Y(a[1])); g.lineTo(X(b[0]), Y(b[1])); g.stroke(); }
      g.lineWidth = X(1.4) - X(0);
      poly(g, X, Y, [[c[0], c[1] - 6], [c[0] + 3.5, c[1]], [c[0], c[1] + 6], [c[0] - 3.5, c[1]]]); g.stroke();
      for (const d of [-1, 1]) { g.beginPath(); g.moveTo(X(c[0] - 6), Y(c[1] + d * 9)); g.lineTo(X(c[0]), Y(c[1] + d * 5)); g.lineTo(X(c[0] + 6), Y(c[1] + d * 9)); g.stroke(); }
      // 바깥 둘레 흰 테두리 (톱니 날)
      g.lineWidth = X(2.4) - X(0); poly(g, X, Y, blade); g.stroke();
    },
  };
}

// ── G 별 막대: 20 × 98, 구멍 2 × 10 (간격 10), 빨간 네 갈래 별 5개
export function shapeG() {
  const outline = rounded([[-49, -10], [49, -10], [49, 10], [-49, 10]], 2.5);
  const holes = [];
  for (let i = 0; i < 10; i++) for (const z of [-5, 5]) holes.push([-45 + i * 10, z]);
  return {
    outline, holes,
    paint(g, X, Y) {
      g.fillStyle = RED;
      for (const x of [-40, -20, 0, 20, 40]) {
        const L = 9, Wd = 7.5, k = 1.2;
        g.beginPath();
        g.moveTo(X(x - L), Y(0)); g.quadraticCurveTo(X(x - k), Y(-k), X(x), Y(-Wd));
        g.quadraticCurveTo(X(x + k), Y(-k), X(x + L), Y(0)); g.quadraticCurveTo(X(x + k), Y(k), X(x), Y(Wd));
        g.quadraticCurveTo(X(x - k), Y(k), X(x - L), Y(0)); g.fill();
      }
    },
  };
}

// ── I 불꽃 판: 90 × 30, 한쪽 끝 모서리가 비스듬히 잘림, 구멍 3줄 (9 · 8 · 7개). J는 I를 뒤집은 모양
export function shapeI(mirror = false) {
  const m = mirror ? -1 : 1;
  const base = [[-45, -15], [45, -15], [45, 7], [18, 15], [-45, 15]].map(([x, z]) => [x, z * m]);
  const outline = rounded(mirror ? base.reverse() : base, 2);
  const holes = [];
  for (let i = 0; i < 9; i++) holes.push([-40 + i * 10, -10 * m]);
  for (let i = 0; i < 8; i++) holes.push([-40 + i * 10, 0]);
  for (let i = 0; i < 7; i++) holes.push([-40 + i * 10, 10 * m]);
  return {
    outline, holes,
    paint(g, X, Y) {
      g.fillStyle = RED;
      // 소용돌이 불꽃 (사진처럼 S자 고리가 줄지어)
      for (let x = -48; x < 50; x += 12) {
        for (const [zc, s] of [[-7 * m, 1], [7 * m, -1]]) {
          g.beginPath();
          g.moveTo(X(x - 5), Y(zc + 5 * s));
          g.bezierCurveTo(X(x - 2), Y(zc - 6 * s), X(x + 6), Y(zc - 4 * s), X(x + 7), Y(zc + 1 * s));
          g.bezierCurveTo(X(x + 5), Y(zc - 1 * s), X(x + 1), Y(zc - 1 * s), X(x + 1), Y(zc + 2 * s));
          g.bezierCurveTo(X(x + 1), Y(zc + 4 * s), X(x + 4), Y(zc + 4 * s), X(x + 5), Y(zc + 3 * s));
          g.bezierCurveTo(X(x + 3), Y(zc + 7 * s), X(x - 2), Y(zc + 7 * s), X(x - 5), Y(zc + 5 * s));
          g.fill();
        }
      }
    },
  };
}

// ── T 초승달 반쪽: 뿌리 (구멍 2 × 2) 에서 휘어 올라가는 날, 안쪽에 얼굴 모양 홈. 두 장 (한 장은 뒤집음)이 세트
export function shapeT() {
  const s = 1 / 7.83, px = (x, y) => [(x - 215) * s, (y - 420) * s];
  const base = [[22, 20], [150, 62], [238, 122], [292, 190], [300, 240], [268, 252], [288, 272], [330, 300], [346, 332], [336, 400], [318, 482], [96, 482], [95, 330], [88, 210], [60, 100]].map(([x, y]) => px(x, y));
  const outline = rounded(base, 1.5, 3);
  const holes = [[-5, -4], [5, -4], [-5, 4], [5, 4]];
  return {
    outline, holes,
    paint(g, X, Y) {
      g.fillStyle = RED;
      const blade = [[40, 66], [82, 150], [100, 250], [106, 340], [128, 400], [196, 398], [226, 330], [236, 250], [214, 162], [150, 96]].map(([x, y]) => px(x, y));   // 바깥(왼쪽) 가장자리를 따라 끝까지 가는 초승달 띠
      poly(g, X, Y, rounded(blade, 4, 4)); g.fill();
    },
  };
}

// 판 하나 (모델 공통): 흰 FR-4 판 + 라벨용 정보
export function battlePiece(shape) {
  const f = frameFrom(shape);
  return f;
}

// 세트: 같은 판 여러 장을 실제처럼 배치 (U: 120°씩 돌려 별, V: 180° 돌려 도끼, T: 뒤집어 겹침)
export function battleSet(kind) {
  const root = new THREE.Group();
  const pieces = [];
  if (kind === 'u') {
    const sh = shapeU();
    for (let k = 0; k < 3; k++) {
      const f = frameFrom(sh);
      const g = new THREE.Group();
      f.mesh.position.set(f.cx, 0, f.cz);                  // 조각의 별 가운데를 원점으로
      g.add(f.mesh); g.rotation.y = -k * 2 * Math.PI / 3;
      root.add(g); pieces.push(g);
    }
  } else if (kind === 'v') {
    const sh = shapeV();
    for (let k = 0; k < 2; k++) {
      const f = frameFrom(sh);
      const g = new THREE.Group();
      f.mesh.position.set(f.cx, 0, f.cz);
      g.add(f.mesh); g.rotation.y = k * Math.PI;
      root.add(g); pieces.push(g);
    }
  } else if (kind === 't') {
    const sh = shapeT();
    for (let k = 0; k < 2; k++) {
      const f = frameFrom(sh);
      const g = new THREE.Group();
      f.mesh.position.set(f.cx, 0, f.cz);
      g.add(f.mesh);
      if (k) g.rotation.x = Math.PI;                       // 두 번째 장은 뒤집어 아래로 휘게 (뿌리 구멍 4개가 겹침)
      g.position.y = 1.6;                                  // 첫 장 y 1.6 ~ 3.2 (위), 뒤집은 장 y 0 ~ 1.6 (아래)
      root.add(g); pieces.push(g);
    }
  }
  return { root, pieces };
}
