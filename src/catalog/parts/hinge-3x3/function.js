// 기능: 한쪽 날개를 0°(겹침) ~ 180°(활짝)까지 접고 편다.
export function create(model, ui) {
  const st = { angle: 180, auto: false, t: 0 };
  ui.controls([
    { type: 'slider', id: 'angle', label: '펼친 각도', min: 0, max: 180, step: 1, value: 180, unit: '°' },
    { type: 'toggle', id: 'auto', label: '자동으로 접었다 펴기', value: false },
  ]);
  ui.readouts([['angle', '각도'], ['state', '상태']]);
  return {
    onControl(id, v) { st[id] = v; },
    update(dt) {
      st.t += dt;
      const a = st.auto ? 90 + 90 * Math.sin(st.t * 1.5) : st.angle;
      model.handles.pivot.rotation.z = (180 - a) * Math.PI / 180;
      ui.readout('angle', `${Math.round(a)}°`);
      ui.readout('state', a > 175 ? '활짝 펴짐' : a < 5 ? '완전히 접힘' : '접히는 중');
    },
  };
}
