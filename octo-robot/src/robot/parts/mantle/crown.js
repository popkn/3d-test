import * as THREE from 'three';
import { materials } from '../../../materials/index.js';
import { spherePatch, createCap, createRivetField, placeOnSphereRow } from '../common/index.js';

// 머리 꼭대기 덮개: 꽃잎판들이 모이는 정수리. 맨틀이 열리면 위로 들린다.
export class Crown {
  constructor({ radius, theta, thickness }) {
    this.object3d = new THREE.Group();
    this.object3d.name = 'crown';
    const R = radius;

    this.object3d.add(spherePatch(R + 0.004, 0, Math.PI * 2, 0, theta, materials.shell, 0.1));
    this.object3d.add(spherePatch(R - thickness, 0, Math.PI * 2, 0, theta, materials.shellInner, 0.1));

    // 둘레 테두리
    const rimR = Math.sin(theta) * R;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(rimR, 0.014, 8, 48), materials.metalDark);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = Math.cos(theta) * R;
    this.object3d.add(rim);

    // 가운데 해치 캡
    const cap = createCap({ radius: 0.07, bolts: 4 });
    cap.position.y = R + 0.0;
    this.object3d.add(cap);

    this.object3d.add(createRivetField(placeOnSphereRow({
      radius: R + 0.004, latitude: Math.PI / 2 - theta * 0.6, count: 10,
    })));
    this.baseY = 0;
  }

  setOpen(t) {
    this.object3d.position.y = this.baseY + t * 0.38;
  }
}
