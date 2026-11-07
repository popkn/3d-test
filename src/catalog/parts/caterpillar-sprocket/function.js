// 기능: 모터 속도로 톱니 휠이 돈다. 걸린 마디를 보이게 해서 맞물림을 확인한다.
export function create(model, ui) {
  const st = { rpm: 0, links: true, a: 0 };
  ui.controls([
    { type: 'select', id: 'rpm', label: '모터', options: [['0', '정지'], ['130', 'DC 모터 130 rpm'], ['400', 'DC 모터 400 rpm']], value: '0' },
    { type: 'toggle', id: 'links', label: '캐터필러 마디 걸기', value: true },
  ]);
  ui.readouts([['rpm', '회전'], ['speed', '궤도 속도']]);
  return {
    onControl(id, v) { if (id === 'rpm') st.rpm = Number(v); else st[id] = v; },
    update(dt) {
      st.a += (st.rpm / 60) * Math.PI * 2 * dt;
      model.handles.spin.rotation.z = -st.a;
      model.handles.links.forEach((l) => { l.visible = st.links; });
      ui.readout('rpm', `${st.rpm} rpm`);
      ui.readout('speed', `${(Math.PI * 0.06 * st.rpm / 60).toFixed(2)} m/s`);
    },
  };
}
