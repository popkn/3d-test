// 기능: 축과 함께 돈다 (육각 구멍이라 헛돌지 않음).
export function create(model, ui) {
  const st = { rpm: 0, a: 0 };
  ui.controls([{ type: 'select', id: 'rpm', label: '축 회전', options: [['0', '정지'], ['130', '130 rpm'], ['400', '400 rpm']], value: '0' }]);
  ui.readouts([['rpm', '회전']]);
  return {
    onControl(id, v) { st.rpm = Number(v); },
    update(dt) { st.a += (st.rpm / 60) * Math.PI * 2 * dt; model.handles.body.rotation.y = st.a; ui.readout('rpm', `${st.rpm} rpm`); },
  };
}
