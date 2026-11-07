import * as THREE from 'three';
import { makePcb } from '../../../kit/pcb.js';
import { qfp, crystal, elecCap, usbB, jst, slideSwitch, tactSwitch, pinHeader, femaleHeader, led, smd, box } from '../../../kit/components.js';
import { M, mesh } from '../../../kit/materials.js';
import { FONT } from '../../../kit/textures.js';
import spec from './spec.js';

// 배치 (사진 기준, 기판 중심 좌표)
const IN_X = [-27, -22, -17, -12, -7, -2, 3];   // IN1~7: 아래쪽 줄
const OUT_X = [9, 14, 19, 24, 29];              // OUT1~5: 가운데 오른쪽 줄

export function build() {
  const T = 1.6;
  const { x: W, z: D } = spec.size;
  const root = new THREE.Group();
  root.add(makePcb({
    width: W, depth: D, color: 'black',
    frame: { pitch: 5.5, inset: 3, r: 1.7, numbers: true, letters: true },
    silk: (g, w, d, X, Y) => {
      g.font = `700 1.3px ${FONT}`;
      IN_X.forEach((x, i) => g.fillText(`IN${i + 1}`, X(x) - 1.6, Y(21.6)));
      OUT_X.forEach((x, i) => g.fillText(`OUT${i + 1}`, X(x) - 2, Y(12.2)));
      g.fillText('POWER', X(28), Y(-11)); g.fillText('12V', X(21), Y(-6.2)); g.fillText('PushON', X(29), Y(-1.6));
      g.fillText('USB', X(10), Y(-9.4)); g.fillText('ISP', X(-12), Y(-12.4)); g.fillText('UART', X(-24), Y(-12.4));
      g.fillText('EX-Motor3/4', X(-31), Y(12.6));
      g.font = `600 1px ${FONT}`;
      g.fillText('CPU BOARD 8M [12V/S]', X(-6), Y(-1.5));
    },
  }));
  const place = (o, x, z, rot = 0) => { o.position.set(x, T, z); o.rotation.y = rot; root.add(o); return o; };

  const cpu = place(qfp({ size: 7, pins: 32, lines: ['ATMEGA8A', 'AU 2337'] }), -4, -6);
  place(crystal({ label: '8.000' }), -16, -5, Math.PI / 2);
  place(elecCap({ dia: 5, height: 7 }), -27, -4);
  place(elecCap({ dia: 6.3, height: 8 }), 2, 5);
  const usb = place(usbB(), 10, -17, -Math.PI / 2);
  const battRed = place(jst({ pins: 2, color: M.redPlastic }), 27, -17, Math.PI);
  const battWhite = place(jst({ pins: 2 }), 35, -17, Math.PI);
  const vSwitch = place(slideSwitch({}), 22, -9);
  const pushOn = place(tactSwitch({ size: 6 }), 31, -6);
  const powerLed = place(led({ smd: true, color: 0xff2a1a }), 25, -2.5);
  const statusLed = place(led({ smd: true, color: 0x2aff5a }), 20, -2.5);
  const isp = place(pinHeader({ cols: 3, rows: 2, above: 6, below: 1.5 }), -12, -17);
  place(pinHeader({ cols: 4, above: 6, below: 1.5 }), -24, -17);
  const exMotor = place(femaleHeader({ cols: 2, rows: 2 }), -31, 8);
  const ir = new THREE.Group();
  ir.add(box(4.5, 4.5, 3, M.blackPlastic));
  const dome = mesh(new THREE.SphereGeometry(1.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.blackPlastic);
  dome.rotation.x = Math.PI / 2; dome.position.set(0, 2.6, 1.5);
  ir.add(dome);
  place(ir, -30, -9);
  for (const [x, z, k] of [[-9, 0, 'res'], [-6, 1, 'res'], [-1, -12, 'cap'], [4, -10, 'cap'], [14, -4, 'diode'], [-20, 2, 'res']]) place(smd(k), x, z);

  // 입력/출력 포트 (3핀, 핀 줄이 Z 방향)
  const inPorts = IN_X.map((x) => place(pinHeader({ cols: 1, rows: 3, above: 6, below: 1.5 }), x, 17));
  const outPorts = OUT_X.map((x) => place(pinHeader({ cols: 1, rows: 3, above: 6, below: 1.5 }), x, 7.6));
  // 포트 상태 표시 (입력: 노랑, 출력: 빨강)
  const mark = (x, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), new THREE.MeshBasicMaterial({ color: 0x555555 })); m.position.set(x, T + 11, z); root.add(m); return m; };
  const inMarks = IN_X.map((x) => mark(x, 17));
  const outMarks = OUT_X.map((x) => mark(x, 7.6));

  // 투명 아크릴 덮개 (사진처럼 가운데를 덮는다)
  const cover = new THREE.Group();
  const cw = 46, cd = 30, ch = 12.5;
  for (const [w, h, d, x, y, z] of [[cw, 0.8, cd, 0, ch, 0], [cw, ch, 0.8, 0, 0, -cd / 2], [cw, ch, 0.8, 0, 0, cd / 2], [0.8, ch, cd, -cw / 2, 0, 0], [0.8, ch, cd, cw / 2, 0, 0]]) {
    const p = mesh(new THREE.BoxGeometry(w, h, d), M.acrylic, { cast: false, receive: false });
    p.position.set(x, y + h / 2, z);
    cover.add(p);
  }
  cover.position.set(4, T, -8);
  root.add(cover);

  return {
    object3d: root,
    labels: [
      { name: 'ATMEGA8A', sub: 'CPU · 8 MHz', object: cpu, anchor: [0, 1.2, 0], off: [-100, -90] },
      { name: 'USB-B', sub: 'Rogic 다운로드', object: usb, anchor: [0, 11, 0], off: [-40, -110] },
      { name: 'BATTERY ×2', sub: '6V / 12V', object: battWhite, anchor: [0, 7, 0], off: [40, -90] },
      { name: '6V / 12V', sub: '전압 선택 스위치', object: vSwitch, anchor: [0, 5, 0], off: [90, -30] },
      { name: 'IN 1~7', sub: '센서 입력', object: inPorts[3], anchor: [0, 8, 0], off: [-60, 90] },
      { name: 'OUT 1~5', sub: '모터 · 서보 · LED · 부저', object: outPorts[2], anchor: [0, 8, 0], off: [90, 60] },
      { name: 'ISP', sub: 'C언어 다운로드', object: isp, anchor: [0, 8, 0], off: [-110, -40] },
      { name: 'EX-MOTOR 3/4', sub: '확장 모터 포트', object: exMotor, anchor: [0, 8.5, 0], off: [-110, 30] },
    ],
    handles: { vSwitch, pushOn, powerLed, statusLed, inMarks, outMarks, cover },
  };
}
