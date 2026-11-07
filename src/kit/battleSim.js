// 배틀무기 기능 (공통): 로봇 앞에 달았을 때의 모습과 구멍 정보
export function createBattleFunction(model, ui) {
  const { info, frame } = model.handles;
  const st = { spin: false, a: 0 };
  ui.controls([{ type: 'toggle', id: 'spin', label: '서보에 달아 휘두르기 (±45°)', value: false }]);
  ui.readouts([['holes', '구멍'], ['use', '쓰임']]);
  return {
    onControl(id, v) { st.spin = v; },
    update(dt) {
      st.a += dt;
      frame.rotation.y = st.spin ? Math.sin(st.a * 4) * Math.PI / 4 : 0;
      ui.readout('holes', info.holes);
      ui.readout('use', '배틀 로봇 대회용 무기 · 10mm 간격 구멍으로 프레임 · 서보에 고정');
    },
  };
}
