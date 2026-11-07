import * as THREE from 'three';
import { makePcb } from '../../../kit/pcb.js';
import { soic, smd, led, box } from '../../../kit/components.js';
import { M, mesh } from '../../../kit/materials.js';
import { FONT } from '../../../kit/textures.js';
import spec from './spec.js';

// 작은 검은 기판. 6핀 두 줄이 아래로 나와 연결 보드에 꽂히고, 모터 구동 칩은 아랫면에 있다.
export const ROW_GAP = 10.16; // 두 핀 줄 사이 간격 (2.54 × 4)

export function build() {
  const { x: W, z: D } = spec.size;
  const T = 1.6;
  const root = new THREE.Group();
  const lift = 6; // 아래로 나온 핀 길이만큼 띄운다
  const board = new THREE.Group();
  board.position.y = lift;
  root.add(board);
  const rows = [-ROW_GAP / 2, ROW_GAP / 2];
  const pins = rows.flatMap((z) => Array.from({ length: 6 }, (_, i) => ({ x: -6.35 + i * 2.54, z, r: 0.5, ring: true })));
  board.add(makePcb({
    width: W, depth: D, color: 'black', holes: pins,
    silk: (g, w, d, X, Y) => {
      g.font = `italic 900 2.6px ${FONT}`;
      g.fillText('ROBOROBO', X(-9), Y(-1));
      g.font = `600 1.1px ${FONT}`;
      g.fillText('(주)로보로보', X(-2), Y(1.2));
      g.fillText('WWW.ROBOROBO.CO.KR', X(-9), Y(8.6));
      g.save(); g.translate(X(10.2), Y(-8)); g.rotate(Math.PI / 2); g.fillText('PC0D-N010  1511', 0, 0); g.restore();
      g.fillStyle = '#b9a26a';
      for (const z of rows) g.fillRect(X(6.35) - 0.8, Y(z) - 0.8, 1.6, 1.6); // 1번 핀 네모 패드
    },
  }));
  // 아래로 나온 핀 (연결 보드에 꽂힌다)
  for (const p of pins) {
    const pin = mesh(new THREE.BoxGeometry(0.64, lift + 2, 0.64), M.gold);
    pin.position.set(p.x, (lift + 2) / 2 - 0.5, p.z);
    root.add(pin);
  }
  // 아랫면: 모터 구동 칩, 콘덴서
  const under = new THREE.Group();
  under.rotation.x = Math.PI;
  under.position.y = lift;
  const chip = soic({ length: 10, width: 4, pins: 16, height: 1.6, lines: ['MOTOR', 'DRIVER'] });
  chip.position.set(0, 0, 0);
  under.add(chip);
  for (const x of [-8, 8]) { const s = smd('cap'); s.position.set(x, 0, 0); under.add(s); }
  root.add(under);
  // 전원 표시등 (흰색 둥근 LED)
  const lamp = led({ smd: true, color: 0x9ad0ff });
  lamp.position.set(8.5, lift + T, 7.5);
  root.add(lamp);

  return {
    object3d: root,
    labels: [
      { name: '6P × 2 PINS', sub: '연결 보드에 꽂음', object: root, anchor: [-6.35, 2, ROW_GAP / 2], off: [-120, 50] },
      { name: 'MOTOR DRIVER', sub: '아랫면 · 1.8A', object: chip, anchor: [0, 1.6, 0], off: [60, 60] },
      { name: 'POWER LED', sub: '전원 표시', object: lamp, anchor: [0, 1, 0], off: [60, -60] },
    ],
    handles: { lamp },
  };
}
