import * as THREE from 'three';
import { materials } from '../../../materials/index.js';
import {
  spherePatch, spherePatchWithHole, directionFrom,
  createRivetField, placeOnSphereRow, placeOnSphereMeridian,
} from '../common/index.js';

// 머리 위쪽 껍데기의 꽃잎판 하나.
// 아래 끝(적도 쪽)에 경첩이 있어서 setOpen()으로 바깥쪽으로 젖혀진다.
export class ShellPetal {
  constructor({ index, lonA, lonB, thetaTop, thetaBottom, radius, thickness, hasWindow, hasDecal, openAngle }) {
    this.index = index;
    this.openAngle = openAngle;
    const lonC = (lonA + lonB) / 2;
    const width = lonB - lonA;
    const R = radius;

    // 경첩: 꽃잎판 아래 가운데. 회전축은 그 지점에서 수평 접선 방향.
    const hinge = directionFrom(lonC, Math.PI / 2 - thetaBottom).multiplyScalar(R);
    this.axis = new THREE.Vector3(-Math.sin(lonC), 0, Math.cos(lonC));

    this.object3d = new THREE.Group();
    this.object3d.name = `petal${index}`;
    this.object3d.position.copy(hinge);
    this.hinge = hinge.clone();
    this.outward = new THREE.Vector3(Math.cos(lonC), 0.35, Math.sin(lonC)).normalize();

    // 내용물은 머리 중심 기준 좌표로 만들고, 경첩만큼 되돌려 놓는다
    const content = new THREE.Group();
    content.position.copy(hinge).negate();
    this.object3d.add(content);

    const outer = [lonA, lonB, thetaTop, thetaBottom];
    const hole = [
      lonA + width * 0.24, lonB - width * 0.24,
      thetaTop + (thetaBottom - thetaTop) * 0.25, thetaTop + (thetaBottom - thetaTop) * 0.62,
    ];

    if (hasWindow) {
      content.add(spherePatchWithHole(R, outer, hole, materials.shell));
      content.add(spherePatchWithHole(R - thickness, outer, hole, materials.shellInner));
      // 창문 유리와 창틀 (창틀은 안쪽으로 살짝 들어간 어두운 테두리)
      content.add(spherePatch(R - thickness * 0.5, ...hole, materials.glass));
      const frame = [hole[0] - 0.012, hole[1] + 0.012, hole[2] - 0.012, hole[3] + 0.012];
      content.add(spherePatchWithHole(R + 0.002, frame, hole, materials.metalDark));
    } else {
      content.add(spherePatch(R, ...outer, materials.shell));
      content.add(spherePatch(R - thickness, ...outer, materials.shellInner));
    }

    // 빨간 표시 판
    if (hasDecal) {
      const t0 = thetaTop + (thetaBottom - thetaTop) * 0.7;
      content.add(spherePatch(R + 0.003, lonC - width * 0.22, lonC + width * 0.22, t0, t0 + 0.08, materials.accent));
    }
    // 아래쪽 검은 이음선
    content.add(spherePatch(R + 0.002, lonA, lonB, thetaBottom - 0.06, thetaBottom - 0.05, materials.metalDark));

    // 테두리를 따라 리벳
    const latTop = Math.PI / 2 - thetaTop;
    const latBottom = Math.PI / 2 - thetaBottom;
    const rivets = [
      ...placeOnSphereMeridian({ radius: R, longitude: lonA + 0.03, count: 11, latFrom: latBottom + 0.04, latTo: latTop - 0.04 }),
      ...placeOnSphereMeridian({ radius: R, longitude: lonB - 0.03, count: 11, latFrom: latBottom + 0.04, latTo: latTop - 0.04 }),
      ...placeOnSphereRow({ radius: R, latitude: latBottom + 0.1, count: 6, offsetAngle: lonA + 0.08, arc: width - 0.16 }),
    ];
    if (hasWindow) {
      const hLatTop = Math.PI / 2 - hole[2] + 0.035;
      const hLatBottom = Math.PI / 2 - hole[3] - 0.035;
      rivets.push(
        ...placeOnSphereRow({ radius: R, latitude: hLatTop, count: 4, offsetAngle: hole[0], arc: hole[1] - hole[0] }),
        ...placeOnSphereRow({ radius: R, latitude: hLatBottom, count: 4, offsetAngle: hole[0], arc: hole[1] - hole[0] }),
      );
    }
    content.add(createRivetField(rivets));
  }

  // 0 = 닫힘, 1 = 활짝 열림
  setOpen(t) {
    this.object3d.quaternion.setFromAxisAngle(this.axis, -t * this.openAngle);
  }

  // 분해: 경첩 자리에서 바깥으로 떨어져 나간다 (distance = 이동 거리)
  setDetach(distance) {
    this.object3d.position.copy(this.hinge).addScaledVector(this.outward, distance);
  }
}
