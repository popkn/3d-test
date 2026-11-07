import * as THREE from 'three';
import { makePcb } from '../../../kit/pcb.js';
import { qfp, elecCap, jst, slideSwitch, tactSwitch, pinHeader, femaleHeader, magneticBuzzer, rj12, led, smd, box } from '../../../kit/components.js';
import { M, mesh } from '../../../kit/materials.js';
import { FONT } from '../../../kit/textures.js';
import spec from './spec.js';

export const SENSOR_X = [-18, -12, -6, 0, 6, 12, 18];
const STANDOFF = 25;

export function build() {
  const T = 1.6;
  const { x: W, z: D } = spec.size;
  const root = new THREE.Group();
  const board = new THREE.Group();
  board.position.y = STANDOFF;
  root.add(board);

  // 좌우 가장자리는 프레임 구멍이 두 줄
  const inner = [];
  for (let z = -63; z <= 63; z += 7) for (const x of [-69, 69]) inner.push({ x, z, r: 1.7, ring: true });
  board.add(makePcb({
    width: W, depth: D, color: 'white', holes: inner,
    frame: { pitch: 7, inset: 4, r: 1.7 },
    silk: (g, w, d, X, Y) => {
      // 가운데 흰 영역 테두리
      g.lineWidth = 0.5;
      g.strokeRect(X(-58), Y(-56), 116, 110);
      g.font = `italic 900 13px ${FONT}`;
      g.fillText('BLACK', X(-34), Y(-6));
      g.fillText('LINE', X(-28), Y(8));
      g.fillText('PRO', X(-22), Y(22));
      g.fillStyle = '#e8432a'; g.font = `italic 900 18px ${FONT}`; g.fillText('W', X(18), Y(24));
      g.fillStyle = '#1d1d1f';
      g.font = `700 3px ${FONT}`;
      g.fillText('FRONT', X(-6), Y(-46));
      g.font = `italic 800 4px ${FONT}`; g.fillText('RoboRobo', X(-11), Y(-40));
      g.font = `600 2px ${FONT}`;
      g.fillText('SERVO', X(40), Y(-54)); g.fillText('SENSOR', X(-6), Y(-54)); g.fillText('POWER', X(-58), Y(50));
      g.fillText('REAR SENSOR', X(-8), Y(52)); g.fillText('ISP', X(56), Y(50)); g.fillText('WWW.ROBOROBO.CO.KR', X(-14), Y(-36));
    },
  }));
  const place = (o, x, z, rot = 0) => { o.position.set(x, T, z); o.rotation.y = rot; board.add(o); return o; };

  const cpu = place(qfp({ size: 10, pins: 64, pitch: 0.5, lines: ['ATMEGA64A', 'AU'] }), 0, -26);
  place(elecCap({ dia: 8, height: 8 }), -48, -50);
  place(elecCap({ dia: 8, height: 8 }), 48, -50);
  const servoL = [-52, -46, -40, -34].map((x) => place(pinHeader({ cols: 1, rows: 3, above: 6, below: 1.5 }), x, -62));
  const servoR = [34, 40, 46, 52].map((x) => place(pinHeader({ cols: 1, rows: 3, above: 6, below: 1.5 }), x, -62));
  const sensorConn = place(femaleHeader({ cols: 5, rows: 2 }), 0, -62);
  const power = place(jst({ pins: 2 }), -55, 58);
  place(slideSwitch({}), -42, 62);
  place(tactSwitch({ size: 6, cap: M.blackPlastic }), -30, 60);
  const buzzer = place(magneticBuzzer({ dia: 12, height: 8 }), 40, 58);
  const isp = place(rj12({ height: 13 }), 58, 58, Math.PI / 2);
  place(pinHeader({ cols: 5, above: 6, below: 1.5 }), 0, 62);
  for (const [x, z] of [[-14, -18], [14, -18], [-10, -34], [10, -34], [24, 50], [-20, 50]]) place(smd('res'), x, z);

  // 고휘도 LED 2개 (앞쪽)
  const bright = [-24, 24].map((x) => place(led({ dia: 3, color: 0xfff6e0 }), x, -46));
  // 센서 표시등 7개 (선을 감지하면 켜진다)
  const indicators = SENSOR_X.map((x) => place(led({ smd: true, color: 0xff2a1a }), x, -50));

  // 바닥면 라인 센서 7쌍 (적외선 LED + 수광 소자), 기판 아랫면 앞쪽
  const sensors = new THREE.Group();
  for (const x of SENSOR_X) {
    sensors.add(box(2.4, 2.6, 4.6, M.blackPlastic, x, -2.6, -60));
    sensors.add(box(1.6, 0.4, 1.6, M.bluePlastic, x, -3, -61, { cast: false }));
  }
  board.add(sensors);
  // 놋쇠 지지대 4개
  for (const [x, z] of [[-69, -73], [69, -73], [-69, 73], [69, 73]]) {
    const s = mesh(new THREE.CylinderGeometry(2.5, 2.5, STANDOFF, 6), M.brass);
    s.position.set(x, STANDOFF / 2, z);
    root.add(s);
  }

  // 바닥의 검은 라인 (라인트레이싱 시연용). 기판 앞쪽 아래를 지나간다.
  const track = mesh(new THREE.PlaneGeometry(18, 240), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }), { cast: false });
  track.rotation.x = -Math.PI / 2;
  track.position.set(0, 0.05, 0);
  track.visible = false;
  track.userData.noBounds = true;
  root.add(track);

  return {
    object3d: root,
    labels: [
      { name: 'ATMEGA64A', sub: 'CPU', object: cpu, anchor: [0, 1.2, 0], off: [80, -60] },
      { name: 'SERVO ×8', sub: '3핀 서보 포트', object: servoR[2], anchor: [0, 8, 0], off: [40, -90] },
      { name: 'SENSOR', sub: '추가 센서보드', object: sensorConn, anchor: [0, 8.5, 0], off: [-60, -100] },
      { name: 'LINE INDICATORS', sub: '센서 7개 표시등', object: indicators[3], anchor: [0, 1, 0], off: [-170, -40] },
      { name: 'POWER', sub: '6 ~ 12V', object: power, anchor: [0, 7, 0], off: [-110, 50] },
      { name: 'BUZZER', sub: '내장 부저', object: buzzer, anchor: [0, 8, 0], off: [40, 70] },
      { name: '6P ISP JACK', sub: 'ISP 보드 연결', object: isp, anchor: [0, 13, 0], off: [70, 10] },
    ],
    handles: { indicators, bright, track, buzzer },
  };
}
