import * as THREE from 'three';
import { mesh } from './materials.js';
import { makeFrame } from './frame.js';
import { makeBolt } from './fasteners.js';

// 휠가이드: 모터 축(또는 서보 혼)에 끼워, 10mm 간격 구멍으로 프레임 · 휠을 붙이는 원판. 회전축 = Y
// dia: 지름, thick: 전체 두께(허브 포함), hub: 'dcut'(DC 모터 축) | 'servo'(서보 축 육각) | 'round'
// hex: 구멍마다 M3 너트 육각 테두리 (나일론 · 서보형)
export function makeWheelGuide({ dia, thick = 8, plate = 2.4, color, hub = 'dcut', hex = false, holeR = 10, holes = 4 }) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: color === 0xf2f1ec ? 0.6 : 0.45, metalness: 0 });
  // 구멍: Ø3.2 · 십자 4개 (반지름 10) → 모두 5 mm 격자 위 (마주 보는 구멍 20, 이웃 대각 구멍은 10 × 10)
  const pos = Array.from({ length: holes }, (_, i) => { const a = (i / holes) * Math.PI * 2 + Math.PI / 2; return [Math.round(Math.cos(a) * holeR * 1000) / 1000, Math.round(Math.sin(a) * holeR * 1000) / 1000]; });
  const s = new THREE.Shape(); s.absarc(0, 0, dia / 2, 0, Math.PI * 2, false);
  for (const [x, z] of pos) { const p = new THREE.Path(); p.absarc(x, z, 1.6, 0, Math.PI * 2, true); s.holes.push(p); }
  const hp = new THREE.Path(); hp.absarc(0, 0, 1.6, 0, Math.PI * 2, true); s.holes.push(hp);
  const pg = new THREE.ExtrudeGeometry(s, { depth: plate, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 2, curveSegments: 48 });
  pg.rotateX(-Math.PI / 2);
  g.add(mesh(pg, mat));
  // 허브 (가운데 기둥) + 축 구멍
  const hs = new THREE.Shape();
  if (hub === 'servo') { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; i ? hs.lineTo(Math.cos(a) * 5.5, Math.sin(a) * 5.5) : hs.moveTo(5.5, 0); } hs.closePath(); }
  else hs.absarc(0, 0, hub === 'round' ? 4 : 5, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); const pts = new THREE.Path().absarc(0, 0, hub === 'servo' ? 2.4 : 1.55, 0, Math.PI * 2, true).getPoints(24);
  hole.setFromPoints(hub === 'dcut' ? pts.map((p) => new THREE.Vector2(Math.min(p.x, 1.1), p.y)) : pts);
  hs.holes.push(hole);
  const hg = new THREE.ExtrudeGeometry(hs, { depth: thick, bevelEnabled: false, curveSegments: 24 });
  hg.rotateX(-Math.PI / 2);
  // 노란 Ø40은 사진처럼 윗면이 평평하다 → 허브를 아랫면으로
  if (hub === 'round') hg.translate(0, -thick + plate, 0);
  g.add(mesh(hg, mat));
  // 너트 육각 테두리 (너트가 돌지 않게 잡아 준다)
  if (hex) {
    for (const [x, z] of pos) {
      const o = new THREE.Shape(), inn = new THREE.Path();
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; const f = i ? 'lineTo' : 'moveTo'; o[f](Math.cos(a) * 4.4, Math.sin(a) * 4.4); inn[f](Math.cos(a) * 3.3, Math.sin(a) * 3.3); }
      o.closePath(); inn.closePath(); o.holes.push(inn);
      const r = new THREE.ExtrudeGeometry(o, { depth: 1.4, bevelEnabled: false });
      r.rotateX(-Math.PI / 2); r.translate(x, plate, -z);
      g.add(mesh(r, mat));
    }
  }
  g.userData = { pos, plate };
  return g;
}

// 휠가이드 시연 + 기능: 허브 반대쪽 평평한 면에 소3 프레임을 대고, 마주 보는 두 구멍에 볼트로 붙여 모터로 돌린다
export function buildGuideModel({ dia, thick, color, hub, hex, name, sub, hubLabel }) {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  root.add(spin);
  const guide = makeWheelGuide({ dia, thick, color, hub, hex });
  spin.add(guide);
  const att = new THREE.Group();
  const frame = makeFrame({ cols: 3, rows: 1, material: 'pcb' });
  const top = hub === 'round'; // 허브가 아래면 프레임은 평평한 윗면에
  frame.position.y = top ? 2.4 + 0.3 : -1.9;
  att.add(frame);
  for (const z of [-10, 10]) { const b = makeBolt({ length: 6 }); if (top) b.position.set(0, 2.7 + 1.6, z); else { b.rotation.x = Math.PI; b.position.set(0, -1.9, z); } att.add(b); }
  frame.rotation.y = Math.PI / 2;
  att.visible = false; att.userData.noBounds = true;
  spin.add(att);
  return {
    object3d: root,
    labels: [
      { name, sub, object: guide, anchor: [dia / 2 - 1, 2.4, 0], off: [70, -50] },
      { name: 'HUB', sub: hubLabel, object: guide, anchor: [0, hub === 'round' ? 2.4 - thick : thick, 0], off: [-120, -60] },
    ],
    frameWith: [att],
    handles: { spin, att },
  };
}

export function createGuideFunction(model, ui, { motors }) {
  const st = { att: false, rpm: 0, a: 0 };
  ui.controls([
    { type: 'toggle', id: 'att', label: '소3 프레임을 볼트 2개로 붙이기', value: false },
    { type: 'select', id: 'rpm', label: '돌리기', options: [['0', '정지'], ...motors], value: '0' },
  ]);
  ui.readouts([['holes', '구멍'], ['spin', '회전']]);
  return {
    onControl(id, v) { if (id === 'rpm') st.rpm = Number(v); else st[id] = v; },
    update(dt) {
      model.handles.att.visible = st.att;
      st.a += (st.rpm / 60) * Math.PI * 2 * dt;
      model.handles.spin.rotation.y = st.a;
      ui.readout('holes', '4개 십자 · 반지름 10 mm + 가운데 (모두 5 mm 격자 위 → 프레임 구멍과 맞음)');
      ui.readout('spin', st.rpm ? `${st.rpm} rpm${st.att ? ' · 붙인 프레임이 함께 돈다' : ''}` : '정지');
    },
  };
}
