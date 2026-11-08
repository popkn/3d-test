// 기능: 양쪽에서 3핀 케이블을 꽂아 이어지는지 본다.
export function create(model, ui) {
  const st = { k: 0, target: 0 };
  ui.controls([{ type: 'toggle', id: 'plug', label: '양쪽 3핀 케이블 꽂기', value: false }]);
  ui.readouts([['state', '연결'], ['pins', '핀 순서']]);
  return {
    onControl(id, v) { st.target = v ? 1 : 0; },
    update(dt) {
      st.k += Math.sign(st.target - st.k) * Math.min(Math.abs(st.target - st.k), dt * 1.5);
      // 커넥터 안쪽 면: 빠짐 ±22 → 꽂힘 ±1 (몸통에 닿음)
      for (const p of model.handles.plugs) p.position.x = p.userData.side * (1 + 14 + (1 - st.k) * 21);
      ui.readout('state', st.k > 0.99 ? '이어짐 · 케이블이 두 배 길이로 연장' : st.k < 0.01 ? '빠짐' : '꽂는 중');
      ui.readout('pins', 'S (노랑) — S · + (빨강) — + · - (검정) — -');
    },
  };
}
