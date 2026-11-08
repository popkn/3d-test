// 기능: 궤도를 모터 속도로 돌려 본다 (톱니 휠 지름 60)
export function create(model, ui) {
  const h = model.handles;
  const st = { rpm: 130, u: 0 };
  ui.controls([{ type: 'select', id: 'rpm', label: '톱니 휠 모터', options: [['0', '정지'], ['130', 'DC 모터 130 rpm'], ['400', 'DC 모터 400 rpm']], value: '130' }]);
  ui.readouts([['count', '마디 수'], ['speed', '이동 속도']]);
  return {
    onControl(id, v) { if (id === 'rpm') st.rpm = Number(v); },
    update(dt) {
      const per = 2 * h.dist + 2 * Math.PI * h.R;
      st.u += ((st.rpm / 60) * Math.PI * 2 * 30 * dt) / per;
      h.place(st.u);
      ui.readout('count', `${h.count}개 (마디 + 러버)`);
      ui.readout('speed', `${(Math.PI * 0.06 * st.rpm / 60).toFixed(2)} m/s`);
    },
  };
}
