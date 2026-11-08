import * as THREE from 'three';
import { build as buildShaft } from '../shaft-75/model.js';
import { build as buildWheelSet } from '../wheel-50-set/model.js';

// 축 = X, 가운데 높이 25 (바퀴 반지름). 바퀴는 축 끝 (가운데 x = ±30.5)
export function build() {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 25;
  root.add(spin);
  const shaft = buildShaft().object3d;
  shaft.position.y = -1.5;
  spin.add(shaft);
  const wheels = [-1, 1].map((s) => {
    const w = buildWheelSet().object3d;
    w.rotation.y = Math.PI / 2 * s;          // 바퀴 축 Z → X
    w.position.set(s * 30.5, -25, 0);
    spin.add(w);
    return w;
  });
  return {
    object3d: root,
    labels: [
      { name: 'AXLE SET', sub: '축 75 + 바퀴 Ø50 ×2', object: shaft, anchor: [0, 1.5, 0], off: [60, -60] },
      { name: 'FREE WHEEL', sub: '축에서 헛돎', object: wheels[1], anchor: [0, 25, 0], off: [60, 40] },
    ],
    handles: {
      spin, wheels,
      // 한쪽 바퀴만 (n = 1: +X 끝에만)
      setWheels(n) { wheels[0].visible = n >= 2; },
    },
  };
}
