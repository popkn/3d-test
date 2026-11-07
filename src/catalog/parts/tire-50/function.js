// 기능: 흰 휠에 끼운 모습을 보고, 모터 속도에 따른 이동 속도를 계산한다 (둘레 = π × 50mm).
export function create(model, ui) {
  const st = { rim: false, rpm: 0, a: 0 };
  ui.controls([
    { type: 'toggle', id: 'rim', label: '휠 Ø50[V2]에 끼우기 (미리보기)', value: false },
    { type: 'select', id: 'rpm', label: '모터', options: [['0', '정지'], ['130', 'DC 모터 130 rpm'], ['400', 'DC 모터 400 rpm']], value: '0' },
  ]);
  ui.readouts([['round', '한 바퀴'], ['speed', '이동 속도']]);
  return {
    onControl(id, v) { if (id === 'rpm') st.rpm = Number(v); else st[id] = v; },
    update(dt) {
      model.handles.rim.visible = st.rim;
      st.a += (st.rpm / 60) * Math.PI * 2 * dt;
      model.handles.spin.rotation.z = -st.a;
      ui.readout('round', `${(Math.PI * 5).toFixed(1)} cm`);
      ui.readout('speed', `${(Math.PI * 0.05 * st.rpm / 60).toFixed(2)} m/s`);
    },
  };
}
