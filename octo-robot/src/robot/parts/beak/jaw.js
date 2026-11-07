import * as THREE from 'three';
import { materials } from '../../../materials/index.js';
import { cachedGeometry } from '../common/geometryCache.js';

// 턱 하나: 갈고리 모양 판. 경첩은 (0,0), 끝은 아래쪽 안으로 휘어 있다.
function jawGeometry() {
  return cachedGeometry('beak.jaw', () => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(0.08, -0.1, 0.04, -0.22);
    s.quadraticCurveTo(-0.02, -0.31, -0.12, -0.3);
    s.quadraticCurveTo(-0.04, -0.24, -0.03, -0.14);
    s.quadraticCurveTo(-0.03, -0.05, 0, 0);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.12, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2, curveSegments: 12,
    });
    g.translate(0, 0, -0.06);
    return g;
  });
}

// side: 1 = 오른쪽 턱, -1 = 왼쪽 턱 (좌우 대칭)
export class Jaw {
  constructor(side) {
    this.object3d = new THREE.Group();
    this.object3d.name = side > 0 ? 'jawRight' : 'jawLeft';
    this.object3d.position.set(side * 0.12, -0.05, 0);
    this.object3d.scale.x = side;
    this.hinge = new THREE.Group();
    const mesh = new THREE.Mesh(jawGeometry(), materials.lens);
    mesh.castShadow = true;
    this.hinge.add(mesh);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 12), materials.metal);
    pin.rotation.x = Math.PI / 2;
    this.hinge.add(pin);
    this.object3d.add(this.hinge);
  }

  setOpen(t) {
    this.hinge.rotation.z = t * 0.7;
  }
}
