import * as THREE from 'three';
import { makeSBoard, S_BOARD } from '../../../kit/sBoard.js';
import { led, axialResistor } from '../../../kit/components.js';

export function build() {
  const root = new THREE.Group();
  const board = makeSBoard({
    labels: [{ text: 'J2', x: -6.5, z: -6.2 }, { text: 'D1', x: 2.6, z: 1.8 }, { text: 'R1', x: 5.4, z: -6.6 },
      { text: 'ABCM', x: 1.2, z: -5.6, size: 0.9 }, { text: 'WWW.ROBOROBO.CO.KR', x: -8.2, z: 8.6, size: 1.05 }],
  });
  root.add(board);
  const T = S_BOARD.thickness;
  const redLed = led({ dia: 5, color: 0xff2414 });
  redLed.position.set(-1.6, T, 3.2);
  root.add(redLed);
  const res = axialResistor({ length: 6, bands: ['#d4302b', '#d4302b', '#8b4513', '#d4af37'] });
  res.rotation.y = Math.PI / 2;
  res.position.set(7.4, T, -1.5);
  root.add(res);

  return {
    object3d: root,
    labels: [
      { name: 'RED LED', sub: 'D1 · 5mm', object: redLed, anchor: [0, 7, 0], off: [-130, -40] },
      { name: 'RESISTOR', sub: 'R1 · 220Ω (추정)', object: res, anchor: [0, 2.5, 0], off: [60, -70] },
      { name: '3P HEADER', sub: 'J2 · S · V · G', object: board.userData.header, anchor: [0, 10, 0], off: [-120, -60] },
    ],
    handles: { led: redLed },
  };
}
