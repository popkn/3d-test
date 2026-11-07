import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';
import { cornerBolts } from '../../../kit/frame.js';

export function build() {
  const root = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(-22.5, -30); s.lineTo(22.5, -30); s.lineTo(22.5, 30); s.lineTo(-22.5, 30); s.closePath();
  const holes = [];
  for (let i = 0; i < 4; i++) { const x = -15 + i * 10; const h = new THREE.Path(); h.absarc(x, 26, 1.6, 0, Math.PI * 2, true); s.holes.push(h); holes.push({ x, z: -26 }); }
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.6, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  const plate = mesh(g, new THREE.MeshPhysicalMaterial({ color: 0xeaf2f6, transparent: true, opacity: 0.45, roughness: 0.05, clearcoat: 1, depthWrite: false }));
  plate.renderOrder = 2;
  root.add(plate);
  const frame = new THREE.Group();
  frame.userData = { holes };
  const bolts = cornerBolts(frame, 1.6 + 6);
  bolts.forEach((b) => root.add(b));
  return {
    object3d: root,
    labels: [{ name: 'PC FRAME', sub: '투명 폴리카보네이트', object: plate, anchor: [22.5, 1.6, 0], off: [60, -40] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '4개 (한쪽 가장자리)', use: '투명 덮개 · 창문 · 깃발' } },
  };
}
