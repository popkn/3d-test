import * as THREE from 'three';
import { createSiphonBase, createOuterSleeve, createInnerSleeve } from './sleeve.js';
import { Nozzle } from './nozzle.js';

// 사이펀(분사구) 조립. +Z 방향을 바라본다.
// setOpen(t): 안쪽 슬리브가 뽑혀 나오고 노즐 날개가 벌어진다.
export class Siphon {
  constructor({ size }) {
    this.size = size;
    this.object3d = new THREE.Group();
    this.object3d.name = 'siphon';
    const inner = new THREE.Group();
    inner.rotation.x = Math.PI / 2;
    this.object3d.add(inner);

    inner.add(createSiphonBase(size));
    inner.add(createOuterSleeve(size));
    this.innerSleeve = createInnerSleeve(size);
    inner.add(this.innerSleeve);
    this.nozzle = new Nozzle(size);
    this.nozzle.object3d.position.y = 1.45 * size;
    this.innerSleeve.add(this.nozzle.object3d);
  }

  setOpen(t) {
    const slide = THREE.MathUtils.smoothstep(t, 0, 0.6);
    const flare = THREE.MathUtils.smoothstep(t, 0.4, 1);
    this.innerSleeve.position.y = slide * 1.15 * this.size;
    this.nozzle.setOpen(flare);
  }
}
