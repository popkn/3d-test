// 기능: 목표 각도(0~180°)까지 60rpm(초당 360°) 속도로 돌아가 멈춘다.
export function create(model, ui) {
  const st = { power: false, target: 90, angle: 90, sweep: false, t: 0 };
  ui.controls([
    { type: 'toggle', id: 'power', label: '전원 (6V)', value: false },
    { type: 'slider', id: 'target', label: '목표 각도', min: 0, max: 180, step: 1, value: 90, unit: '°' },
    { type: 'toggle', id: 'sweep', label: '왕복 동작 (0° ↔ 180°)', value: false },
  ]);
  ui.readouts([['angle', '현재 각도'], ['state', '상태'], ['spec', '성능']]);
  const SPEED = 360; // 60rpm = 초당 360도
  return {
    onControl(id, v) { st[id] = v; },
    update(dt) {
      st.t += dt;
      if (st.sweep) st.target = Math.sin(st.t * 1.2) > 0 ? 180 : 0;
      if (st.power) {
        const d = st.target - st.angle;
        st.angle += Math.sign(d) * Math.min(Math.abs(d), SPEED * dt);
      }
      const rad = THREE_DEG * (st.angle - 90);
      model.handles.arm.rotation.y = -rad;
      model.handles.hub.userData.spin.rotation.y = -rad;
      ui.readout('angle', `${Math.round(st.angle)}°`);
      ui.readout('state', !st.power ? '전원 꺼짐' : Math.abs(st.target - st.angle) < 0.5 ? '도착 · 위치 유지' : '이동 중');
      ui.readout('spec', '60 rpm · 4 kg·cm · 최대 1.2 A');
    },
  };
}
const THREE_DEG = Math.PI / 180;
