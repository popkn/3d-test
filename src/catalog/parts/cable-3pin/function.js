// 기능: CPU 포트 → 보드로 신호가 선을 따라 전달되는 모습. 핀 순서를 확인한다.
export function create(model, ui) {
  const { path, pulse } = model.handles;
  const st = { send: false, dir: 'out', u: 0 };
  ui.controls([
    { type: 'toggle', id: 'send', label: '신호 보내기', value: false },
    { type: 'select', id: 'dir', label: '방향', options: [['out', 'CPU 출력 → LED · 부저 보드'], ['in', '센서 보드 → CPU 입력']], value: 'out' },
  ]);
  ui.readouts([['pins', '핀 순서'], ['flow', '흐름']]);
  return {
    onControl(id, v) { st[id] = v; },
    update(dt) {
      st.u = (st.u + dt * 0.6) % 1;
      pulse.visible = st.send;
      if (st.send) pulse.position.copy(path.getPointAt(st.dir === 'out' ? st.u : 1 - st.u));
      ui.readout('pins', 'S (신호 · 노랑) · + (전원 · 빨강) · - (GND · 검정)');
      ui.readout('flow', !st.send ? '대기' : st.dir === 'out' ? 'CPU가 보낸 신호 → 출력 보드' : '센서 신호 → CPU 입력 포트');
    },
  };
}
