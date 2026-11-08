import * as THREE from 'three';
import { M, mesh } from '../../../kit/materials.js';
import { hexNutGeometry, makeBolt } from '../../../kit/fasteners.js';

// 검은 플라스틱 막대 (약 38 × 9 × 3.5, 육각 혹 4개). 윗면에 너트가 들어가는 육각 홈, 가운데 M3 구멍.
export function build() {
  const L = 40, W = 8, T = 3.5;
  const root = new THREE.Group();
  // 외곽: 사진처럼 너트 홈마다 육각 혹 (꼭짓점이 위아래), 사이는 좁은 다리
  const xs = [-15, -5, 5, 15], R = 4.6, F = R * Math.cos(Math.PI / 6), B = R / 2;
  const s = new THREE.Shape();
  s.moveTo(xs[0] - F, -B);
  for (const x of xs) { s.lineTo(x - F, B); s.lineTo(x, R); s.lineTo(x + F, B); }
  s.lineTo(xs[3] + F, -B);
  for (const x of [...xs].reverse()) { s.lineTo(x + F, -B); s.lineTo(x, -R); s.lineTo(x - F, -B); }
  s.closePath();
  for (const x of xs) { const h = new THREE.Path(); h.absarc(x, 0, 1.6, 0, Math.PI * 2, true); s.holes.push(h); }
  const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  const bar = mesh(g, M.blackPlastic);
  root.add(bar);
  // 육각 홈 (윗면에서 2mm 깊이, 안쪽을 어둡게)
  const pocketMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.8 });
  for (const x of xs) {
    const p = mesh(hexNutGeometry({ af: 5.7, thickness: 0.1, hole: 1.6 }), pocketMat, { cast: false });
    p.position.set(x, T - 0.05, 0);
    root.add(p);
  }
  // 끼워 넣을 너트 4개 + 볼트 1개 (시연용)
  const nuts = xs.map((x) => {
    const n = mesh(hexNutGeometry({ af: 5.5, thickness: 2.4 }), M.metal);
    n.position.set(x, T + 8, 0);
    n.userData.noBounds = true;
    n.visible = false;
    root.add(n);
    return n;
  });
  const bolt = makeBolt({ length: 6 });
  bolt.rotation.x = Math.PI; // 아래에서 위로
  bolt.position.set(xs[1], -12, 0);
  bolt.userData.noBounds = true;
  bolt.visible = false;
  root.add(bolt);
  return {
    object3d: root,
    labels: [
      { name: 'NUT POCKET ×4', sub: '육각 홈 · 10mm 간격', object: bar, anchor: [15, T, 0], off: [60, -60] },
      { name: 'M3 HOLE', sub: '볼트가 지나가는 구멍', object: bar, anchor: [-15, T, 0], off: [-120, -50] },
    ],
    frameWith: [bolt, ...nuts],
    handles: { nuts, bolt, T },
  };
}
