import * as THREE from 'three';
import { makePcb } from '../../../kit/pcb.js';
import { led, pinHeader, box } from '../../../kit/components.js';
import { M, mesh } from '../../../kit/materials.js';
import { FONT } from '../../../kit/textures.js';
import spec from './spec.js';

// 위쪽 · 양옆에 프레임 구멍, 가운데 검은 케이스와 둥근 창(센서 + 흰 LED)
export function build() {
  const T = 1.6;
  const { x: W, z: D } = spec.size;
  const holes = [];
  for (let i = 0; i < 9; i++) holes.push({ x: -22 + i * 5.5, z: -22, r: 1.7, ring: true });
  for (let j = 1; j < 9; j++) for (const x of [-22, 22]) holes.push({ x, z: -22 + j * 5.5, r: 1.7, ring: true });
  const root = new THREE.Group();
  root.add(makePcb({
    width: W, depth: D, color: 'black', holes,
    silk: (g, w, d, X, Y) => {
      g.font = `700 1.5px ${FONT}`;
      g.textAlign = 'center';
      'ABCDEFGHI'.split('').forEach((ch, i) => g.fillText(ch, X(-22 + i * 5.5), Y(-24.4)));
      for (let j = 0; j < 9; j++) { g.fillText(String(j + 1), X(-19.2), Y(-22 + j * 5.5) + 0.5); g.fillText(String(j + 1), X(19.2), Y(-22 + j * 5.5) + 0.5); }
      g.textAlign = 'left';
    },
  }));
  // 검은 케이스 + 창
  const housing = new THREE.Group();
  const shape = new THREE.Shape();
  // 사진처럼 옆 구멍 줄 사이를 거의 다 덮는 큰 케이스 (36 × 36, 모서리 둥글게)
  const hw = 18, z0 = -18, z1 = 18.5, rc = 3;
  shape.moveTo(-hw + rc, z0); shape.lineTo(hw - rc, z0); shape.quadraticCurveTo(hw, z0, hw, z0 + rc);
  shape.lineTo(hw, z1 - rc); shape.quadraticCurveTo(hw, z1, hw - rc, z1); shape.lineTo(-hw + rc, z1);
  shape.quadraticCurveTo(-hw, z1, -hw, z1 - rc); shape.lineTo(-hw, z0 + rc); shape.quadraticCurveTo(-hw, z0, -hw + rc, z0);
  const win = new THREE.Path(); win.moveTo(-4, -6); win.lineTo(-4, 2); win.lineTo(4, 2); win.lineTo(4, -6); win.closePath(); shape.holes.push(win);
  // 창 둘레 방향 표시 (작은 삼각 홈)
  for (const [x, z] of [[0, -9.5], [0, 5.5], [-7.5, -2], [7.5, -2]]) { const t = new THREE.Path(); t.absarc(x, z, 0.8, 0, Math.PI * 2, true); shape.holes.push(t); }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 6.4, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelSegments: 2 });
  geo.rotateX(Math.PI / 2); geo.translate(0, 6.4, 0);
  housing.add(mesh(geo, M.matteBlack));
  housing.position.set(0, T, 0);
  root.add(housing);
  // 케이스 위 로고
  const logo = mesh(new THREE.PlaneGeometry(20, 4), new THREE.MeshBasicMaterial({ transparent: true,
    map: (() => { const c = document.createElement('canvas'); c.width = 400; c.height = 80; const g = c.getContext('2d'); g.fillStyle = '#3a3b3f'; g.font = 'italic 900 56px sans-serif'; g.fillText('ROBOROBO', 10, 62); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })() }), { cast: false });
  logo.rotation.x = -Math.PI / 2;
  logo.position.set(0, T + 7.05, 11);
  root.add(logo);
  // 창 안: 센서 칩 + 흰 LED
  root.add(box(4, 1, 4, M.chip, -1, T, 0));
  const chipFace = mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshStandardMaterial({ color: 0x6f5b3a, roughness: 0.3, metalness: 0.4 }), { cast: false });
  chipFace.rotation.x = -Math.PI / 2;
  chipFace.position.set(-1, T + 1.02, 0);
  root.add(chipFace);
  const white = led({ smd: true, color: 0xfff6e8 });
  white.position.set(2.6, T, 0);
  root.add(white);
  const conn = pinHeader({ cols: 4, above: 5, below: 2 });
  conn.position.set(0, T, 21);
  root.add(conn);
  // 측정 대상 (색 판, 크기 측정에서 뺀다)
  const sample = mesh(new THREE.BoxGeometry(18, 1, 18), new THREE.MeshStandardMaterial({ color: 0xd42a22, roughness: 0.6 }));
  sample.position.set(0, T + 14, 0);
  sample.userData.noBounds = true;
  root.add(sample);
  return {
    object3d: root,
    labels: [
      { name: 'COLOR SENSOR', sub: 'RGB 측정 칩', object: chipFace, anchor: [0, 0, 0], off: [-150, -60] },
      { name: 'WHITE LED', sub: '물체 비춤', object: white, anchor: [0, 1, 0], off: [70, -70] },
      { name: 'HOUSING', sub: '바깥 빛 차단', object: housing, anchor: [15, 6, 0], off: [70, 20] },
      { name: 'SIGNAL', sub: 'CPU 보드 연결', object: conn, anchor: [0, 6, 0], off: [-120, 40] },
    ],
    handles: { sample, white, T },
  };
}
