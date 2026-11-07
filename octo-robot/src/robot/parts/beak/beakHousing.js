import * as THREE from 'three';
import { materials } from '../../../materials/index.js';
import { spherePatch, createRivetField, placeOnSphereRow } from '../common/index.js';

// 부리 덮개: 몸체 맨 아래의 검은 반구. 앞뒤 두 쪽으로 갈라져 열린다.
export class BeakHousing {
  constructor(radius) {
    this.object3d = new THREE.Group();
    this.object3d.name = 'beakHousing';
    this.halves = [];
    const R = radius;
    // 앞쪽 반(경도 0~PI, +Z 쪽), 뒤쪽 반(경도 PI~2PI)
    for (const [side, lonA] of [[1, 0], [-1, Math.PI]]) {
      const pivot = new THREE.Group();
      pivot.position.z = side * R * 0.98;
      const content = new THREE.Group();
      content.position.z = -pivot.position.z;
      pivot.add(content);

      const lonB = lonA + Math.PI;
      content.add(spherePatch(R, lonA, lonB, Math.PI / 2, Math.PI, materials.metalDark));
      content.add(spherePatch(R * 0.97, lonA, lonB, Math.PI / 2, Math.PI, materials.darkInner));
      const lonC = lonA + Math.PI / 2;
      content.add(spherePatch(R + 0.003, lonC - 0.3, lonC + 0.3, Math.PI / 2 + 0.42, Math.PI / 2 + 0.56, materials.accent));
      content.add(createRivetField(placeOnSphereRow({
        radius: R, latitude: -0.15, count: 10, offsetAngle: lonA + 0.12, arc: Math.PI - 0.24,
      }), { material: materials.metal }));

      pivot.userData.side = side;
      this.halves.push(pivot);
      this.object3d.add(pivot);
    }
  }

  setOpen(t) {
    for (const h of this.halves) h.rotation.x = -h.userData.side * t * 1.4;
  }
}
