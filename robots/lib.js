import * as THREE from 'three';
import { partBounds } from '../src/viewer/scene.js';

// 완성 로봇 파일 공통 (앱 조립 재생기와 약속한 모양: makeAdapter(ctx) → 어댑터)
// ctx = { view, st, onProgress } — 앱 화면 쪽 카메라 · 재생 상태
export const V3 = THREE.Vector3;
export const rad = (d) => THREE.MathUtils.degToRad(d);
export const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
export const DRIVE5 = [['back', '후진'], ['left', '왼쪽'], ['stop', '정지'], ['right', '오른쪽'], ['fwd', '전진']];
export { partBounds };

export function groupAdapter(root, groups, keys, names, explode, extra, frameOpts, count) {
  root.updateMatrixWorld(true);
  const full = partBounds(root);
  const H = full.getSize(new V3()).y;
  const centers = keys.map((k) => partBounds(groups[k]).getCenter(new V3()));
  const hidden = {};
  let ex = 0;
  return {
    root, N: keys.length, rate: 1, hasBolts: false, frameOpts, full, count,
    mods: keys.map((k) => ({ no: k, name: names[k], short: names[k].split(" (")[0] })),
    pose(T) {
      keys.forEach((k, i) => {
        const g = groups[k], t = T - i, d = explode[k] || [0, 0, 0];
        const drop = (1 - ease(t / 0.85)) * H * 0.55;
        g.visible = t > 0 && !hidden[i];
        g.position.set(d[0] * ex, d[1] * ex + drop, d[2] * ex);
      });
      if (extra) extra(ex);
    },
    setExplode(x) {
      ex = x;
    },
    setHidden(i, v) {
      hidden[i] = v;
    },
    stepName: (s) => `${keys[s - 1]} ${names[keys[s - 1]]}`,
    stepShort: (s) => `${keys[s - 1]} ${names[keys[s - 1]].split(" (")[0]} 결합`,
    modOfStep: (s) => s - 1,
    focus(s) {
      const k = keys[s - 1], d = explode[k] || [0, 0, 0];
      return centers[s - 1].clone().add(new V3(d[0] * ex, d[1] * ex, d[2] * ex));
    }
  };
}
