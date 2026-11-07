import * as THREE from 'three';
import { makePcb } from '../../../kit/pcb.js';
import { usbB, qfn, femaleHeader, pinHeader, slideSwitch, led, smd, box } from '../../../kit/components.js';
import { M, mesh } from '../../../kit/materials.js';
import { FONT } from '../../../kit/textures.js';
import spec from './spec.js';

// 파란 기판 + 아래 투명 덮개(3mm). 왼쪽 BLUETOOTH_1, 오른쪽 BLUETOOTH_2 소켓, 가운데 USB-B와 CP2102
export function build() {
  const { x: W, z: D } = spec.size;
  const COVER = 3, T = 1.6;
  const root = new THREE.Group();
  const cover = mesh(new THREE.BoxGeometry(W, 1.5, D), new THREE.MeshStandardMaterial({ color: 0xb8c2cc, transparent: true, opacity: 0.6, roughness: 0.3 }));
  cover.position.y = 0.75;
  root.add(cover);
  for (const [x, z] of [[-W / 2 + 3, -D / 2 + 3], [W / 2 - 3, -D / 2 + 3], [-W / 2 + 3, D / 2 - 3], [W / 2 - 3, D / 2 - 3]]) {
    const s = mesh(new THREE.CylinderGeometry(1.6, 1.6, COVER, 6), M.brass);
    s.position.set(x, COVER / 2, z);
    root.add(s);
  }
  const board = new THREE.Group();
  board.position.y = COVER;
  root.add(board);
  const pcb = makePcb({
    width: W, depth: D, color: 'black',
    silk: (g, w, d, X, Y) => {
      g.fillStyle = '#1b4fb3'; g.fillRect(0, 0, w, d); // 파란 기판
      g.fillStyle = '#ffffff';
      g.font = `700 3px ${FONT}`; g.fillText('WirelessBoard2', X(-10), Y(-15.5));
      g.font = `700 1.4px ${FONT}`;
      g.fillText('ANTENA', X(-26), Y(-11)); g.fillText('ANTENA', X(17), Y(-11));
      g.fillText('BT1', X(-8), Y(-6)); g.fillText('BT2', X(4), Y(-6));
      g.fillText('BLUETOOTH_1', X(-28), Y(17)); g.fillText('BLUETOOTH_2', X(16), Y(17));
      g.font = `600 1.1px ${FONT}`;
      g.fillText('STATUS  POWER', X(-28), Y(19.6)); g.fillText('POWER  STATUS', X(16), Y(19.6));
    },
  });
  board.add(pcb);
  const place = (o, x, z, rot = 0) => { o.position.set(x, T, z); o.rotation.y = rot; board.add(o); return o; };
  const usb = place(usbB(), 0, 14, Math.PI / 2);
  place(qfn({ size: 5, pins: 28, lines: ['CP2102'] }), 4, -12);
  place(slideSwitch({}), -1, -6);
  const sock1 = place(femaleHeader({ cols: 2, rows: 6, height: 8 }), -24, 2);
  const sock2 = place(femaleHeader({ cols: 2, rows: 6, height: 8 }), 24, 2);
  place(pinHeader({ cols: 3, rows: 2, above: 5, below: 1.5 }), -22, -17);
  place(pinHeader({ cols: 3, rows: 2, above: 5, below: 1.5 }), 22, -17);
  const ledP1 = place(led({ smd: true, color: 0xff2a1a }), -24, 19);
  const ledS1 = place(led({ smd: true, color: 0x3b82f6 }), -28, 19);
  const ledP2 = place(led({ smd: true, color: 0xff2a1a }), 24, 19);
  const ledS2 = place(led({ smd: true, color: 0x3b82f6 }), 28, 19);
  for (const [x, z] of [[-14, -4], [-14, 0], [12, -4], [12, 0], [8, 4], [-8, 4]]) place(smd('res'), x, z);
  // 블루투스 모듈 (꽂으면 보인다)
  const modules = [sock1, sock2].map((s) => {
    const m = new THREE.Group();
    m.add(box(13, 1.6, 27, new THREE.MeshStandardMaterial({ color: 0x1a7f4b, roughness: 0.5 })));
    m.add(box(9, 1.2, 9, M.chip, 0, 1.6, -4));
    m.add(box(11, 0.4, 6, M.gold, 0, 1.6, -11));
    m.position.set(s.position.x, T + 8 + 4, s.position.z - 2);
    m.userData.noBounds = true;
    m.visible = false;
    board.add(m);
    return m;
  });
  return {
    object3d: root,
    labels: [
      { name: 'USB-B', sub: 'PC 연결 · 5V', object: usb, anchor: [0, 11, 0], off: [60, 50] },
      { name: 'BLUETOOTH_1', sub: '모듈 소켓', object: sock1, anchor: [0, 8, 0], off: [-130, -40] },
      { name: 'BLUETOOTH_2', sub: '모듈 소켓', object: sock2, anchor: [0, 8, 0], off: [70, -40] },
      { name: 'CP2102', sub: 'USB ↔ 시리얼', object: board, anchor: [4, T + 1, -12], off: [-40, -100] },
    ],
    frameWith: modules,
    handles: { modules, leds: { p: [ledP1, ledP2], s: [ledS1, ledS2] } },
  };
}
