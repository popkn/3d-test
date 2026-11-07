// 기능: 캐터필러 마디에 끼우고, 바닥 마찰이 어떻게 달라지는지 비교한다 (값은 일반적인 재질 기준 추정).
export function create(model, ui) {
  const st = { fit: false, x: 0 };
  ui.controls([{ type: 'toggle', id: 'fit', label: '캐터필러 마디에 끼우기', value: false }]);
  ui.readouts([['grip', '바닥 마찰'], ['slope', '오를 수 있는 경사']]);
  return {
    onControl(id, v) { st.fit = v; },
    update(dt) {
      st.x += ((st.fit ? 1 : 0) - st.x) * Math.min(1, dt * 4);
      model.handles.link.visible = st.fit || st.x > 0.02;
      model.handles.link.position.y = -3 - (1 - st.x) * 8;
      ui.readout('grip', st.fit ? '높음 (실리콘 · 마찰계수 약 0.8)' : '플라스틱만: 낮음 (약 0.3)');
      ui.readout('slope', st.fit ? '약 35°' : '약 15°');
    },
  };
}
