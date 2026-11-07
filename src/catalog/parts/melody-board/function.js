import { startTone } from '../../../kit/audio.js';

// 기능: 저장된 멜로디를 스피커로 연주한다 (실제 소리). LEFT/RIGHT로 곡을 고른다.
const N = { 도: 523, 레: 587, 미: 659, 파: 698, 솔: 784, 라: 880, 시: 988, 높은도: 1047, 쉼: 0 };
const SONGS = [
  ['학교종', '솔솔라라솔솔미 솔솔미미레 솔솔라라솔솔미 솔미레미도'],
  ['작은 별', '도도솔솔라라솔 파파미미레레도 솔솔파파미미레 솔솔파파미미레'],
  ['생일 축하', '솔솔라솔높은도시 솔솔라솔레도'],
];
function parse(str) {
  const out = [];
  for (const part of str.split(' ')) {
    let s = part;
    while (s.length) {
      const k = ['높은도', '도', '레', '미', '파', '솔', '라', '시'].find((n) => s.startsWith(n));
      out.push(k); s = s.slice(k.length);
    }
    out.push('쉼');
  }
  return out;
}

export function create(model, ui) {
  const h = model.handles;
  const st = { song: 0, playing: false, idx: 0, t: 0, tone: null, beat: 0.32, press: 0 };
  ui.controls([
    { type: 'select', id: 'song', label: '곡', options: SONGS.map(([n], i) => [String(i), n]), value: '0' },
    { type: 'button', id: 'left', label: '◀ LEFT (이전 곡)' },
    { type: 'button', id: 'right', label: 'RIGHT (다음 곡) ▶' },
    { type: 'button', id: 'play', label: '연주 / 정지' },
  ]);
  ui.readouts([['song', '곡'], ['note', '지금 음'], ['state', '상태']]);
  const stop = () => { st.playing = false; st.tone?.stop(); st.tone = null; };
  return {
    onControl(id, v) {
      if (id === 'song') { st.song = Number(v); st.idx = 0; }
      if (id === 'left' || id === 'right') { st.song = (st.song + (id === 'left' ? SONGS.length - 1 : 1)) % SONGS.length; st.idx = 0; st.press = id === 'left' ? 0.2 : -0.2; }
      if (id === 'play') { if (st.playing) stop(); else { st.playing = true; st.idx = 0; st.t = 0; st.tone = startTone(0, 0.12, 'square'); } }
    },
    update(dt) {
      const notes = parse(SONGS[st.song][1]);
      let name = '-';
      if (st.playing) {
        st.t += dt;
        if (st.t > st.beat) { st.t = 0; st.idx += 1; }
        if (st.idx >= notes.length) { stop(); }
        else {
          name = notes[st.idx];
          const f = N[name];
          st.tone?.set(f || 1, f ? 0.12 : 0);
        }
      }
      // 버튼 눌림 표시
      st.press = st.press > 0 ? Math.max(0, st.press - dt) : Math.min(0, st.press + dt);
      h.left.userData.press(st.press > 0);
      h.right.userData.press(st.press < 0);
      // 스피커 진동 + LED (음 높이에 따라 켜지는 개수)
      const on = st.playing && name !== '쉼' && name !== '-';
      h.grille.position.y = 5.1 + (on ? Math.sin(performance.now() / 4) * 0.15 : 0);
      const lvl = on ? Math.round(((N[name] - 500) / 550) * 7) : 0;
      h.leds.forEach((l, i) => l.userData.setLevel(i < lvl ? 1 : 0));
      ui.readout('song', SONGS[st.song][0]);
      ui.readout('note', on ? `${name} (${N[name]} Hz)` : '-');
      ui.readout('state', st.playing ? '연주 중' : '정지');
    },
    dispose() { stop(); },
  };
}
