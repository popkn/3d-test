import * as THREE from 'three';

// 기능: 흰 LED로 비춘 물체의 반사광에서 R · G · B 양을 재고, 가장 가까운 색을 판단한다.
//   거리가 멀면 빛이 약해져 값이 작아지고, LED를 끄면 제대로 읽지 못한다.
const SAMPLES = {
  red: ['빨강 (컬러볼)', [220, 40, 34]], green: ['초록 (컬러볼)', [40, 190, 70]], blue: ['파랑', [40, 80, 220]],
  yellow: ['노랑 (컬러볼)', [235, 210, 40]], white: ['흰색', [240, 240, 235]], black: ['검정', [25, 25, 25]],
};
const REF = { 빨강: [1, 0.2, 0.15], 초록: [0.2, 1, 0.35], 파랑: [0.2, 0.35, 1], 노랑: [1, 0.9, 0.2] };

export function create(model, ui) {
  const { sample, white, T } = model.handles;
  const st = { item: 'red', led: true, dist: 8, place: true };
  ui.controls([
    { type: 'toggle', id: 'place', label: '물체 놓기', value: true },
    { type: 'select', id: 'item', label: '물체 색', options: Object.entries(SAMPLES).map(([k, v]) => [k, v[0]]), value: 'red' },
    { type: 'slider', id: 'dist', label: '거리', min: 3, max: 30, step: 0.5, value: 8, unit: 'mm' },
    { type: 'toggle', id: 'led', label: '흰색 LED', value: true },
  ]);
  ui.readouts([['rgb', '측정값 R · G · B'], ['color', '판단한 색'], ['note', '설명']]);
  return {
    onControl(id, v) { st[id] = v; },
    update() {
      const [name, rgb] = SAMPLES[st.item];
      sample.visible = st.place;
      sample.material.color.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace);
      sample.position.y = T + 8 + st.dist;
      white.userData.setLevel(st.led ? 1 : 0);
      const light = (st.led ? 1 : 0.08) * Math.max(0, 1 - (st.dist - 3) / 30);
      const read = st.place ? rgb.map((v) => Math.round(v * light)) : [0, 0, 0];
      const sum = read[0] + read[1] + read[2];
      let guess = '알 수 없음';
      if (sum > 600 * 0.35 && Math.min(...read) > Math.max(...read) * 0.75) guess = '흰색';
      else if (sum < 120) guess = st.place ? '검정 (또는 너무 어두움)' : '물체 없음';
      else {
        const n = read.map((v) => v / Math.max(...read));
        let best = Infinity;
        for (const [k, ref] of Object.entries(REF)) {
          const d = ref.reduce((a, r, i) => a + (r - n[i]) ** 2, 0);
          if (d < best) { best = d; guess = k; }
        }
      }
      ui.readout('rgb', read.join(' · '));
      ui.readout('color', guess);
      ui.readout('note', !st.led ? 'LED를 꺼서 반사광이 거의 없음' : st.dist > 20 ? '너무 멀어 값이 작음' : `${name} 측정 중`);
    },
  };
}
