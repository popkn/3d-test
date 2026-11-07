import * as THREE from 'three';
import { mesh } from './materials.js';

// 인너 스폰지 (띠 모양): 펼친 띠를 감으면 타이어 안쪽에 들어가는 고리가 된다.
//   setCurl(0) = 곧게 펼침, setCurl(1) = 완전한 고리 (지름 = 길이 / π)
export function buildInner({ length, width, height, color = 0x2c3a5e, name, sub }) {
  const N = 48;
  const root = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1 });
  const segL = length / N;
  const segGeo = new THREE.BoxGeometry(segL * 1.04, height, width);
  const segs = [];
  for (let i = 0; i < N; i++) {
    const m = mesh(segGeo, mat);
    root.add(m);
    segs.push(m);
  }
  function setCurl(t) {
    const theta = Math.max(1e-4, t) * Math.PI * 2;
    const R = length / theta;
    for (let i = 0; i < N; i++) {
      const s = (i + 0.5) / N - 0.5; // -0.5 ~ 0.5
      if (t < 0.001) { segs[i].position.set(s * length, height / 2, 0); segs[i].rotation.z = 0; continue; }
      const a = s * theta;
      // 띠 가운데를 바닥에 두고 위로 말아 올린다
      segs[i].position.set(Math.sin(a) * R, R - Math.cos(a) * R + height / 2, 0);
      segs[i].rotation.z = a;
    }
  }
  setCurl(0);
  return {
    object3d: root,
    labels: [{ name, sub, object: segs[Math.floor(N * 0.75)], anchor: [0, height / 2, 0], off: [60, -60] }],
    handles: { setCurl, length },
  };
}

export function createInnerFunction(model, ui, { tireName }) {
  const { setCurl, length } = model.handles;
  const st = { curl: 0, c: 0 };
  ui.controls([{ type: 'slider', id: 'curl', label: '휠에 감기', min: 0, max: 100, step: 1, value: 0, unit: '%' }]);
  ui.readouts([['state', '상태'], ['ring', '고리 지름']]);
  return {
    onControl(id, v) { st.curl = v / 100; },
    update(dt) {
      st.c += (st.curl - st.c) * Math.min(1, dt * 6);
      setCurl(st.c);
      ui.readout('state', st.c > 0.98 ? `고리 완성: ${tireName} 안쪽에 들어감` : st.c < 0.02 ? '펼친 띠' : '감는 중');
      ui.readout('ring', `Ø${(length / Math.PI).toFixed(0)} mm (길이 ${length}mm ÷ π)`);
    },
  };
}
