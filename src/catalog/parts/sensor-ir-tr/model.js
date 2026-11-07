import * as THREE from 'three';
import { makeEcvBoard, ECV } from '../../../kit/ecvBoard.js';
import { led, ceramicCap, smd } from '../../../kit/components.js';
import { M, mesh } from '../../../kit/materials.js';

export function build() {
  const T = ECV.thickness;
  const root = new THREE.Group();
  const board = makeEcvBoard({ name: 'ECV-IR', holeEdge: 'front', header: { x: 12, z: -6 } });
  root.add(board);
  const place = (o, x, z) => { o.position.set(x, T, z); root.add(o); return o; };
  const receiver = place(led({ dia: 3, color: 0x222228 }), -4, -6);  // 포토 트랜지스터 (검정)
  const emitter = place(led({ dia: 3, color: 0xb070ff }), 4, -6);    // 적외선 LED (투명, 켜지면 보라색으로 보여준다)
  place(ceramicCap({ dia: 3 }), 0, -5);
  const indicator = place(led({ smd: true, color: 0xff2a1a }), -15, -9);
  for (const [x, z, k] of [[-12, -9, 'res'], [-12, -6, 'sot23'], [-12, -2.5, 'res'], [-15, -3, 'res'], [-15, 0, 'sot23'], [-8, -1, 'res'], [-2, -10, 'res'], [3, -10, 'res']]) place(smd(k), x, z);

  // 감지 대상 판 (센서 위쪽, 거리 조절). 크기 측정에서 뺀다
  const target = mesh(new THREE.BoxGeometry(30, 1, 22), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }));
  target.position.set(0, 20, -4);
  target.userData.noBounds = true;
  target.visible = false;
  root.add(target);
  // 적외선 빔 (보이게 표시)
  const beam = mesh(new THREE.CylinderGeometry(0.6, 3, 1, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xb070ff, transparent: true, opacity: 0.25, depthWrite: false }), { cast: false });
  beam.userData.noBounds = true;
  root.add(beam);

  return {
    object3d: root,
    labels: [
      { name: 'IR LED', sub: 'D2 · 적외선 발광', object: emitter, anchor: [0, 4, 0], off: [60, -80] },
      { name: 'PHOTO TR', sub: 'Q1 · 반사광 수신', object: receiver, anchor: [0, 4, 0], off: [-110, -80] },
      { name: 'DETECT LED', sub: 'D1 · 감지 표시', object: indicator, anchor: [0, 1, 0], off: [-110, 40] },
      { name: '3P HEADER', sub: 'J1 · S · V · G', object: board.userData.header, anchor: [0, 7, 0], off: [70, 20] },
    ],
    handles: { emitter, receiver, indicator, target, beam, T },
  };
}
