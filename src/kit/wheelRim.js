import * as THREE from 'three';
import { mesh } from './materials.js';

// 플라스틱 휠 (바퀴 축 = Z): 타이어가 앉는 림 + 양쪽 턱 + 살(spoke) 원판 + 모터 축 허브
// seatR: 타이어 안쪽이 닿는 반지름, flangeR: 턱 반지름, width: 폭
// ridgeR · ridgeW를 주면 턱 대신 가운데 돌기 (타이어 안쪽 홈에 숨는 부분, 휠 Ø50[V2] 방식)
export function makeRim({ seatR, flangeR, width, hubR = 4.5, hubLen = null, spokes = 6, color = 0xf2f1ec, double = false, ridgeR = null, ridgeW = 0 }) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
  const w = width / 2, t = 1.2, rw = ridgeW / 2;
  const pts = ridgeR
    ? [[seatR - t, -w], [seatR, -w], [seatR, -rw - 0.6], [ridgeR, -rw], [ridgeR, rw], [seatR, rw + 0.6], [seatR, w], [seatR - t, w]]
    : [[seatR - t, -w], [flangeR, -w], [flangeR, -w + 1.2], [seatR, -w + 2], [seatR, w - 2], [flangeR, w - 1.2], [flangeR, w], [seatR - t, w]];
  const prof = pts.map(([r, y]) => new THREE.Vector2(r, y));
  const rim = new THREE.LatheGeometry(prof, 72);
  rim.rotateX(Math.PI / 2);
  g.add(mesh(rim, mat));
  // 살 원판: 원 안에 살 사이 창을 뚫는다
  const disc = (z) => {
    const s = new THREE.Shape(); s.absarc(0, 0, seatR - t + 0.2, 0, Math.PI * 2, false);
    const r0 = hubR + 2.5, r1 = seatR - t - 2.2, gap = 0.16 + 2.2 / r1;
    for (let i = 0; i < spokes; i++) {
      const a0 = (i / spokes) * Math.PI * 2 + gap, a1 = ((i + 1) / spokes) * Math.PI * 2 - gap;
      const p = new THREE.Path(); p.absarc(0, 0, r1, a0, a1, false); p.absarc(0, 0, r0, a1 - 0.05, a0 + 0.05, true); p.closePath();
      s.holes.push(p);
    }
    const geo = new THREE.ExtrudeGeometry(s, { depth: 1.8, bevelEnabled: false, curveSegments: 24 });
    geo.translate(0, 0, z - 0.9);
    return mesh(geo, mat);
  };
  g.add(disc(double ? -w * 0.45 : 0));
  if (double) g.add(disc(w * 0.45));
  // 허브 + D자 축 구멍 (모터 축 Ø3 · D컷)
  const hs = new THREE.Shape(); hs.absarc(0, 0, hubR, 0, Math.PI * 2, false);
  hs.holes.push(new THREE.Path(new THREE.Shape().absarc(0, 0, 1.55, 0, Math.PI * 2, true).getPoints(24).map((p) => new THREE.Vector2(Math.min(p.x, 1.1), p.y))));
  const hl = hubLen ?? width;
  const hub = new THREE.ExtrudeGeometry(hs, { depth: hl, bevelEnabled: false, curveSegments: 24 });
  hub.translate(0, 0, -hl / 2);
  g.add(mesh(hub, mat));
  return g;
}

// 타이어 Ø50[V2] 단면 (r, y): 바깥 Ø50, 옆 입구 Ø45, 안쪽 홈 Ø48 × 5 (휠 돌기가 들어감), 폭 8.5
export const TIRE50_PROFILE = [[22.5, -4.25], [23, -4.25], [24.6, -3.4], [25, -2], [25, 2], [24.6, 3.4], [23, 4.25], [22.5, 4.25], [22.5, 2.6], [24.1, 2.5], [24.1, -2.5], [22.5, -2.6]];
export function makeTire50() {
  const g = new THREE.LatheGeometry(TIRE50_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 72);
  g.rotateX(Math.PI / 2);
  return mesh(g, new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.85 }));
}

// 휠 기능 공통: 타이어 끼우기 미리보기 + 모터 속도에 따른 이동 속도 (둘레 = π × 바퀴 지름)
export function createWheelFunction(model, ui, { dia, tireLabel }) {
  const st = { tire: false, rpm: 0, a: 0 };
  ui.controls([
    { type: 'toggle', id: 'tire', label: `${tireLabel} 끼우기 (미리보기)`, value: false },
    { type: 'select', id: 'rpm', label: '모터', options: [['0', '정지'], ['130', 'DC 모터 130 rpm'], ['400', 'DC 모터 400 rpm']], value: '0' },
  ]);
  ui.readouts([['dia', '바퀴 지름'], ['round', '한 바퀴'], ['speed', '이동 속도']]);
  return {
    onControl(id, v) { if (id === 'rpm') st.rpm = Number(v); else st[id] = v; },
    update(dt) {
      model.handles.tire.visible = st.tire;
      st.a += (st.rpm / 60) * Math.PI * 2 * dt;
      model.handles.spin.rotation.z = -st.a;
      const d = st.tire ? dia : model.handles.rimDia;
      ui.readout('dia', st.tire ? `Ø${dia} mm (타이어 포함${model.handles.visibleDia ? ` · 휠은 Ø${model.handles.visibleDia}만 보임` : ''})` : `Ø${d} mm (휠만)`);
      ui.readout('round', `${(Math.PI * d / 10).toFixed(1)} cm`);
      ui.readout('speed', `${(Math.PI * d / 1000 * st.rpm / 60).toFixed(2)} m/s`);
    },
  };
}
