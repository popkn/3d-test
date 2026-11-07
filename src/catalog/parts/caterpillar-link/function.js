import { trackPath } from '../../../kit/caterpillar.js';

// 기능: 마디를 이어 톱니 휠 두 개에 걸고, 모터 속도로 궤도를 돌린다.
export function create(model, ui) {
  const h = model.handles;
  const st = { track: true, rpm: 130, u: 0, angle: 0 };
  ui.controls([
    { type: 'toggle', id: 'track', label: '톱니 휠 2개에 감아 궤도 만들기', value: true },
    { type: 'select', id: 'rpm', label: '톱니 휠 모터', options: [['0', '정지'], ['130', 'DC 모터 130 rpm'], ['400', 'DC 모터 400 rpm']], value: '130' },
  ]);
  ui.readouts([['count', '필요한 마디'], ['speed', '이동 속도']]);
  return {
    onControl(id, v) { if (id === 'rpm') st.rpm = Number(v); else st[id] = v; },
    update(dt) {
      h.demo.visible = st.track;
      h.link.visible = !st.track;
      const w = (st.rpm / 60) * Math.PI * 2; // 톱니 휠 각속도
      st.angle += w * dt;
      h.wheels.forEach((s) => { s.rotation.z = -st.angle; });
      const per = 2 * h.DIST + 2 * Math.PI * h.R;
      st.u += (w * 30 * dt) / per; // 휠 둘레 속도로 궤도 이동
      h.links.forEach((l, i) => {
        const p = trackPath(st.u + i / h.count, h.DIST, h.R);
        l.position.set(p.x, p.y, 0);
        l.rotation.z = p.a;
      });
      ui.readout('count', `${h.count}개 (축 간격 100mm 기준)`);
      ui.readout('speed', `${(Math.PI * 0.06 * st.rpm / 60).toFixed(2)} m/s`);
    },
  };
}
