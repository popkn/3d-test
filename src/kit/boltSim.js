import * as THREE from 'three';
import { M, mesh } from './materials.js';
import { makeBolt, hexNutGeometry } from './fasteners.js';

// 볼트 부품 공통: 볼트 + 체결 시연(프레임 판을 지나 아래 너트에 조이기)
export function buildBolt({ length, dia = 3, headDia = 5.5, washer = false, name, sub }) {
  const root = new THREE.Group();
  const bolt = makeBolt({ length, dia, headDia });
  if (washer) {
    const w = mesh(new THREE.CylinderGeometry(headDia / 2 + 1.2, headDia / 2 + 1.2, 0.6, 32), M.metal);
    w.position.y = 0.3;
    bolt.add(w);
  }
  bolt.position.y = length;
  root.add(bolt);
  // 시연용: 3.5mm 프레임 판 + 아래 너트 (크기 측정에서 뺀다)
  const plate = mesh(new THREE.BoxGeometry(20, 3.5, 10), new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.6 }));
  plate.userData.noBounds = true;
  plate.visible = false;
  root.add(plate);
  const nut = mesh(hexNutGeometry({ af: dia === 3 ? 5.5 : 5, thickness: 2.2, hole: dia / 2 }), M.metal);
  nut.userData.noBounds = true;
  nut.visible = false;
  root.add(nut);
  return {
    object3d: root,
    labels: [
      { name, sub, object: bolt, anchor: [0, 1.5, 0], off: [60, -60] },
      { name: 'THREAD', sub: `피치 ${dia === 3 ? '0.5' : '0.45'}mm (표준)`, object: bolt, anchor: [0, -length / 2, 0], off: [-120, 30] },
    ],
    frameWith: [plate, nut],
    handles: { bolt, plate, nut, length, dia },
  };
}

export function createBoltFunction(model, ui, { selfTapping = false } = {}) {
  const { bolt, plate, nut, length, dia } = model.handles;
  const pitch = dia === 3 ? 0.5 : 0.45;
  const st = { demo: true, turns: 0 };
  const maxTurns = length / pitch;
  ui.controls([
    { type: 'toggle', id: 'demo', label: selfTapping ? '플라스틱 판에 박기' : '프레임 판 + 너트로 조이기', value: true },
    { type: 'slider', id: 'turns', label: '돌린 횟수', min: 0, max: maxTurns, step: 0.5, value: 0, unit: '회' },
  ]);
  ui.readouts([['depth', '들어간 길이'], ['state', '상태']]);
  return {
    onControl(id, v) { st[id] = v; },
    update() {
      plate.visible = st.demo;
      nut.visible = st.demo && !selfTapping;
      const depth = st.turns * pitch;
      // 판 윗면 = y 0, 볼트 끝이 판 위에서 시작해 내려간다
      plate.position.y = -1.75;
      nut.position.y = -3.5 - 2.2;
      bolt.position.y = st.demo ? length - depth + 0.01 : length;
      bolt.rotation.y = -st.turns * Math.PI * 2;
      ui.readout('depth', `${depth.toFixed(1)} mm`);
      ui.readout('state', !st.demo ? '볼트만 보기'
        : depth >= length - 0.01 ? '머리까지 조임 완료'
          : depth > 3.5 ? (selfTapping ? '나사산을 내며 박히는 중' : '너트에 물림') : '판을 지나는 중');
    },
  };
}
