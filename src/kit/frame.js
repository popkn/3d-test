import * as THREE from 'three';
import { M, mesh } from './materials.js';
import { makePcb } from './pcb.js';
import { makeBolt } from './fasteners.js';

// 로보로보 프레임 공통 (구멍 간격 10mm, M3 구멍). 단위 mm.
//   크기 = (구멍 수 - 1) × 10 + 8  (가장자리 여유 4mm)
export const PITCH = 10;
export const frameSize = (n) => (n - 1) * PITCH + 8;

// 판 프레임: cols × rows 구멍 격자. material: 'pcb'(검은 FR-4, 금색 테) / 'plastic'(검은 플라스틱)
//   skip(c, r): true면 그 자리 구멍을 뺀다 (ㅁ자 · 하프 등 모양용), outline: 직접 외곽선
export function makeFrame({ cols, rows, material = 'pcb', thickness = 1.6, skip = null, outline = null, color = null, margin = 4, marginZ = null, cutouts = [] }) {
  const mz = marginZ ?? margin;
  const W = (cols - 1) * PITCH + margin * 2, D = (rows - 1) * PITCH + mz * 2;
  const holes = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    if (skip && skip(c, r)) continue;
    holes.push({ x: -W / 2 + margin + c * PITCH, z: -D / 2 + mz + r * PITCH, r: 1.6, ring: material === 'pcb' });
  }
  let obj;
  if (material === 'pcb') {
    obj = makePcb({ width: W, depth: D, thickness, holes, color: 'black', outline, corner: 2, pxPerMm: 8, cutouts });
  } else {
    const s = new THREE.Shape();
    if (outline) { outline.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z))); s.closePath(); }
    else { const w = W / 2, d = D / 2, k = 2; s.moveTo(-w + k, -d); s.lineTo(w - k, -d); s.quadraticCurveTo(w, -d, w, -d + k); s.lineTo(w, d - k); s.quadraticCurveTo(w, d, w - k, d); s.lineTo(-w + k, d); s.quadraticCurveTo(-w, d, -w, d - k); s.lineTo(-w, -d + k); s.quadraticCurveTo(-w, -d, -w + k, -d); }
    for (const h of holes) { const p = new THREE.Path(); p.absarc(h.x, -h.z, h.r, 0, Math.PI * 2, true); s.holes.push(p); }
    const g = new THREE.ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false, curveSegments: 10 });
    g.rotateX(-Math.PI / 2);
    obj = mesh(g, new THREE.MeshStandardMaterial({ color: color ?? 0x1e1f22, roughness: 0.6 }));
  }
  const group = new THREE.Group();
  group.add(obj);
  group.userData = { holes, W, D, thickness, cols, rows };
  return group;
}

// L자 프레임 (SUS 1mm): 한쪽 다리 a구멍 × 폭 w구멍, 다른 쪽 다리 b구멍 × 폭 w구멍. angle = 두 다리 사이 각도
export function makeLFrame({ a, b, w, angle = 90, thickness = 1 }) {
  const group = new THREE.Group();
  const W = frameSize(w);
  const leg = (n) => {
    const L = frameSize(n);
    const s = new THREE.Shape();
    s.moveTo(0, -W / 2); s.lineTo(L - 1.5, -W / 2); s.quadraticCurveTo(L, -W / 2, L, -W / 2 + 1.5);
    s.lineTo(L, W / 2 - 1.5); s.quadraticCurveTo(L, W / 2, L - 1.5, W / 2); s.lineTo(0, W / 2);
    for (let i = 0; i < n; i++) for (let j = 0; j < w; j++) { const p = new THREE.Path(); p.absarc(4 + i * PITCH, -W / 2 + 4 + j * PITCH, 1.6, 0, Math.PI * 2, true); s.holes.push(p); }
    const g = new THREE.ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    g.translate(0, thickness, 0);
    return mesh(g, M.metal);
  };
  const base = leg(a);
  base.scale.x = -1; // 바닥 다리는 -X 쪽으로
  group.add(base);
  const up = leg(b);
  up.rotation.z = Math.PI - (angle * Math.PI) / 180; // 꺾인 다리
  up.position.y = 0;
  group.add(up);
  group.userData = { W };
  return group;
}

// 프레임 기능 (공통): 구멍 정보 + 모서리 볼트 끼우기
export function createFrameFunction(model, ui) {
  const { info, bolts } = model.handles;
  const st = { bolts: false };
  ui.controls([{ type: 'toggle', id: 'bolts', label: '모서리 구멍에 M3 볼트 끼우기', value: false }]);
  ui.readouts([['holes', '구멍'], ['pitch', '구멍 간격'], ['use', '쓰임']]);
  return {
    onControl(id, v) { st.bolts = v; },
    update() {
      bolts.forEach((b) => { b.visible = st.bolts; });
      ui.readout('holes', info.holes);
      ui.readout('pitch', '10 mm (로보로보 모든 보드 · 프레임 공통)');
      ui.readout('use', info.use);
    },
  };
}

// 모서리 볼트 4개 (프레임 위에 꽂힌 모습, 크기 측정에서 뺀다)
export function cornerBolts(frameGroup, y) {
  const { holes } = frameGroup.userData;
  const xs = holes.map((h) => h.x), zs = holes.map((h) => h.z);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const pick = [[minX, minZ], [maxX, minZ], [minX, maxZ], [maxX, maxZ]]
    .map(([x, z]) => holes.reduce((best, h) => (Math.hypot(h.x - x, h.z - z) < Math.hypot(best.x - x, best.z - z) ? h : best)));
  return pick.map((h) => {
    const b = makeBolt({ length: 6 });
    b.position.set(h.x, y, h.z);
    b.userData.noBounds = true;
    b.visible = false;
    return b;
  });
}
