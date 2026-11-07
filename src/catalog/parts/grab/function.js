// 기능: 그랩 두 개를 마주 보게 달아 탁구공(Ø40)을 집는다. 간격을 좁히면 공을 쥔다.
export function create(model, ui) {
  const { grab, pair, ball } = model.handles;
  const st = { pairView: true, gap: 70, ball: true };
  ui.controls([
    { type: 'toggle', id: 'pairView', label: '집게로 보기 (2개 마주 보기)', value: true },
    { type: 'toggle', id: 'ball', label: '탁구공 놓기', value: true },
    { type: 'slider', id: 'gap', label: '집게 간격', min: 20, max: 80, step: 1, value: 70, unit: 'mm' },
  ]);
  ui.readouts([['state', '상태']]);
  return {
    onControl(id, v) { st[id] = v; },
    update() {
      pair.visible = st.pairView;
      ball.visible = st.pairView && st.ball;
      // 빗살 끝 사이 간격 = gap. 공(지름 40)보다 좁으면 공에 막혀 멈춘다
      const gap = st.ball ? Math.max(st.gap, 40 - 6) : st.gap;
      const reach = 16; // 몸통 중심에서 빗살 끝까지
      if (st.pairView) {
        grab.position.z = -(gap / 2 + reach);
        pair.position.z = gap / 2 + reach;
        ball.position.set(0, 20 - 15, 0);
      } else grab.position.z = 0;
      ui.readout('state', !st.pairView ? '그랩 1개' : st.ball && st.gap <= 40 ? '공을 쥠' : '벌어짐');
    },
  };
}
