// 기능: 육각 홈에 너트를 넣고(돌지 않게 붙잡힘), 아래에서 볼트를 돌려 조인다.
export function create(model, ui) {
  const { nuts, bolt, T } = model.handles;
  const st = { nuts: false, bolt: false, x: 0, b: 0 };
  ui.controls([
    { type: 'toggle', id: 'nuts', label: 'M3 너트 4개 넣기', value: false },
    { type: 'toggle', id: 'bolt', label: '아래에서 볼트 조이기', value: false },
  ]);
  ui.readouts([['state', '상태']]);
  return {
    onControl(id, v) { st[id] = v; },
    update(dt) {
      st.x += ((st.nuts ? 1 : 0) - st.x) * Math.min(1, dt * 4);
      st.b += ((st.bolt ? 1 : 0) - st.b) * Math.min(1, dt * 2);
      nuts.forEach((n) => { n.visible = st.x > 0.01; n.position.y = T - 2 + (1 - st.x) * 10; });
      bolt.visible = st.bolt || st.b > 0.01;
      bolt.position.y = -12 + st.b * 12;
      bolt.rotation.y = st.b * 12 * Math.PI * 2 / 6; // 0.5mm 피치: 6mm 올라가며 12바퀴
      ui.readout('state', !st.nuts ? '빈 홈' : st.bolt ? (st.b > 0.95 ? '조임 완료 (너트가 홈에 걸려 돌지 않음)' : '볼트 돌리는 중') : '너트가 홈에 들어감');
    },
  };
}
