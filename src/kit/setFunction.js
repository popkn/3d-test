// 세트 부품 공통 기능: 모터 속도로 돌려 보고 이동 속도를 계산 (바퀴 · 축 세트)
export function createSpinFunction(model, ui, { dia, axis = 'z', note = '' }) {
  const st = { rpm: 0, a: 0 };
  ui.controls([{ type: 'select', id: 'rpm', label: '모터', options: [['0', '정지'], ['130', 'DC 모터 130 rpm'], ['400', 'DC 모터 400 rpm']], value: '0' }]);
  ui.readouts([['dia', '바퀴 지름'], ['round', '한 바퀴'], ['speed', '이동 속도']]);
  return {
    onControl(id, v) { if (id === 'rpm') st.rpm = Number(v); },
    update(dt) {
      st.a += (st.rpm / 60) * Math.PI * 2 * dt;
      model.handles.spin.rotation[axis] = -st.a;
      ui.readout('dia', `Ø${dia} mm${note}`);
      ui.readout('round', `${(Math.PI * dia / 10).toFixed(1)} cm`);
      ui.readout('speed', `${(Math.PI * dia / 1000 * st.rpm / 60).toFixed(2)} m/s`);
    },
  };
}
