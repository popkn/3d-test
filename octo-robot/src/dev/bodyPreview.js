import * as THREE from 'three';
import { bodyConfig } from '../robot/config/bodyConfig.js';
import { Mantle } from '../robot/parts/mantle/index.js';
import { Eye } from '../robot/parts/optics/index.js';
import { Siphon } from '../robot/parts/siphon/index.js';
import { Beak } from '../robot/parts/beak/index.js';
import { Hub } from '../robot/parts/hub/index.js';
import { directionFrom, faceAlong } from '../robot/parts/common/index.js';

// 확인용 몸체 조립 (팔 없음). 5단계에서 OctoRobot.js가 이 역할을 넘겨받는다.
export function createBodyPreview() {
  const C = bodyConfig;
  const root = new THREE.Group();
  root.name = 'bodyPreview';
  root.position.y = 1.9;

  const mantle = new Mantle(C);
  root.add(mantle.object3d);

  const hub = new Hub(C.hub);
  root.add(hub.object3d);

  const eyes = C.optics.longitudes.map((lon, i) => {
    const eye = new Eye({ size: C.optics.size, extend: C.optics.extend, name: i === 0 ? 'eyeLeft' : 'eyeRight' });
    const d = directionFrom(lon, C.optics.latitude);
    eye.object3d.position.copy(d).multiplyScalar(C.radius * C.optics.embed);
    faceAlong(eye.object3d, d);
    root.add(eye.object3d);
    return eye;
  });

  const siphon = new Siphon({ size: C.siphon.size });
  const sd = directionFrom(C.siphon.longitude, C.siphon.latitude);
  siphon.object3d.position.copy(sd).multiplyScalar(C.radius * 0.97);
  faceAlong(siphon.object3d, sd);
  root.add(siphon.object3d);

  const beak = new Beak({ housingRadius: C.beak.housingRadius });
  beak.object3d.position.y = C.beak.y;
  root.add(beak.object3d);

  const controls = {
    mantle: (t) => mantle.setOpen(t),
    optics: (t) => eyes.forEach((e) => { e.setExtend(t); e.setAperture(0.4 + t * 0.6); }),
    siphon: (t) => siphon.setOpen(t),
    beak: (t) => beak.setOpen(t),
  };

  function update(t, dt) {
    mantle.update(t, dt);
    eyes.forEach((e) => e.update(t));
    beak.update(t, dt);
  }

  return { object3d: root, controls, update, mounts: hub.mounts };
}
