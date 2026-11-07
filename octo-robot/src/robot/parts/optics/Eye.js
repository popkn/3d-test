import * as THREE from 'three';
import { createEyeSocket } from './eyeSocket.js';
import { createIrRim } from './irRim.js';
import { createOuterDome } from './outerDome.js';
import { Iris } from './iris.js';

// 눈 하나 조립. +Z 방향을 바라본다.
// setExtend(t): 소켓 → 적외선 링 → 렌즈 덮개 → 조리개 순으로 층층이 앞으로 뽑혀 나온다.
export class Eye {
  constructor({ size, extend, name = 'eye' }) {
    this.object3d = new THREE.Group();
    this.object3d.name = name;
    this.extendDistances = extend;

    // 안쪽 부품은 +Y 방향으로 만들어져 있으므로 +Z로 눕힌다
    const inner = new THREE.Group();
    inner.rotation.x = Math.PI / 2;
    this.object3d.add(inner);

    this.iris = new Iris(size);
    this.layers = [
      createEyeSocket(size),
      createIrRim(size),
      createOuterDome(size),
      this.iris.object3d,
    ];
    for (const layer of this.layers) inner.add(layer);
  }

  setExtend(t) {
    this.layers.forEach((layer, i) => { layer.position.y = this.extendDistances[i] * t; });
  }

  setAperture(a) {
    this.iris.setAperture(a);
  }

  update(t) {
    this.iris.update(t);
  }
}
