import * as THREE from 'three';

// 기능: 빨강·초록·파랑 밝기(0~255)를 섞어 색을 만든다. 무지개 모드는 색이 계속 바뀐다.
const PRESETS = {
  red: [255, 0, 0], green: [0, 255, 0], blue: [0, 0, 255], yellow: [255, 200, 0],
  sky: [0, 200, 255], purple: [180, 0, 255], white: [255, 255, 255], off: [0, 0, 0],
};
const NAMES = { red: '빨강', green: '초록', blue: '파랑', yellow: '노랑', sky: '하늘', purple: '보라', white: '흰색', off: '끄기' };

export function create(model, ui) {
  const { shellMat, light } = model.handles;
  const st = { r: 255, g: 0, b: 0, rainbow: false, t: 0 };
  ui.controls([
    { type: 'select', id: 'preset', label: '색 고르기', options: Object.keys(PRESETS).map((k) => [k, NAMES[k]]), value: 'red' },
    { type: 'slider', id: 'r', label: '빨강 (R)', min: 0, max: 255, step: 1, value: 255 },
    { type: 'slider', id: 'g', label: '초록 (G)', min: 0, max: 255, step: 1, value: 0 },
    { type: 'slider', id: 'b', label: '파랑 (B)', min: 0, max: 255, step: 1, value: 0 },
    { type: 'toggle', id: 'rainbow', label: '무지개 모드', value: false },
  ]);
  ui.readouts([['rgb', 'RGB 값'], ['hex', '색 코드'], ['mode', '모드']]);
  const color = new THREE.Color();
  return {
    onControl(id, v) {
      if (id === 'preset') [st.r, st.g, st.b] = PRESETS[v];
      else st[id] = v;
    },
    update(dt) {
      st.t += dt;
      let { r, g, b } = st;
      if (st.rainbow) {
        color.setHSL((st.t * 0.15) % 1, 1, 0.5);
        [r, g, b] = [color.r * 255, color.g * 255, color.b * 255].map(Math.round);
      }
      color.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
      const lvl = Math.max(r, g, b) / 255;
      // 흰 덮개가 안쪽 빛으로 물드는 모습: 표면색도 빛 색 쪽으로 섞는다
      shellMat.color.setRGB(1, 1, 1).lerp(color, 0.85 * lvl);
      shellMat.emissive.copy(color);
      shellMat.emissiveIntensity = 1.8 * lvl;
      light.color.copy(color);
      light.intensity = 900 * lvl;
      ui.readout('rgb', `${r}, ${g}, ${b}`);
      ui.readout('hex', `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`);
      ui.readout('mode', st.rainbow ? '무지개' : '고정 색');
    },
  };
}
