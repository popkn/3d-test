// 기능: 75mm 축을 꿰어 돌린다 (축가이드는 제자리, 축만 돈다).
export function create(model, ui) {
  const st = { shaft: true, rpm: 130, a: 0 };
  ui.controls([
    { type: 'toggle', id: 'shaft', label: '75mm 축 꿰기', value: true },
    { type: 'select', id: 'rpm', label: '축 회전', options: [['0', '정지'], ['130', '130 rpm'], ['400', '400 rpm']], value: '130' },
  ]);
  ui.readouts([['state', '상태']]);
  return {
    onControl(id, v) { if (id === 'rpm') st.rpm = Number(v); else st[id] = v; },
    update(dt) {
      const s = model.handles.shaft;
      s.visible = st.shaft;
      st.a += (st.rpm / 60) * Math.PI * 2 * dt;
      s.rotation.x = st.a;
      ui.readout('state', st.shaft ? `축이 ${st.rpm} rpm으로 회전 (가이드는 고정)` : '축 없음');
    },
  };
}
