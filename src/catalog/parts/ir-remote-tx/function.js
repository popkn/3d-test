// 기능: 누른 버튼 번호와 채널(DIP)을 적외선 신호로 보낸다. 누르는 동안 IR LED가 깜빡인다.
export function create(model, ui) {
  const h = model.handles;
  const st = { keys: new Array(8).fill(false), ch: 1, power: true, t: 0 };
  ui.controls([
    { type: 'toggle', id: 'power', label: '전원', value: true },
    { type: 'select', id: 'ch', label: '채널 (DIP)', options: Array.from({ length: 16 }, (_, i) => [String(i + 1), `${i + 1}번`]), value: '1' },
    ...Array.from({ length: 8 }, (_, i) => ({ type: 'toggle', id: `k${i}`, label: `버튼 ${i + 1}`, value: false, compact: true })),
  ]);
  ui.readouts([['keys', '누른 버튼'], ['signal', '신호'], ['ch', 'DIP 설정']]);
  return {
    onControl(id, v) {
      if (id.startsWith('k')) st.keys[Number(id.slice(1))] = v;
      else if (id === 'ch') st.ch = Number(v);
      else st[id] = v;
    },
    update(dt) {
      st.t += dt;
      const pressed = st.keys.map((k, i) => (k ? i + 1 : 0)).filter(Boolean);
      const sending = st.power && pressed.length > 0;
      h.keys.forEach((k, i) => k.userData.press(st.keys[i]));
      // DIP: 채널 번호 - 1 을 4비트로
      const bits = [0, 1, 2, 3].map((b) => ((st.ch - 1) >> b) & 1);
      h.dip.userData.setBits(bits);
      h.irLed.userData.setLevel(sending ? (Math.sin(st.t * 40) > 0 ? 0.9 : 0.2) : 0);
      h.waves.forEach((w, i) => {
        const u = (st.t * 1.6 + i / 3) % 1;
        w.position.z = -32 - u * 30;
        w.scale.setScalar(1 + u * 2);
        w.material.opacity = sending ? (1 - u) * 0.6 : 0;
      });
      ui.readout('keys', pressed.length ? pressed.join(' + ') : '-');
      ui.readout('signal', sending ? `보내는 중 · 채널 ${st.ch} · 37.9 kHz` : '없음');
      ui.readout('ch', `${st.ch}번 (${bits.slice().reverse().join('')})`);
    },
  };
}
