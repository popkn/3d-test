import * as THREE from 'three';
import { makeLink, trackPath, LINK } from '../../../kit/caterpillar.js';

// 진행 방향 = X, 폭 = Z. 톱니 휠 두 개(축 간격 dist)에 감긴 모양, 바닥 = 0
export function build() {
  const root = new THREE.Group();
  const loop = new THREE.Group();
  root.add(loop);
  const R = 30 + LINK.thick;
  let links = [], dist = 100;
  const place = (u = 0) => {
    links.forEach((l, i) => { const p = trackPath(u + i / links.length, dist, R); l.position.set(p.x, p.y, 0); l.rotation.z = p.a; });
  };
  function setDistance(d) {
    dist = d;
    links.forEach((l) => loop.remove(l));
    const count = Math.round((2 * d + 2 * Math.PI * R) / LINK.pitch);
    links = Array.from({ length: count }, () => { const l = makeLink(true); loop.add(l); return l; });
    loop.position.y = R + LINK.thick;
    place();
    handles.count = count;
  }
  const handles = { loop, setDistance, place, get dist() { return dist; }, R, count: 0 };
  setDistance(100);
  return {
    object3d: root,
    labels: [{ name: 'TRACK', sub: '마디 + 러버 고리 (축 간격 100)', object: loop, anchor: [0, 2 * R + 3, 0], off: [60, -60] }],
    handles,
  };
}
