import * as THREE from 'three';
import { materials } from '../../../materials/index.js';

// 4장 날개 노즐: 닫히면 원뿔, 열리면 꽃처럼 벌어진다. +Y 방향.
export class Nozzle {
  constructor(s, flaps = 4) {
    this.object3d = new THREE.Group();
    this.object3d.name = 'nozzle';
    this.flaps = [];
    const baseR = 0.88 * s;
    const gap = 0.08;
    const len = (Math.PI * 2) / flaps;
    for (let i = 0; i < flaps; i++) {
      const start = i * len + gap / 2;
      const center = start + (len - gap) / 2;
      const dir = new THREE.Vector3(Math.sin(center), 0, Math.cos(center));
      const geo = new THREE.CylinderGeometry(0.36 * s, baseR, 1.0 * s, 10, 1, true, start, len - gap);
      geo.translate(0, 0.5 * s, 0);

      const pivot = new THREE.Group();
      pivot.position.copy(dir).multiplyScalar(baseR);
      const outer = new THREE.Mesh(geo, materials.shell);
      const inner = new THREE.Mesh(geo, materials.shellInner);
      for (const m of [outer, inner]) { m.position.copy(dir).multiplyScalar(-baseR); m.castShadow = true; pivot.add(m); }
      // 날개 끝 빨간 띠
      const tip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.37 * s, 0.42 * s, 0.12 * s, 10, 1, true, start, len - gap),
        materials.accent,
      );
      tip.position.copy(dir).multiplyScalar(-baseR);
      tip.position.y = 0.93 * s;
      pivot.add(tip);

      pivot.userData.axis = new THREE.Vector3(Math.cos(center), 0, -Math.sin(center));
      this.flaps.push(pivot);
      this.object3d.add(pivot);
    }
  }

  setOpen(t) {
    for (const f of this.flaps) f.quaternion.setFromAxisAngle(f.userData.axis, t * 1.05);
  }
}
