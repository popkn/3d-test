// 기능: 누르면 LOW(0), 떼면 HIGH(1). 내부 풀업 저항 때문에 안 누른 상태가 HIGH다.
export function create(model, ui) {
  const st = { hold: false, tap: 0, count: 0, last: false };
  ui.controls([
    { type: 'button', id: 'tap', label: '한 번 누르기' },
    { type: 'toggle', id: 'hold', label: '계속 누르고 있기', value: false },
  ]);
  ui.readouts([['state', '버튼'], ['out', '출력'], ['count', '누른 횟수']]);
  return {
    onControl(id, v) {
      if (id === 'tap') st.tap = 0.25;
      if (id === 'hold') st.hold = v;
    },
    update(dt) {
      st.tap = Math.max(0, st.tap - dt);
      const pressed = st.hold || st.tap > 0;
      if (pressed && !st.last) st.count += 1;
      st.last = pressed;
      model.handles.sw.userData.press(pressed);
      ui.readout('state', pressed ? '눌림' : '떼어짐');
      ui.readout('out', pressed ? 'LOW (0)' : 'HIGH (1)');
      ui.readout('count', `${st.count}회`);
    },
  };
}
