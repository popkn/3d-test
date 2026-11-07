// 기능: 송신부(화면 속 가상 리모컨)에서 온 신호를 받아, 채널이 같으면 버튼 번호의 출력을 켠다.
export function create(model, ui) {
  const h = model.handles;
  const st = { keys: new Array(8).fill(false), txCh: 1, rxCh: 1, power: true, t: 0 };
  const chOpts = Array.from({ length: 16 }, (_, i) => [String(i + 1), `${i + 1}번`]);
  ui.controls([
    { type: 'toggle', id: 'power', label: '전원 (5V)', value: true },
    { type: 'select', id: 'rxCh', label: '수신부 채널 (DIP)', options: chOpts, value: '1' },
    { type: 'select', id: 'txCh', label: '리모컨 채널', options: chOpts, value: '1' },
    ...Array.from({ length: 8 }, (_, i) => ({ type: 'toggle', id: `k${i}`, label: `리모컨 ${i + 1}`, value: false, compact: true })),
  ]);
  ui.readouts([['rx', '받은 신호'], ['match', '채널'], ['out', '출력 1~8']]);
  return {
    onControl(id, v) {
      if (id.startsWith('k')) st.keys[Number(id.slice(1))] = v;
      else if (id === 'power') st.power = v;
      else st[id] = Number(v);
    },
    update(dt) {
      st.t += dt;
      const any = st.keys.some(Boolean);
      const match = st.txCh === st.rxCh;
      const active = st.power && any && match;
      h.dip.userData.setBits([0, 1, 2, 3].map((b) => ((st.rxCh - 1) >> b) & 1));
      h.lamp.userData.setLevel(st.power && any ? (Math.sin(st.t * 30) > 0 ? 1 : 0.15) : 0);
      const outs = st.keys.map((k) => active && k);
      ui.readout('rx', !st.power ? '전원 꺼짐' : any ? `채널 ${st.txCh} 신호 수신` : '대기');
      ui.readout('match', match ? `일치 (${st.rxCh}번)` : `다름: 리모컨 ${st.txCh}번 ≠ 수신부 ${st.rxCh}번 → 무시`);
      ui.readout('out', outs.map((o) => (o ? '■' : '□')).join(''));
    },
  };
}
