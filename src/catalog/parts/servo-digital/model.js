import * as THREE from 'three';
import { makeMotorCase } from '../../../kit/motorCase.js';
import { M, mesh } from '../../../kit/materials.js';

export function build() {
  const root = new THREE.Group();
  const motor = makeMotorCase({ shaft: 'top', hubColor: M.whitePlastic });
  root.add(motor);
  const { hub } = motor.userData.hubs[0];
  // 각도를 보여주는 흰 팔 (서보 혼)
  const arm = new THREE.Group();
  const bar = mesh(new THREE.BoxGeometry(22, 1.6, 5), M.whitePlastic);
  bar.position.x = 7;
  const tip = mesh(new THREE.CylinderGeometry(2.5, 2.5, 1.6, 20), M.whitePlastic);
  tip.position.x = 18;
  arm.add(bar, tip);
  arm.position.copy(hub.position).add(new THREE.Vector3(0, 6.2, 0));
  arm.userData.noBounds = true;
  root.add(arm);
  return {
    object3d: root,
    labels: [
      { name: 'SERVO HORN', sub: '각도 출력 · 0~180°', object: arm, anchor: [18, 1, 0], off: [60, -60] },
      { name: 'MOUNT EARS', sub: '모터가이드 고정', object: motor, anchor: [-27, 24, 0], off: [-120, -50] },
      { name: 'CABLE', sub: '신호 · + · -', object: motor, anchor: [42, 19, 10], off: [40, 60] },
    ],
    handles: { arm, hub },
  };
}
