// 소리 (Web Audio). 브라우저 정책상 사용자가 버튼을 누른 뒤에만 소리가 난다.
let ctx = null;
function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// 계속 울리는 소리. 반환값의 set(freq, volume), stop()으로 조절한다.
export function startTone(freq = 2300, volume = 0.15, type = 'square') {
  const a = audio();
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(volume, a.currentTime + 0.01);
  osc.connect(gain).connect(a.destination);
  osc.start();
  return {
    set(f, v = volume) { osc.frequency.setTargetAtTime(f, a.currentTime, 0.01); gain.gain.setTargetAtTime(v, a.currentTime, 0.01); },
    stop() { gain.gain.setTargetAtTime(0, a.currentTime, 0.01); osc.stop(a.currentTime + 0.08); },
  };
}

// 짧은 삑 소리
export function beep(freq = 2300, ms = 120, volume = 0.15) {
  const t = startTone(freq, volume);
  setTimeout(() => t.stop(), ms);
}
