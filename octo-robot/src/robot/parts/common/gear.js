import * as THREE from 'three';
import { cachedGeometry } from './geometryCache.js';

// 톱니바퀴 도형: XY 평면에 그리고 +Z 방향으로 두께를 준다.
export function gearGeometry({ teeth = 16, radius = 1, toothDepth = 0.12, hole = 0.4, thickness = 0.15 } = {}) {
  const key = `gear.${teeth}.${radius}.${toothDepth}.${hole}.${thickness}`;
  return cachedGeometry(key, () => {
    const shape = new THREE.Shape();
    const inner = radius - toothDepth;
    const steps = teeth * 4;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const phase = i % 4;
      const r = phase === 1 || phase === 2 ? radius : inner;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    if (hole > 0) {
      const h = new THREE.Path();
      h.absarc(0, 0, hole, 0, Math.PI * 2, true);
      shape.holes.push(h);
    }
    const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 24 });
    g.translate(0, 0, -thickness / 2);
    return g;
  });
}
