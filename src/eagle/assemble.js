import * as THREE from 'three';
import { partBounds } from '../viewer/scene.js';
import ASSEMBLY from './assembly.js';

// 도면(tools/eagle_blueprint.py)의 부품 배치대로 실제 부품 모델을 놓아 독수리를 조립한다.
// 각 배치: c = 중심, z = 크기 (X, Y, Z), 방향 힌트 up / xdir / zdir = 모델의 +Y / +X / +Z가 향할 방향, euler = 직접 회전(도)

// 축 정렬 회전 24가지 (부호 있는 순열, 행렬식 +1)
const ROTS = [];
for (const perm of [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]) {
  for (let s = 0; s < 8; s++) {
    const sg = [s & 1 ? -1 : 1, s & 2 ? -1 : 1, s & 4 ? -1 : 1];
    const m = new THREE.Matrix4();
    const e = new Array(16).fill(0);
    // 열 j = 모델 축 j가 가는 월드 방향
    for (let j = 0; j < 3; j++) e[j * 4 + perm[j]] = sg[j];
    e[15] = 1;
    m.fromArray(e);
    if (Math.abs(m.determinant() - 1) < 1e-6) ROTS.push({ m, perm, sg });
  }
}
const axisVec = (j) => new THREE.Vector3(j === 0 ? 1 : 0, j === 1 ? 1 : 0, j === 2 ? 1 : 0);
const same = (v, arr) => arr && Math.abs(v.x - arr[0]) < 1e-6 && Math.abs(v.y - arr[1]) < 1e-6 && Math.abs(v.z - arr[2]) < 1e-6;

function chooseRotation(native, target, hint) {
  let best = null;
  for (const r of ROTS) {
    if (hint.up && !same(axisVec(1).applyMatrix4(r.m), hint.up)) continue;
    if (hint.xdir && !same(axisVec(0).applyMatrix4(r.m), hint.xdir)) continue;
    if (hint.zdir && !same(axisVec(2).applyMatrix4(r.m), hint.zdir)) continue;
    const mapped = [0, 0, 0];
    for (let j = 0; j < 3; j++) mapped[r.perm[j]] = native[j];
    let err = 0;
    for (let i = 0; i < 3; i++) err += Math.abs(Math.log(Math.max(mapped[i], 0.5) / Math.max(target[i], 0.5)));
    if (!best || err < best.err - 1e-6) best = { r, err };
  }
  return best ? best.r.m : new THREE.Matrix4();
}

// 시연용 물체(볼트 · 판 · 공 등)는 조립에서 뺀다
function hideDemo(obj) {
  obj.traverse((o) => { if (o !== obj && o.userData?.noBounds) o.visible = false; });
}

// 조립 데이터에 나오는 부품 모듈을 모두 불러온다
export async function loadModules(list, loadPart, onProgress) {
  const ids = [...new Set(list.map((a) => a.id))];
  const mods = {};
  let done = 0;
  await Promise.all(ids.map(async (id) => { mods[id] = await loadPart(id); onProgress?.(++done / ids.length); }));
  return mods;
}

// 배치 하나 → 부품 모델을 도면 위치 · 크기 · 방향에 맞춰 넣은 그룹 (월드 좌표)
export function makeHolder(a, mods) {
  const model = mods[a.id].build();
  hideDemo(model.object3d);
  const holder = new THREE.Group();
  holder.userData = { name: a.n, id: a.id, sheet: a.s };
  if (a.id === 'support-spacer' && a.length && model.handles?.setLength) {
    // 서포트: 길이를 도면 값으로, 몸통 아래가 도면 상자 아래에
    model.handles.setLength(a.length);
    holder.add(model.object3d);
    holder.position.set(a.c[0], a.c[1] - a.z[1] / 2, a.c[2]);
  } else {
    const inner = new THREE.Group();
    inner.add(model.object3d);
    holder.add(inner);
    inner.updateMatrixWorld(true);
    const box = partBounds(inner);
    const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    model.object3d.position.sub(c);
    if (a.euler) holder.rotation.set(...a.euler.map((d) => THREE.MathUtils.degToRad(d)), a.eorder || 'XYZ');
    else holder.quaternion.setFromRotationMatrix(chooseRotation([size.x, size.y, size.z], a.z, a));
    // flip: 자동으로 고른 방향을 월드 축으로 180° 더 돌린다 (예: 부리 갈고리를 아래로)
    if (a.flip) holder.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axisVec('xyz'.indexOf(a.flip)), Math.PI));
    holder.position.set(...a.c);
  }
  return holder;
}

export async function buildEagle(loadPart, onProgress) {
  const mods = await loadModules(ASSEMBLY, loadPart, onProgress);

  const root = new THREE.Group();
  const groups = {};      // 도면 번호별 그룹 (분해 보기 · 숨기기)
  const wing = { l: new THREE.Group(), r: new THREE.Group() };   // 날갯짓: 서보 축 (±62, 124.8) 기준
  const head = new THREE.Group();                                // 머리 돌리기: 목 서보 축 (0, ·, −49) 기준
  wing.r.position.set(62, 124.8, 0); wing.l.position.set(-62, 124.8, 0);
  head.position.set(0, 0, -49);
  const pickables = [];

  for (const a of ASSEMBLY) {
    const holder = makeHolder(a, mods);
    // 어느 그룹에 넣을지
    let parent;
    if (a.s === '05' && Math.abs(a.c[0]) > 46 && a.id !== 'servo-digital' && a.id !== 'motor-frame-3x3') {
      parent = a.c[0] > 0 ? wing.r : wing.l;
      holder.position.sub(parent.position);
    } else if (a.s === '04') {
      parent = head;
      holder.position.sub(head.position);
    } else {
      parent = groups[a.s] ??= new THREE.Group();
    }
    parent.add(holder);
    pickables.push(holder);
  }
  groups['05'] ??= new THREE.Group();
  groups['05'].add(wing.l, wing.r);
  groups['04'] = new THREE.Group();
  groups['04'].add(head);
  for (const g of Object.values(groups)) root.add(g);
  // 받침 발 바닥(y −11.6)이 바닥(0)에 닿게
  root.position.y = 11.6;
  return { root, groups, wing, head, pickables, count: ASSEMBLY.length };
}

// 분해 보기: 도면 그룹마다 밀어낼 방향 (mm, 분해 1일 때)
export const EXPLODE = {
  '01': [0, -60, 0], '02': [0, -30, 0], '03': [0, 0, 0], '04': [0, 70, -30], '05': [0, 30, 0], '06': [0, 0, 90],
};
export const WING_SPREAD = 160; // 날개는 좌우로 따로 벌린다
