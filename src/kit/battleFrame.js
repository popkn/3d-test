import * as THREE from 'three';
import { makePcb } from './pcb.js';
import { PITCH } from './frame.js';

// 배틀 프레임 (흰 FR-4 1.6T + 빨간 인쇄 무늬, 10mm 간격 구멍). 외곽선과 구멍은 사진으로 추정.
//   outline: [[x, z], ...] mm, holes: [[x, z], ...], pattern: 'stars' | 'flame'
export function makeBattleFrame({ outline, holes, pattern, width, depth, paint = null }) {
  const pcb = makePcb({
    width, depth, color: 'white', outline, corner: 2, pxPerMm: 12,
    holes: holes.map(([x, z]) => ({ x, z, r: 1.6, ring: true })),
    silk: (g, w, d, X, Y) => {
      g.fillStyle = '#b8101c'; // 사진의 진한 빨강 (조명에서 분홍으로 바래지 않게 조금 어둡게)
      // 외곽선 안쪽만 칠하도록 잘라낸다
      g.save();
      g.beginPath();
      outline.forEach(([x, z], i) => (i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z))));
      g.closePath();
      g.clip();
      if (paint) paint(g, X, Y);
      else if (pattern === 'stars') {
        const xs = holes.map(([x]) => x).filter((x, i, a) => a.indexOf(x) === i).sort((a, b) => a - b);
        for (let i = 0; i < xs.length - 1; i += 2) star(g, X((xs[i] + xs[i + 1]) / 2), Y(0), 7, 3);
      } else {
        // 불꽃 무늬 (사진: 촘촘한 소용돌이 불꽃). 아래에서 큰 불꽃, 위에서 작은 불꽃을 엇갈려 그린다
        const flame = (x, base, tip, s) => {
          const h = tip - base;
          g.beginPath();
          g.moveTo(X(x - 4.5 * s), Y(base));
          g.bezierCurveTo(X(x - 5 * s), Y(base + h * 0.45), X(x + 4 * s), Y(base + h * 0.55), X(x + 2.5 * s), Y(base + h * 0.85));
          g.bezierCurveTo(X(x + 1.5 * s), Y(base + h * 1.05), X(x - 2.5 * s), Y(base + h * 1.0), X(x - 2 * s), Y(base + h * 0.8));
          g.bezierCurveTo(X(x - 0.5 * s), Y(base + h * 0.9), X(x + 1 * s), Y(base + h * 0.75), X(x - 0.5 * s), Y(base + h * 0.6));
          g.bezierCurveTo(X(x - 2.5 * s), Y(base + h * 0.4), X(x + 3.5 * s), Y(base + h * 0.25), X(x + 4.5 * s), Y(base));
          g.closePath(); g.fill();
          // 소용돌이 눈 (흰 점)
          g.save(); g.fillStyle = '#f4f3ee'; g.beginPath(); g.arc(X(x + 0.2 * s), Y(base + h * 0.82), 0.9 * Math.abs(s), 0, Math.PI * 2); g.fill(); g.restore();
        };
        for (let x = -w / 2 - 6; x < w / 2 + 8; x += 11) {
          flame(x, d / 2, -d / 2 + 3, 1);
          flame(x + 5.5, -d / 2, d / 2 - 9, -0.7);
        }
      }
      g.restore();
      // 바깥 테두리 (밝은 배경에서도 모양이 보이도록 회색 선)
      g.strokeStyle = '#8a8884'; g.lineWidth = 0.7;
      g.beginPath();
      outline.forEach(([x, z], i) => (i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z))));
      g.closePath();
      g.stroke();
      // 구멍 둘레는 흰색 테두리로 다시 (무늬 위)
      g.fillStyle = '#f4f3ee';
      for (const [x, z] of holes) { g.beginPath(); g.arc(X(x), Y(z), 3, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#c7c9cc';
      for (const [x, z] of holes) { g.beginPath(); g.arc(X(x), Y(z), 2.3, 0, Math.PI * 2); g.fill(); }
    },
  });
  return pcb;
}

function star(g, cx, cy, ro, ri) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? ri : ro;
    i ? g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
}

// 격자 구멍 목록: cols × rows, 가운데 정렬
export function gridHoles(cols, rows) {
  const out = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) out.push([(c - (cols - 1) / 2) * PITCH, (r - (rows - 1) / 2) * PITCH]);
  return out;
}

// 외곽선 안쪽(가장자리에서 margin 이상)에 있는 구멍만 남긴다
export function holesInside(holes, outline, margin = 3.5) {
  const inside = (x, z) => {
    let c = false;
    for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
      const [xi, zi] = outline[i], [xj, zj] = outline[j];
      if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
    }
    return c;
  };
  const segDist = (x, z, [x1, z1], [x2, z2]) => {
    const dx = x2 - x1, dz = z2 - z1, t = Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(x - x1 - t * dx, z - z1 - t * dz);
  };
  return holes.filter(([x, z]) => inside(x, z) && outline.every((p, i) => segDist(x, z, p, outline[(i + 1) % outline.length]) >= margin));
}
