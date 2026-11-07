import { LENGTHS } from './model.js';

// 기능: 길이를 고르고, 프레임 두 장 사이에 세워 층 간격을 확인한다.
export function create(model, ui) {
  const h = model.handles;
  const st = { len: 40, demo: false };
  ui.controls([
    { type: 'select', id: 'len', label: '길이', options: LENGTHS.map((l) => [String(l), `서포트 ${l}mm`]), value: '40' },
    { type: 'toggle', id: 'demo', label: '프레임 두 장 사이에 세우기', value: false },
  ]);
  ui.readouts([['len', '몸통 길이'], ['total', '전체 길이'], ['gap', '프레임 사이 간격']]);
  return {
    onControl(id, v) { if (id === 'len') { st.len = Number(v); h.setLength(st.len); } else st[id] = v; },
    update() {
      h.lower.visible = st.demo;
      h.upper.visible = st.demo;
      ui.readout('len', `${st.len} mm`);
      ui.readout('total', `${st.len + 6} mm (수나사 6mm 포함)`);
      ui.readout('gap', st.demo ? `${st.len} mm` : '-');
    },
  };
}
