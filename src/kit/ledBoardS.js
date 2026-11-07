import * as THREE from 'three';
import { makeSBoard, S_BOARD } from './sBoard.js';
import { led, axialResistor } from './components.js';

// LED 보드[S] (빨강 · 초록 · 주황 공통): 색만 다르고 기판, 저항, 헤더는 같다 (상품 사진 기준).
export const LED_COLORS = {
  red: { hex: 0xff2414, name: '빨강', vf: 2.0 },
  green: { hex: 0x22e05a, name: '초록', vf: 2.2 },
  orange: { hex: 0xff7a12, name: '주황', vf: 2.0 },
};

export function buildLedBoard(color) {
  const c = LED_COLORS[color];
  const root = new THREE.Group();
  const board = makeSBoard({
    labels: [{ text: 'J2', x: -6.5, z: -6.2 }, { text: 'D1', x: 2.6, z: 1.8 }, { text: 'R1', x: 5.4, z: -6.6 },
      { text: 'ABCM', x: 1.2, z: -5.6, size: 0.9 }, { text: 'WWW.ROBOROBO.CO.KR', x: -8.2, z: 8.6, size: 1.05 }],
  });
  root.add(board);
  const T = S_BOARD.thickness;
  const lamp = led({ dia: 5, color: c.hex });
  lamp.position.set(-1.6, T, 3.2);
  root.add(lamp);
  const res = axialResistor({ length: 6, bands: ['#d4302b', '#d4302b', '#8b4513', '#d4af37'] });
  res.rotation.y = Math.PI / 2;
  res.position.set(7.4, T, -1.5);
  root.add(res);

  return {
    object3d: root,
    labels: [
      { name: `${color.toUpperCase()} LED`, sub: `D1 · 5mm · ${c.name}`, object: lamp, anchor: [0, 7, 0], off: [-130, -40] },
      { name: 'RESISTOR', sub: 'R1 · 220Ω (추정)', object: res, anchor: [0, 2.5, 0], off: [60, -70] },
      { name: '3P HEADER', sub: 'J2 · S · V · G', object: board.userData.header, anchor: [0, 10, 0], off: [-120, -60] },
    ],
    handles: { led: lamp, color },
  };
}

// 기능: 신호로 LED를 켜고 끈다. 밝기는 PWM(켜짐 비율), 모드는 켜기 / 깜빡임 / 숨쉬기.
export function createLedBoardFunction(model, ui) {
  const c = LED_COLORS[model.handles.color];
  const st = { on: false, duty: 100, mode: 'on', hz: 2, t: 0 };
  // 5V, 저항 220Ω 가정: 전류 = (5 - LED 순방향 전압) / 220
  const maxMa = ((5 - c.vf) / 220) * 1000;

  ui.controls([
    { type: 'toggle', id: 'on', label: '신호 ON / OFF', value: false },
    { type: 'slider', id: 'duty', label: '밝기 (PWM)', min: 0, max: 100, step: 1, value: 100, unit: '%' },
    { type: 'select', id: 'mode', label: '모드', options: [['on', '계속 켜기'], ['blink', '깜빡임'], ['breath', '숨쉬기']], value: 'on' },
    { type: 'slider', id: 'hz', label: '깜빡임 속도', min: 0.5, max: 10, step: 0.5, value: 2, unit: 'Hz' },
  ]);
  ui.readouts([['status', '상태'], ['level', '현재 밝기'], ['current', '전류 (추정)']]);

  return {
    onControl(id, v) { st[id] = v; },
    update(dt) {
      st.t += dt;
      let lvl = 0;
      if (st.on) {
        const d = st.duty / 100;
        if (st.mode === 'on') lvl = d;
        if (st.mode === 'blink') lvl = Math.sin(st.t * st.hz * Math.PI * 2) > 0 ? d : 0;
        if (st.mode === 'breath') lvl = d * (0.5 - 0.5 * Math.cos(st.t * st.hz * Math.PI));
      }
      model.handles.led.userData.setLevel(lvl);
      ui.readout('status', st.on ? `켜짐 (${c.name})` : '꺼짐');
      ui.readout('level', `${Math.round(lvl * 100)}%`);
      ui.readout('current', `${(maxMa * lvl).toFixed(1)} mA`);
    },
  };
}
