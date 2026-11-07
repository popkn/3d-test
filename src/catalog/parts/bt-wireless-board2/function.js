// 기능: USB 전원 → 모듈 2개 꽂기 → 페어링(STATUS LED 깜빡임 → 켜짐 유지 = 연결 완료).
export function create(model, ui) {
  const { modules, leds } = model.handles;
  const st = { usb: false, m1: false, m2: false, pairing: 0, paired: false, t: 0 };
  ui.controls([
    { type: 'toggle', id: 'usb', label: 'PC USB 연결', value: false },
    { type: 'toggle', id: 'm1', label: '블루투스 모듈 1 꽂기', value: false },
    { type: 'toggle', id: 'm2', label: '블루투스 모듈 2 꽂기', value: false },
    { type: 'button', id: 'pair', label: '페어링 시작' },
  ]);
  ui.readouts([['state', '상태'], ['port', 'PC 포트'], ['mods', '모듈']]);
  return {
    onControl(id, v) {
      if (id === 'pair') {
        if (!st.usb) ui.log('USB를 먼저 연결하세요');
        else if (!st.m1 || !st.m2) ui.log('모듈 2개를 모두 꽂으세요');
        else { st.pairing = 2.5; st.paired = false; ui.log('페어링 시작'); }
        return;
      }
      st[id] = v;
      if (!st.usb || !st.m1 || !st.m2) { st.paired = false; st.pairing = 0; }
    },
    update(dt) {
      st.t += dt;
      if (st.pairing > 0) { st.pairing -= dt; if (st.pairing <= 0) { st.paired = true; ui.log('페어링 완료: 두 모듈이 짝을 맺음'); } }
      modules[0].visible = st.m1; modules[1].visible = st.m2;
      const mods = [st.m1, st.m2];
      leds.p.forEach((l, i) => l.userData.setLevel(st.usb && mods[i] ? 1 : 0));
      const blink = Math.sin(st.t * 12) > 0 ? 1 : 0;
      leds.s.forEach((l, i) => l.userData.setLevel(!st.usb || !mods[i] ? 0 : st.paired ? 1 : st.pairing > 0 ? blink : 0.15));
      ui.readout('state', !st.usb ? 'USB 연결 대기' : st.paired ? '페어링 완료' : st.pairing > 0 ? '페어링 중…' : '대기');
      ui.readout('port', st.usb ? 'COM6 · CP210x' : '-');
      ui.readout('mods', `${st.m1 ? '1번 ○' : '1번 ×'} · ${st.m2 ? '2번 ○' : '2번 ×'}`);
    },
  };
}
