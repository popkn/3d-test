import * as THREE from 'three';
import { makeSBoard, S_BOARD } from '../../../kit/sBoard.js';
import { magneticBuzzer, smd } from '../../../kit/components.js';

export function build() {
  const root = new THREE.Group();
  const board = makeSBoard();
  root.add(board);
  const T = S_BOARD.thickness;
  const buzzer = magneticBuzzer({ dia: 12, height: 9.5 });
  buzzer.position.set(0, T, 2.2);
  root.add(buzzer);
  const r = smd('res'); r.position.set(5.2, T, -8.4); root.add(r);

  // 소리 파동 (울릴 때 퍼져 나가는 고리)
  const waves = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(6, 0.18, 6, 48), new THREE.MeshBasicMaterial({ color: 0xe8432a, transparent: true, opacity: 0 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, T + 9.7, 2.2);
    ring.userData.noBounds = true;
    root.add(ring);
    waves.push(ring);
  }

  return {
    object3d: root,
    labels: [
      { name: 'MAGNETIC BUZZER', sub: '삑 소리 발생', object: buzzer, anchor: [0, 9.5, 0], off: [70, -70] },
      { name: '3P HEADER', sub: 'S · V · G', object: board.userData.header, anchor: [0, 10, 0], off: [-110, -50] },
      { name: 'MOUNT HOLES', sub: '1 · 2 · 3', object: board, anchor: [0, 1.6, 11.8], off: [-120, 60] },
    ],
    handles: { buzzer, waves },
  };
}
