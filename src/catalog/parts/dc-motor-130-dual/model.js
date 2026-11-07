import * as THREE from 'three';
import { makeMotorCase, attachWheel } from '../../../kit/motorCase.js';
import { M } from '../../../kit/materials.js';

export function build() {
  const root = new THREE.Group();
  const motor = makeMotorCase({ shaft: 'dual', hubColor: M.bluePlastic, sticker: { color: '#2b6fd6', text: 'DC', sub: 'DUAL AXIS' } });
  root.add(motor);
  const wheel = attachWheel(motor);
  const hubs = motor.userData.hubs;
  return {
    object3d: root,
    labels: [
      { name: 'OUTPUT SHAFT', sub: '130 rpm · 6V', object: hubs[0].hub, anchor: [0, 5, 0], off: [70, -60] },
      { name: 'MOUNT EARS', sub: '고정 구멍 4개', object: motor, anchor: [-27, 24, 0], off: [-120, -50] },
      { name: 'POWER LEAD', sub: '빨강(+) · 검정(-)', object: motor, anchor: [42, 19, 10], off: [40, 60] },
    ],
    handles: { hubs, wheel },
  };
}
