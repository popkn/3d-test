import * as THREE from 'three';
import { BeakHousing } from './beakHousing.js';
import { Jaw } from './jaw.js';
import { RadulaRing } from './radulaRing.js';

// 부리 조립: 덮개가 갈라지고 → 턱이 아래로 나오며 벌어지고 → 톱니가 돈다.
export class Beak {
  constructor({ housingRadius }) {
    this.object3d = new THREE.Group();
    this.object3d.name = 'beak';

    this.housing = new BeakHousing(housingRadius);
    this.object3d.add(this.housing.object3d);

    this.mechanism = new THREE.Group();
    this.mechanism.name = 'beakMechanism';
    this.object3d.add(this.mechanism);

    this.radula = new RadulaRing();
    this.radula.object3d.position.y = -0.1;
    this.mechanism.add(this.radula.object3d);

    this.jaws = [new Jaw(1), new Jaw(-1)];
    for (const j of this.jaws) this.mechanism.add(j.object3d);
    this.open = 0;
  }

  setOpen(t) {
    this.open = t;
    const shell = THREE.MathUtils.smoothstep(t, 0, 0.5);
    const jaws = THREE.MathUtils.smoothstep(t, 0.35, 1);
    this.housing.setOpen(shell);
    this.mechanism.position.y = -jaws * 0.16;
    for (const j of this.jaws) j.setOpen(jaws);
  }

  update(t, dt) {
    this.radula.update(dt, this.open * 3);
  }
}
