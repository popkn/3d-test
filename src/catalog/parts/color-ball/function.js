import { BALL_COLORS } from './model.js';

// 기능: 공 하나를 골라 컬러 센서가 읽는 값(R · G · B)을 보여준다 (센서 바로 앞, 흰 LED 기준).
export function create(model, ui) {
  const keys = Object.keys(BALL_COLORS);
  const st = { pick: 'red', t: 0 };
  ui.controls([{ type: 'select', id: 'pick', label: '센서 앞에 놓을 공', options: keys.map((k) => [k, BALL_COLORS[k][0]]), value: 'red' }]);
  ui.readouts([['rgb', '센서 값 R · G · B'], ['color', '판단']]);
  return {
    onControl(id, v) { st.pick = v; },
    update(dt) {
      st.t += dt;
      model.handles.balls.forEach((b, i) => {
        const sel = keys[i] === st.pick;
        b.position.y = 7.5 + (sel ? 4 + Math.sin(st.t * 3) : 0);
      });
      const [name, , rgb] = BALL_COLORS[st.pick];
      ui.readout('rgb', rgb.join(' · '));
      ui.readout('color', name);
    },
  };
}
