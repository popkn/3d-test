import * as THREE from 'three';

// 기능: 누르면 납작해지고 놓으면 원래 모양으로 돌아온다. 떨어뜨리면 통통 튄다.
const COLORS = { red: ['빨강', 0xe8432a], yellow: ['노랑', 0xf2c21b], blue: ['파랑', 0x2f6fe0], green: ['초록', 0x2fae67] };

export function create(model, ui) {
  const { ball, mat } = model.handles;
  const st = { squeeze: 0, color: 'yellow', drop: 0, vy: 0, y: 0 };
  ui.controls([
    { type: 'select', id: 'color', label: '색', options: Object.entries(COLORS).map(([k, v]) => [k, v[0]]), value: 'yellow' },
    { type: 'slider', id: 'squeeze', label: '누르기', min: 0, max: 60, step: 1, value: 0, unit: '%' },
    { type: 'button', id: 'drop', label: '떨어뜨리기 (10cm)' },
  ]);
  ui.readouts([['shape', '모양'], ['state', '상태']]);
  return {
    onControl(id, v) {
      if (id === 'drop') { st.y = 100; st.vy = 0; st.drop = 1; return; }
      st[id] = v;
    },
    update(dt) {
      mat.color.setHex(COLORS[st.color][1]);
      if (st.drop) {
        st.vy -= 9800 * dt * 0.25; // 화면용으로 느리게
        st.y += st.vy * dt;
        if (st.y <= 0) { st.y = 0; st.vy = -st.vy * 0.55; if (Math.abs(st.vy) < 20) st.drop = 0; }
      }
      const s = 1 - st.squeeze / 100;
      const impact = st.drop && st.y < 2 ? 0.85 : 1;
      const sy = s * impact;
      ball.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
      ball.position.y = 25 * sy + st.y;
      ui.readout('shape', `높이 ${(50 * sy).toFixed(0)}mm · 너비 ${(50 / Math.sqrt(sy)).toFixed(0)}mm`);
      ui.readout('state', st.drop ? '튀는 중' : st.squeeze > 0 ? '눌림 (놓으면 복원)' : '원래 모양');
    },
  };
}
