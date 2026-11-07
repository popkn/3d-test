import * as THREE from 'three';
import { materials } from '../../../materials/index.js';
import { gearGeometry } from '../common/index.js';

// 라듈라 링: 부리 속 빨간 톱니바퀴 + 가운데 축. 부리가 열리면 돈다.
export class RadulaRing {
  constructor() {
    this.object3d = new THREE.Group();
    this.object3d.name = 'radulaRing';
    this.gear = new THREE.Mesh(
      gearGeometry({ teeth: 18, radius: 0.2, toothDepth: 0.04, hole: 0.07, thickness: 0.05 }),
      materials.accent,
    );
    this.gear.rotation.x = Math.PI / 2;
    this.gear.castShadow = true;
    this.object3d.add(this.gear);

    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.3, 16), materials.metalDark);
    spindle.position.y = -0.05;
    this.object3d.add(spindle);
  }

  update(dt, speed) {
    this.gear.rotation.z += dt * speed;
  }
}
