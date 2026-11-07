// 기능: 적외선 LED → 물체에 반사 → 포토 트랜지스터. 반사량이 기준보다 크면 감지.
//   흰 물체는 많이 반사, 검은 물체는 흡수. 멀어질수록 반사량이 줄어든다.
const SURFACES = { white: ['흰 종이', 0.9, 0xffffff], black: ['검은 선', 0.08, 0x151515], gray: ['회색 바닥', 0.45, 0x8a8a8a] };

export function create(model, ui) {
  const h = model.handles;
  const st = { power: true, target: true, surface: 'white', dist: 10, threshold: 35 };
  ui.controls([
    { type: 'toggle', id: 'power', label: '전원', value: true },
    { type: 'toggle', id: 'target', label: '물체 놓기', value: true },
    { type: 'select', id: 'surface', label: '물체 색', options: Object.entries(SURFACES).map(([k, v]) => [k, v[0]]), value: 'white' },
    { type: 'slider', id: 'dist', label: '거리', min: 2, max: 40, step: 0.5, value: 10, unit: 'mm' },
    { type: 'slider', id: 'threshold', label: '감지 기준', min: 5, max: 90, step: 1, value: 35, unit: '%' },
  ]);
  ui.readouts([['reflect', '반사량'], ['out', '출력'], ['note', '설명']]);
  return {
    onControl(id, v) { st[id] = v; },
    update() {
      const [name, refl, color] = SURFACES[st.surface];
      h.target.visible = st.target;
      h.target.material.color.setHex(color);
      const top = h.T + 4.5;
      h.target.position.y = top + st.dist + 0.5;
      // 빔: 발광부에서 물체까지
      h.beam.visible = st.power && st.target;
      h.beam.scale.y = st.dist;
      h.beam.position.set(0, top + st.dist / 2, -6);
      // 반사량: 표면 반사율 × 거리에 따른 감소
      const falloff = Math.max(0, 1 - (st.dist - 2) / 30);
      const r = st.power && st.target ? refl * falloff * 100 : 0;
      const detect = r > st.threshold;
      h.emitter.userData.setLevel(st.power ? 0.6 : 0);
      h.indicator.userData.setLevel(detect ? 1 : 0);
      ui.readout('reflect', `${Math.round(r)}%`);
      ui.readout('out', detect ? 'LOW (감지)' : 'HIGH (없음)');
      ui.readout('note', !st.target ? '물체 없음' : st.surface === 'black' ? '검은색은 빛을 흡수해 감지 안 됨' : detect ? `${name} 감지` : '너무 멀어 반사가 약함');
    },
  };
}
