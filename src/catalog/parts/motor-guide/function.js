// 기능: 고리에 바퀴축을 끼우고, 구멍에 볼트를 넣어 고정한다.
export function create(model, ui) {
  const { axle, bolt } = model.handles;
  const st = { axle: false, bolt: false, a: 0, b: 0 };
  ui.controls([
    { type: 'toggle', id: 'axle', label: '바퀴축 끼우기', value: false },
    { type: 'toggle', id: 'bolt', label: 'M3 볼트로 고정', value: false },
  ]);
  ui.readouts([['state', '상태']]);
  return {
    onControl(id, v) { st[id] = v; },
    update(dt) {
      st.a += ((st.axle ? 1 : 0) - st.a) * Math.min(1, dt * 4);
      st.b += ((st.bolt ? 1 : 0) - st.b) * Math.min(1, dt * 3);
      axle.visible = st.a > 0.01;
      axle.position.y = 7.5 + 10 + (1 - st.a) * 14 - st.a * 8;
      bolt.visible = st.b > 0.01;
      bolt.position.y = 3 + (1 - st.b) * 12 + 0.01;
      bolt.rotation.y = -st.b * Math.PI * 24;
      ui.readout('state', [st.axle ? '축 받침됨' : '축 없음', st.bolt ? '프레임에 고정' : '고정 안 됨'].join(' · '));
    },
  };
}
