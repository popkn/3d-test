import * as THREE from 'three';
import { M, mesh } from './materials.js';
import { canvasTexture, FONT } from './textures.js';

// PCB 기판 만들기 (단위 mm).
//   좌표: X = 길이, Z = 폭(앞쪽 +Z), Y = 위. 기판 아랫면이 y = 0, 윗면이 y = thickness.
//   outline: 기판 외곽선 [[x, z], ...] (생략하면 둥근 사각형)
//   holes:   실제로 뚫린 구멍 [{ x, z, r, ring }]
//   frame:   로보로보 프레임 구멍 (가장자리를 따라 일정 간격) { pitch, inset, r, numbers, letters }
//   silk(g, w, d, X, Y): 실크 인쇄 그리기 (X(x), Y(z)로 기판 좌표 → 캔버스 좌표)
export function makePcb({
  width, depth, thickness = 1.6, color = 'black', outline = null, corner = 1.2,
  holes = [], frame = null, silk = null, pxPerMm = 20, cutouts = [],
}) {
  const dark = color === 'black';
  const allHoles = [...holes];

  // 프레임 구멍: 네 변을 따라 pitch 간격
  const frameHoles = [];
  if (frame) {
    const { pitch, inset = 3, r = 1.6 } = frame;
    const nx = Math.round((width - inset * 2) / pitch);
    const nz = Math.round((depth - inset * 2) / pitch);
    const x0 = -(nx * pitch) / 2;
    const z0 = -(nz * pitch) / 2;
    for (let i = 0; i <= nx; i++) {
      frameHoles.push({ x: x0 + i * pitch, z: z0, r, ring: true, edge: 'top', i });
      frameHoles.push({ x: x0 + i * pitch, z: -z0, r, ring: true, edge: 'bottom', i });
    }
    for (let j = 1; j < nz; j++) {
      frameHoles.push({ x: x0, z: z0 + j * pitch, r, ring: true, edge: 'left', j });
      frameHoles.push({ x: -x0, z: z0 + j * pitch, r, ring: true, edge: 'right', j });
    }
    allHoles.push(...frameHoles);
  }

  // 외곽선 (shape의 y = -z)
  const shape = new THREE.Shape();
  if (!outline && frame && frame.scallop) {
    // 물결 가장자리: 구멍마다 볼록, 구멍 사이는 오목 (로보로보 CPU 보드)
    const { pitch, inset = 3 } = frame;
    const nx = Math.round((width - inset * 2) / pitch), nz = Math.round((depth - inset * 2) / pitch);
    const hx = (nx * pitch) / 2, hz = (nz * pitch) / 2, dep = frame.scallop;
    const wave = (u) => inset - dep * (1 - Math.cos(2 * Math.PI * u)) / 2; // 구멍 중심에서 가장자리까지
    const N = 12;
    outline = [];
    const arc = (cx, cz, a0) => { for (let k = 1; k < 6; k++) { const a = a0 + (k / 6) * (Math.PI / 2); outline.push([cx + Math.cos(a) * inset, cz + Math.sin(a) * inset]); } };
    for (let k = 0; k <= nx * N; k++) outline.push([-hx + (k / N) * pitch, -hz - wave(k / N)]);
    arc(hx, -hz, -Math.PI / 2);
    for (let k = 0; k <= nz * N; k++) outline.push([hx + wave(k / N), -hz + (k / N) * pitch]);
    arc(hx, hz, 0);
    for (let k = 0; k <= nx * N; k++) outline.push([hx - (k / N) * pitch, hz + wave(k / N)]);
    arc(-hx, hz, Math.PI / 2);
    for (let k = 0; k <= nz * N; k++) outline.push([-hx - wave(k / N), hz - (k / N) * pitch]);
    arc(-hx, -hz, Math.PI);
  }
  if (outline) {
    outline.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
    shape.closePath();
  } else {
    const w = width / 2;
    const d = depth / 2;
    const c = corner;
    shape.moveTo(-w + c, -d);
    shape.lineTo(w - c, -d); shape.quadraticCurveTo(w, -d, w, -d + c);
    shape.lineTo(w, d - c); shape.quadraticCurveTo(w, d, w - c, d);
    shape.lineTo(-w + c, d); shape.quadraticCurveTo(-w, d, -w, d - c);
    shape.lineTo(-w, -d + c); shape.quadraticCurveTo(-w, -d, -w + c, -d);
  }
  for (const h of allHoles) {
    const p = new THREE.Path();
    p.absarc(h.x, -h.z, h.r, 0, Math.PI * 2, true);
    shape.holes.push(p);
  }

  // 네모난 창 (ㅁ자 프레임 등): { x, z, w, d }
  for (const c of cutouts) {
    const p = new THREE.Path();
    p.moveTo(c.x - c.w / 2, -(c.z - c.d / 2)); p.lineTo(c.x - c.w / 2, -(c.z + c.d / 2));
    p.lineTo(c.x + c.w / 2, -(c.z + c.d / 2)); p.lineTo(c.x + c.w / 2, -(c.z - c.d / 2)); p.closePath();
    shape.holes.push(p);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 16 });
  geo.rotateX(-Math.PI / 2);

  // 실크 인쇄 텍스처
  const tex = canvasTexture(width, depth, (g, w, d) => {
    const X = (x) => x + w / 2;
    const Y = (z) => z + d / 2;
    g.fillStyle = dark ? '#18191b' : '#f4f3ee';
    g.fillRect(0, 0, w, d);
    // 구멍 둘레 금속 테
    g.fillStyle = dark ? '#b9a26a' : '#c7c9cc';
    for (const h of allHoles) {
      if (!h.ring) continue;
      g.beginPath(); g.arc(X(h.x), Y(h.z), h.r + 0.7, 0, Math.PI * 2); g.fill();
    }
    // 프레임 번호/알파벳
    if (frame && (frame.numbers || frame.letters)) {
      g.fillStyle = dark ? '#e8e6df' : '#1d1d1f';
      g.font = `600 1.6px ${FONT}`;
      g.textAlign = 'center';
      for (const h of frameHoles) {
        if (frame.numbers && (h.edge === 'top' || h.edge === 'bottom')) {
          const ty = h.edge === 'top' ? Y(h.z) + h.r + 2.4 : Y(h.z) - h.r - 1.2;
          g.fillText(String(h.i + 1), X(h.x), ty);
        }
        if (frame.letters && (h.edge === 'left' || h.edge === 'right')) {
          const tx = h.edge === 'left' ? X(h.x) + h.r + 2.2 : X(h.x) - h.r - 2.2;
          g.fillText(String.fromCharCode(64 + h.j), tx, Y(h.z) + 0.6);
        }
      }
      g.textAlign = 'left';
    }
    if (silk) {
      g.fillStyle = dark ? '#e8e6df' : '#1d1d1f';
      g.strokeStyle = g.fillStyle;
      g.lineWidth = 0.18;
      silk(g, w, d, X, Y);
    }
  }, pxPerMm);
  tex.repeat.set(1 / width, 1 / depth);
  tex.offset.set(0.5, 0.5);

  const top = (dark ? M.pcbBlack : M.pcbWhite).clone();
  top.map = tex;
  top.color.set(0xffffff);
  const board = mesh(geo, [top, dark ? M.pcbEdgeDark : M.pcbEdgeLight]);
  board.name = 'pcb';
  const group = new THREE.Group();
  group.add(board);
  group.userData = { thickness, frameHoles, holes: allHoles };
  return group;
}

// 물결 외곽선: 가장자리 가까이 있는 구멍마다 볼록, 구멍 사이는 dep만큼 오목 (구멍이 없는 변은 곧게)
export function scallopOutline(width, depth, holes, { dep = 1.2, half = 2.65, near = 4.5, N = 160 } = {}) {
  const w = width / 2, d = depth / 2, pts = [];
  const edges = [
    { a: [-w, -d], b: [w, -d], n: [0, 1], pos: (h) => h.x, dist: (h) => h.z + d },
    { a: [w, -d], b: [w, d], n: [-1, 0], pos: (h) => h.z, dist: (h) => w - h.x },
    { a: [w, d], b: [-w, d], n: [0, -1], pos: (h) => h.x, dist: (h) => d - h.z },
    { a: [-w, d], b: [-w, -d], n: [1, 0], pos: (h) => h.z, dist: (h) => h.x + w },
  ];
  for (const e of edges) {
    const on = holes.filter((h) => e.dist(h) < near).map(e.pos);
    for (let k = 0; k < N; k++) {
      const t = k / N, x = e.a[0] + (e.b[0] - e.a[0]) * t, z = e.a[1] + (e.b[1] - e.a[1]) * t;
      let off = 0;
      if (on.length) {
        const p = e.n[0] === 0 ? x : z;
        const m = Math.min(...on.map((q) => Math.abs(q - p)));
        off = dep * Math.min(1, m / half) ** 2;
      }
      pts.push([x + e.n[0] * off, z + e.n[1] * off]);
    }
  }
  return pts;
}
