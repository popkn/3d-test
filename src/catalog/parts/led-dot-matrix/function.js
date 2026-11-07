import { redraw } from '../../../kit/textures.js';
import { DOTS } from './model.js';

// 기능: 16 × 8 삼색 도트에 그림·글자를 표시한다. 빨강 + 초록을 같이 켜면 주황.
const FONT5x7 = {
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};
const SMILE = ['00111100', '01000010', '10100101', '10000001', '10100101', '10011001', '01000010', '00111100'];
const HEART = ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000', '00000000'];
const COLORS = { red: '#ff3b2f', green: '#3dff6e', orange: '#ffa21f' };

function textColumns(str) {
  const cols = [];
  for (const ch of str) {
    const f = FONT5x7[ch] || FONT5x7[' '];
    for (let c = 0; c < 5; c++) cols.push(f.map((row) => row[c] === '1'));
    cols.push(new Array(7).fill(false));
  }
  return cols;
}
const ROBO = textColumns('ROBO ROBO ');

export function create(model, ui) {
  const { tex, colorTex } = model.handles;
  const st = { power: true, pattern: 'text', color: 'red', bright: 100, t: 0 };

  ui.controls([
    { type: 'toggle', id: 'power', label: '전원', value: true },
    { type: 'select', id: 'pattern', label: '표시', options: [['text', 'ROBO 글자 흐르기'], ['smile', '스마일'], ['heart', '하트'], ['rainbow', '색 순환'], ['all', '모두 켜기']], value: 'text' },
    { type: 'select', id: 'color', label: '색', options: [['red', '빨강'], ['green', '초록'], ['orange', '주황 (빨강+초록)']], value: 'red' },
    { type: 'slider', id: 'bright', label: '밝기', min: 0, max: 100, step: 1, value: 100, unit: '%' },
  ]);
  ui.readouts([['status', '상태'], ['on', '켜진 도트'], ['rg', '켜진 색']]);

  return {
    onControl(id, v) { st[id] = v; },
    update(dt) {
      st.t += dt;
      // 도트 상태 계산: grid[r][c] = 색 이름 또는 null
      const grid = Array.from({ length: DOTS.rows }, () => new Array(DOTS.cols).fill(null));
      if (st.power) {
        for (let r = 0; r < DOTS.rows; r++) {
          for (let c = 0; c < DOTS.cols; c++) {
            let on = false;
            let color = st.color;
            if (st.pattern === 'text') {
              const col = ROBO[(c + Math.floor(st.t * 8)) % ROBO.length];
              on = r > 0 && col[r - 1];
            } else if (st.pattern === 'smile') on = SMILE[r][c % 8] === '1';
            else if (st.pattern === 'heart') on = HEART[r][c % 8] === '1';
            else if (st.pattern === 'rainbow') {
              on = true;
              color = ['red', 'orange', 'green'][Math.floor((c + r + st.t * 6) / 3) % 3];
            } else on = true;
            if (on) grid[r][c] = color;
          }
        }
      }
      let count = 0;
      const used = new Set();
      // 표면 색: 꺼진 도트는 옅은 회색 점, 켜진 도트는 그 색
      redraw(colorTex, (g, w, h) => {
        g.fillStyle = '#e4e3df'; g.fillRect(0, 0, w, h);
        const px = w / DOTS.cols, py = h / DOTS.rows;
        for (let r = 0; r < DOTS.rows; r++) {
          for (let c = 0; c < DOTS.cols; c++) {
            const col = grid[r][c];
            g.fillStyle = col ? COLORS[col] : '#cfcdc8';
            g.globalAlpha = col ? 0.35 + 0.65 * (st.bright / 100) : 1;
            g.beginPath(); g.arc((c + 0.5) * px, (r + 0.5) * py, px * (col ? 0.42 : 0.3), 0, Math.PI * 2); g.fill();
          }
        }
        g.globalAlpha = 1;
      });
      redraw(tex, (g, w, h) => {
        g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
        const px = w / DOTS.cols, py = h / DOTS.rows;
        for (let r = 0; r < DOTS.rows; r++) {
          for (let c = 0; c < DOTS.cols; c++) {
            const col = grid[r][c];
            const x = (c + 0.5) * px, y = (r + 0.5) * py;
            if (col) {
              count += 1; used.add(col);
              g.globalAlpha = st.bright / 100;
              const grad = g.createRadialGradient(x, y, 0, x, y, px * 0.75);
              grad.addColorStop(0, '#ffffff');
              grad.addColorStop(0.25, COLORS[col]);
              grad.addColorStop(1, 'rgba(0,0,0,0)');
              g.fillStyle = grad;
              g.fillRect(x - px, y - py, px * 2, py * 2);
              g.globalAlpha = 1;
            }
          }
        }
      });
      ui.readout('status', st.power ? '표시 중' : '꺼짐');
      ui.readout('on', `${count} / ${DOTS.cols * DOTS.rows}`);
      ui.readout('rg', [...used].map((c) => ({ red: '빨강', green: '초록', orange: '주황' }[c])).join(' · ') || '-');
    },
  };
}
