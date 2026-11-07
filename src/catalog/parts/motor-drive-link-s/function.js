// 기능: CPU 보드 EX-Motor3/4 신호 → (A3 보드) → Motor3 · Motor4.
//   A3 보드가 꽂혀 있어야 모터가 돈다. 전원은 CPU 보드를 통해 6~20V, 2A를 넘으면 퓨즈가 끊어진다.
const CMDS = [['stop', '정지'], ['fwd', '정회전'], ['rev', '역회전']];

export function create(model, ui) {
  const h = model.handles;
  const st = { cpu: true, a3: true, volt: 12, m3: 'fwd', m4: 'rev', load: 0.6, fuse: true, t: 0 };
  ui.controls([
    { type: 'toggle', id: 'cpu', label: 'CPU 보드 연결 (EX-Motor3/4)', value: true },
    { type: 'toggle', id: 'a3', label: 'A3 보드 장착', value: true },
    { type: 'slider', id: 'volt', label: 'CPU 보드 전원', min: 0, max: 20, step: 0.5, value: 12, unit: 'V' },
    { type: 'select', id: 'm3', label: 'Motor3 명령', options: CMDS, value: 'fwd' },
    { type: 'select', id: 'm4', label: 'Motor4 명령', options: CMDS, value: 'rev' },
    { type: 'slider', id: 'load', label: '모터 하나당 전류', min: 0.1, max: 1.5, step: 0.05, value: 0.6, unit: 'A' },
    { type: 'button', id: 'reset', label: '퓨즈 교체' },
  ]);
  ui.readouts([['path', '신호 경로'], ['m3', 'Motor3'], ['m4', 'Motor4'], ['current', '전체 전류']]);

  return {
    onControl(id, v) {
      if (id === 'reset') { st.fuse = true; ui.log('퓨즈를 교체했습니다'); return; }
      st[id] = v;
    },
    update(dt) {
      st.t += dt;
      h.a3.visible = st.a3;
      const live = st.cpu && st.a3 && st.fuse && st.volt >= 6;
      const running = (c) => live && c !== 'stop';
      const total = (running(st.m3) ? st.load : 0) + (running(st.m4) ? st.load : 0);
      if (live && total > 2) { st.fuse = false; ui.log(`과전류 ${total.toFixed(2)}A → 퓨즈가 끊어졌습니다`); }
      const show = (c) => (!live ? '정지 (신호 없음)' : c === 'stop' ? '정지' : `${c === 'fwd' ? '정회전' : '역회전'} · ${st.volt.toFixed(1)}V`);
      h.led3.userData.setLevel(running(st.m3) ? 0.6 + 0.4 * Math.sin(st.t * 8) : 0);
      h.led4.userData.setLevel(running(st.m4) ? 0.6 + 0.4 * Math.sin(st.t * 8 + 1) : 0);
      ui.readout('path', !st.cpu ? 'CPU 보드 연결 안 됨' : !st.a3 ? 'A3 보드 없음 (모터 구동 불가)' : !st.fuse ? '퓨즈 끊어짐' : st.volt < 6 ? '전압 부족 (6V 이상)' : 'CPU → A3 → Motor3 · Motor4');
      ui.readout('m3', show(st.m3));
      ui.readout('m4', show(st.m4));
      ui.readout('current', live ? `${total.toFixed(2)} A / 퓨즈 2 A` : '-');
    },
  };
}
