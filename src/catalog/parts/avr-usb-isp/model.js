import * as THREE from 'three';
import { makePcb } from '../../../kit/pcb.js';
import { usbB, rj12, qfp, qfn, crystal, elecCapSmd, smd, box } from '../../../kit/components.js';
import { M, mesh } from '../../../kit/materials.js';
import { FONT } from '../../../kit/textures.js';
import spec from './spec.js';

// 배치 (기판 중심 기준 x, z). 실크 인쇄도 이 값으로 그린다.
const L = {
  usb: [-22.8, 0], jack: [22.5, 0], cp2102: [-7.2, 3.6], atmega: [3.2, -1.2], crystal: [2.6, -6.6], ecap: [10.6, 4.4],
};
const SMALL = [
  [-12.6, -5.2, 0, 'diode', 'D1'], [-12.6, -2.4, 0, 'diode', 'D2'], [-9.4, -6.6, 1, 'res', 'R1'],
  [-7.0, -6.6, 1, 'res', 'R2'], [-4.6, -6.6, 1, 'cap', 'C1'], [-11.6, 3.4, 1, 'cap', 'C2'],
  [-3.2, 6.6, 0, 'cap', 'C3'], [-3.4, 2.0, 1, 'res', 'R3'], [8.6, -2.0, 1, 'cap', 'C4'],
  [8.6, -5.6, 1, 'cap', 'C5'], [3.0, 5.6, 0, 'res', 'R4'], [6.2, 6.8, 0, 'res', 'R5'],
  [-1.6, -3.6, 1, 'cap', 'C6'], [11.8, -6.4, 0, 'diode', 'D3'],
];

export function build() {
  const { x: W, z: D } = spec.size;
  const T = 1.6;
  const root = new THREE.Group();
  root.add(makePcb({
    width: W, depth: D, color: 'white',
    silk: (g, w, d, X, Y) => {
      for (const k of ['cp2102', 'atmega', 'ecap']) {
        const s = { cp2102: 5, atmega: 7, ecap: 5.3 }[k] + 1.6;
        g.strokeRect(X(L[k][0]) - s / 2, Y(L[k][1]) - s / 2, s, s);
      }
      g.beginPath(); g.roundRect(X(L.crystal[0] - 6.1), Y(L.crystal[1] - 2.95), 12.2, 5.9, 2.6); g.stroke();
      g.fillStyle = '#c7c9cc';
      for (const [x, z, r] of SMALL) {
        g.save(); g.translate(X(x), Y(z)); g.rotate(-r * Math.PI / 2);
        g.fillRect(-1.45, -0.75, 0.9, 1.5); g.fillRect(0.55, -0.75, 0.9, 1.5); g.restore();
      }
      g.fillStyle = '#1d1d1f';
      g.font = `600 1.15px ${FONT}`;
      for (const [x, z, , , n] of SMALL) g.fillText(n, X(x) - 1, Y(z) - 1.3);
      g.fillText('IC1', X(L.atmega[0]) - 1.2, Y(L.atmega[1] - 5));
      g.fillText('IC2', X(L.cp2102[0]) - 1.2, Y(L.cp2102[1] + 4.6));
      g.font = `700 1.3px ${FONT}`;
      g.save(); g.translate(X(-30.2), Y(8.2)); g.rotate(-Math.PI / 2); g.fillText('MADE IN KOREA', 0, 0); g.restore();
      g.fillText('WWW.ROBOROBO.CO.KR', X(-1.5), Y(9));
    },
  }));

  const place = (obj, [x, z], rot = 0) => { obj.position.set(x, T, z); obj.rotation.y = rot; root.add(obj); return obj; };
  const usb = place(usbB(), L.usb);
  const jack = place(rj12({ height: spec.size.y - T }), L.jack);
  const atmega = place(qfp({ size: 7, pins: 32, lines: ['ATMEGA8', '16AU'] }), L.atmega);
  const cp = place(qfn({ size: 5, pins: 28, lines: ['CP2102', 'GMR'] }), L.cp2102);
  const xtal = place(crystal({ label: '7.3728' }), L.crystal);
  const ecap = place(elecCapSmd(), L.ecap);
  const small = new THREE.Group();
  for (const [x, z, r, kind] of SMALL) { const s = smd(kind); s.position.set(x, T, z); s.rotation.y = r * Math.PI / 2; small.add(s); }
  root.add(small);

  // USB 케이블 플러그 (연결하면 보인다)
  // 소켓 입구(x = -31)에서 바깥으로: 플러그 몸통 14mm + 케이블 30mm
  const usbPlug = new THREE.Group();
  usbPlug.add(box(14, 9.6, 10.6, M.matteBlack, -31 - 7, 0.6, 0));
  const usbCable = mesh(new THREE.CylinderGeometry(2.2, 2.2, 30, 16), M.matteBlack);
  usbCable.rotation.z = Math.PI / 2;
  usbCable.position.set(-31 - 14 - 15, 5.4, 0);
  usbPlug.add(usbCable);
  usbPlug.position.y = T;
  usbPlug.visible = false;
  usbPlug.userData.noBounds = true;
  root.add(usbPlug);

  // 6P 모듈러 플러그 (투명 플라스틱 + 회색 평형 케이블)
  const rjPlug = new THREE.Group();
  const plugBody = mesh(new THREE.BoxGeometry(12, 6.4, 7.8), new THREE.MeshPhysicalMaterial({ color: 0xe8eef2, transparent: true, opacity: 0.55, roughness: 0.1 }));
  plugBody.position.set(31 + 4, T + 16.4 * 0.38 + 3, 0);
  const flat = mesh(new THREE.BoxGeometry(30, 1.2, 6.2), new THREE.MeshStandardMaterial({ color: 0x9a9da3, roughness: 0.7 }));
  flat.position.set(31 + 10 + 15, T + 16.4 * 0.38 + 3, 0);
  rjPlug.add(plugBody, flat);
  rjPlug.visible = false;
  rjPlug.userData.noBounds = true;
  root.add(rjPlug);

  // 데이터 흐름 표시 (프로그램을 내려받는 동안 USB → CP2102 → ATmega8 → 잭으로 빛 알갱이가 흐른다)
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-30, T + 5, 0), new THREE.Vector3(-14.5, T + 2.5, 0), new THREE.Vector3(L.cp2102[0], T + 2, L.cp2102[1]),
    new THREE.Vector3(L.atmega[0], T + 2.2, L.atmega[1]), new THREE.Vector3(14, T + 4, 0), new THREE.Vector3(31, T + 7, 0),
  ]);
  const packets = [];
  const packetMat = new THREE.MeshBasicMaterial({ color: 0xe8432a, transparent: true, opacity: 0.95 });
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8), packetMat);
    p.visible = false;
    p.userData.noBounds = true;
    root.add(p);
    packets.push(p);
  }

  return {
    object3d: root,
    labels: [
      { name: 'USB TYPE-B', sub: 'PC 연결 · 5V 전원', object: usb, anchor: [0, 11, 0], off: [-110, -60] },
      { name: '6P MODULAR JACK', sub: '로봇 ISP 연결 · RJ12', object: jack, anchor: [0, 16.4, 0], off: [60, -70] },
      { name: 'ATMEGA8', sub: 'STK500 처리 · TQFP-32', object: atmega, anchor: [0, 1.2, 0], off: [60, 50] },
      { name: 'CP2102', sub: 'USB ↔ 시리얼 변환', object: cp, anchor: [0, 1, 0], off: [-90, 70] },
      { name: 'CRYSTAL', sub: '7.3728 MHz', object: xtal, anchor: [0, 3.5, 0], off: [-40, 80] },
      { name: 'E-CAP', sub: '전원 안정 콘덴서', object: ecap, anchor: [0, 5.4, 0], off: [-150, -110] },
    ],
    handles: { usbPlug, rjPlug, path, packets },
  };
}
