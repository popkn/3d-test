// 기능: 모터 속도에 따른 이동 속도 (둘레 = π × 80mm).
export function create(model, ui) {
  const st = { rpm: 0, a: 0 };
  ui.controls([{ type: 'select', id: 'rpm', label: '모터', options: [['0', '정지'], ['130', 'DC 모터 130 rpm'], ['400', 'DC 모터 400 rpm']], value: '0' }]);
  ui.readouts([['round', '한 바퀴'], ['speed', '이동 속도']]);
  return {
    onControl(id, v) { st.rpm = Number(v); },
    update(dt) {
      st.a += (st.rpm / 60) * Math.PI * 2 * dt;
      model.handles.spin.rotation.z = -st.a;
      ui.readout('round', `${(Math.PI * 8).toFixed(1)} cm`);
      ui.readout('speed', `${(Math.PI * 0.08 * st.rpm / 60).toFixed(2)} m/s`);
    },
  };
}
