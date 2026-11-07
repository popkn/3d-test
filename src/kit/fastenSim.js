// 체결 기능 (너트 · 캡너트 공통): 볼트에 돌려 조인다. M3 나사는 한 바퀴에 0.5mm 이동.
export function createFastenFunction(model, ui, { nutHeight, maxDepth = 9 }) {
  const { nut, bolt } = model.handles;
  const st = { show: true, turns: 0 };
  const PITCH = 0.5, BOLT = 10, MAX = maxDepth / PITCH;
  ui.controls([
    { type: 'toggle', id: 'show', label: 'M3 볼트 보이기', value: true },
    { type: 'slider', id: 'turns', label: '돌린 횟수', min: 0, max: MAX, step: 0.25, value: 0, unit: '회' },
  ]);
  ui.readouts([['depth', '들어간 길이'], ['state', '상태']]);
  return {
    onControl(id, v) { st[id] = v; },
    update() {
      bolt.visible = st.show;
      // 볼트가 위에서 내려오며 너트를 통과한다 (너트는 제자리, 볼트가 돈다)
      const depth = st.turns * PITCH;
      bolt.position.y = nutHeight + BOLT - depth + 0.2;
      bolt.rotation.y = -st.turns * Math.PI * 2;
      nut.rotation.y = 0;
      ui.readout('depth', `${depth.toFixed(1)} mm`);
      ui.readout('state', depth < nutHeight ? '끼우는 중' : depth >= MAX * PITCH - 0.01 ? '끝까지 조임' : '체결됨');
    },
  };
}
