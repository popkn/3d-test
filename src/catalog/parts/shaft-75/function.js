// 기능: 연결한 모터 속도대로 축이 돈다 (빨간 선으로 회전 확인).
export function create(model, ui) {
  const st = { rpm: 0, a: 0 };
  ui.controls([{ type: 'select', id: 'rpm', label: '돌리는 모터', options: [['0', '정지'], ['130', 'DC 모터 130 rpm'], ['400', 'DC 모터 400 rpm'], ['60', '서보 60 rpm']], value: '0' }]);
  ui.readouts([['rpm', '회전 속도']]);
  return {
    onControl(id, v) { st.rpm = Number(v); },
    update(dt) {
      st.a += (st.rpm / 60) * Math.PI * 2 * dt;
      model.handles.spin.rotation.x = st.a;
      ui.readout('rpm', `${st.rpm} rpm`);
    },
  };
}
