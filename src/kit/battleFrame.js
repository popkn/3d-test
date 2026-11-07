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
      g.fillStyle = '#d4202a';
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
        // 불꽃 무늬: 굽은 갈고리 모양을 일정 간격으로
        for (let x = -w / 2 - 10; x < w / 2 + 10; x += 13) {
          g.beginPath();
          g.moveTo(X(x), Y(d / 2));
          g.bezierCurveTo(X(x + 2), Y(2), X(x + 12), Y(4), X(x + 9), Y(-d / 2 + 4));
          g.bezierCurveTo(X(x + 6), Y(-2), X(x + 4), Y(4), X(x + 5), Y(d / 2));
          g.fill();
          g.beginPath();
          g.arc(X(x + 9), Y(-d / 2 + 5), 2, 0, Math.PI * 2);
          g.fill();
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
