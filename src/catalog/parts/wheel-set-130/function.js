// 기능: 모터 속도에 맞춰 바퀴가 돌고, 이동 속도 = 둘레(π × 130mm) × rpm.
//   분해 보기로 타이어 · 인너 · 휠 · 휠가이드가 어떻게 겹쳐지는지 보여준다.
const MOTORS = [['0', '정지'], ['130', 'DC 모터 130 rpm'], ['400', 'DC 모터 400 rpm'], ['60', '서보 60 rpm']];

export function create(model, ui) {
  const { spin, parts } = model.handles;
  const st = { rpm: 0, explode: false, x: 0, angle: 0 };
  ui.controls([
    { type: 'select', id: 'rpm', label: '연결한 모터', options: MOTORS, value: '0' },
    { type: 'toggle', id: 'explode', label: '분해 보기', value: false },
  ]);
  ui.readouts([['round', '한 바퀴'], ['speed', '이동 속도'], ['parts', '구성']]);
  const offsets = { tire: 0, inner: -40, rim: -80, guide: 40 };
  return {
    onControl(id, v) { if (id === 'rpm') st.rpm = Number(v); else st[id] = v; },
    update(dt) {
      st.angle += (st.rpm / 60) * Math.PI * 2 * dt;
      spin.rotation.x = st.angle;
      st.x += ((st.explode ? 1 : 0) - st.x) * Math.min(1, dt * 5);
      for (const [k, o] of Object.entries(offsets)) parts[k].position.x = o * st.x;
      const circ = Math.PI * 0.13; // m
      ui.readout('round', `${(circ * 100).toFixed(1)} cm`);
      ui.readout('speed', `${(circ * st.rpm / 60).toFixed(2)} m/s`);
      ui.readout('parts', '타이어 · 인너 · 휠 · 휠가이드 (각 2개)');
    },
  };
}
