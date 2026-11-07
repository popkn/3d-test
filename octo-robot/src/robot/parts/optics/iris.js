import * as THREE from 'three';
import { materials } from '../../../materials/index.js';
import { gearGeometry } from '../common/index.js';

// 조리개: 톱니 고리 + 조리개 날개 9장 + 가운데 검은 렌즈와 빛나는 동공
export class Iris {
  constructor(s, blades = 9) {
    this.object3d = new THREE.Group();
    this.object3d.name = 'iris';

    const ring = new THREE.Mesh(
      gearGeometry({ teeth: 28, radius: 0.62 * s, toothDepth: 0.05 * s, hole: 0.46 * s, thickness: 0.05 * s }),
      materials.metalDark,
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2 * s;
    this.ring = ring;
    this.object3d.add(ring);

    // 날개: 바깥쪽 끝을 축으로 돌아서 구멍 크기를 바꾼다
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(-0.34 * s, 0.05 * s);
    shape.lineTo(-0.36 * s, 0.2 * s);
    shape.lineTo(-0.04 * s, 0.17 * s);
    shape.closePath();
    const bladeGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.012 * s, bevelEnabled: false });
    this.blades = [];
    for (let i = 0; i < blades; i++) {
      const holder = new THREE.Group();
      holder.rotation.y = (i / blades) * Math.PI * 2;
      holder.position.y = 0.18 * s + (i % 2) * 0.008 * s;
      const pivot = new THREE.Group();
      pivot.position.x = 0.5 * s;
      pivot.rotation.x = -Math.PI / 2;
      const blade = new THREE.Mesh(bladeGeo, i % 3 === 0 ? materials.metal : materials.metalDark);
      pivot.add(blade);
      holder.add(pivot);
      this.blades.push(pivot);
      this.object3d.add(holder);
    }

    const pupilLens = new THREE.Mesh(new THREE.SphereGeometry(0.3 * s, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), materials.lens);
    pupilLens.position.y = 0.1 * s;
    this.object3d.add(pupilLens);

    this.glow = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 16, 12), materials.accentGlow);
    this.glow.position.y = 0.38 * s;
    this.object3d.add(this.glow);

    this.setAperture(0.6);
  }

  // 0 = 닫힘, 1 = 활짝 열림
  setAperture(a) {
    for (const b of this.blades) b.rotation.z = -0.15 + (1 - a) * 0.6;
  }

  update(t) {
    this.ring.rotation.z = t * 0.2;
    this.glow.scale.setScalar(0.85 + Math.sin(t * 3) * 0.15);
  }
}
