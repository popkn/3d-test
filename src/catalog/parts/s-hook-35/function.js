// 기능: 프레임 두 장에 눌러 끼우고, 위 프레임을 돌려 관절처럼 움직이는지 본다.
export function create(model, ui) {
  const { hook, lower, upperPivot } = model.handles;
  const st = { frames: false, insert: 0, target: 0, angle: 0 };
  ui.controls([
    { type: 'toggle', id: 'frames', label: '프레임 두 장 보이기', value: false },
    { type: 'toggle', id: 'insert', label: '구멍에 눌러 끼우기', value: false },
    { type: 'slider', id: 'angle', label: '위 프레임 돌리기', min: -90, max: 90, step: 1, value: 0, unit: '°' },
  ]);
  ui.readouts([['state', '상태'], ['joint', '관절']]);
  return {
    onControl(id, v) { if (id === 'insert') st.target = v ? 1 : 0; else st[id] = v; },
    update(dt) {
      lower.visible = upperPivot.visible = st.frames;
      st.insert += Math.sign(st.target - st.insert) * Math.min(Math.abs(st.target - st.insert), dt * 1.2);
      hook.position.y = (1 - st.insert) * 10;
      const locked = st.insert > 0.99;
      upperPivot.rotation.y = (st.angle * Math.PI) / 180;
      ui.readout('state', locked ? '걸림 턱이 아래 프레임 밑에 걸림 → 안 빠짐' : st.insert < 0.01 ? '빠져 있음' : '누르는 중 (갈래가 오므라듦)');
      ui.readout('joint', locked ? `돌아감 · ${Math.round(st.angle)}°` : '고정 안 됨');
    },
  };
}
