import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';

// 그랩 하나: 뒤쪽 몸통(구멍 줄) + 앞으로 뻗은 빗살 5개 (끝이 가늘어진다). 앞쪽 = +Z
export function makeGrab(mat) {
  const g = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(22, 10, 12), mat);
  body.position.set(0, 5, -10);
  g.add(body);
  const dark = new THREE.MeshStandardMaterial({ color: 0x55585e, roughness: 0.6 });
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 8; c++) {
      const h = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 10), dark, { cast: false });
      h.position.set(-8.4 + c * 2.4, 10.02, -13 + r * 2.4);
      g.add(h);
    }
  }
  for (let i = 0; i < 5; i++) {
    const tooth = mesh(new THREE.CylinderGeometry(0.9, 1.7, 20, 8), mat);
    tooth.rotation.x = Math.PI / 2;
    tooth.position.set(-8 + i * 4, 5 - (i % 2) * 0.5, 6);
    tooth.scale.y = 1;
    g.add(tooth);
  }
  return g;
}

export function build() {
  const root = new THREE.Group();
  const gray = new THREE.MeshStandardMaterial({ color: 0x8e9196, roughness: 0.55 });
  const grab = makeGrab(gray);
  root.add(grab);
  // 집게 시연용: 마주 보는 두 번째 그랩 + 탁구공 (크기 측정에서 뺀다)
  const pair = makeGrab(gray);
  pair.rotation.y = Math.PI;
  pair.userData.noBounds = true;
  pair.visible = false;
  root.add(pair);
  const ball = mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshStandardMaterial({ color: 0xf5f3ec, roughness: 0.4 }));
  ball.userData.noBounds = true;
  ball.visible = false;
  root.add(ball);
  return {
    object3d: root,
    labels: [
      { name: 'MOUNT BODY', sub: '고정 구멍', object: grab, anchor: [0, 10, -10], off: [-120, -50] },
      { name: 'TEETH ×5', sub: '물체를 감싸 쥠', object: grab, anchor: [0, 5, 16], off: [60, 40] },
    ],
    handles: { grab, pair, ball },
  };
}
