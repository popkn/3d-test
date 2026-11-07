// 기능: 신호로 LED를 켜고 끈다. 밝기는 PWM(켜짐 비율), 모드는 켜기 / 깜빡임 / 숨쉬기.
export function create(model, ui) {
  const st = { on: false, duty: 100, mode: 'on', hz: 2, t: 0 };

  ui.controls([
    { type: 'toggle', id: 'on', label: '신호 ON / OFF', value: false },
    { type: 'slider', id: 'duty', label: '밝기 (PWM)', min: 0, max: 100, step: 1, value: 100, unit: '%' },
    { type: 'select', id: 'mode', label: '모드', options: [['on', '계속 켜기'], ['blink', '깜빡임'], ['breath', '숨쉬기']], value: 'on' },
    { type: 'slider', id: 'hz', label: '깜빡임 속도', min: 0.5, max: 10, step: 0.5, value: 2, unit: 'Hz' },
  ]);
  ui.readouts([['status', '상태'], ['level', '현재 밝기'], ['current', '전류 (추정)']]);

  return {
    onControl(id, v) { st[id] = v; },
    update(dt) {
      st.t += dt;
      let lvl = 0;
      if (st.on) {
        const d = st.duty / 100;
        if (st.mode === 'on') lvl = d;
        if (st.mode === 'blink') lvl = Math.sin(st.t * st.hz * Math.PI * 2) > 0 ? d : 0;
        if (st.mode === 'breath') lvl = d * (0.5 - 0.5 * Math.cos(st.t * st.hz * Math.PI));
      }
      model.handles.led.userData.setLevel(lvl);
      ui.readout('status', st.on ? '켜짐' : '꺼짐');
      ui.readout('level', `${Math.round(lvl * 100)}%`);
      // 5V, LED 순방향 전압 약 2V, 저항 220Ω 가정 → 최대 약 13.6mA
      ui.readout('current', `${(13.6 * lvl).toFixed(1)} mA`);
    },
  };
}
