import * as THREE from 'three';
import { makeLink, makeSprocket, LINK } from '../../../kit/caterpillar.js';

export function build() {
  const root = new THREE.Group();
  const link = makeLink(false);
  link.position.y = 3;
  root.add(link);
  // 궤도 시연: 톱니 휠 2개 + 마디 고리 (크기 측정에서 뺀다)
  const demo = new THREE.Group();
  demo.userData.noBounds = true;
  demo.visible = false;
  root.add(demo);
  const DIST = 100, R = 30 + LINK.thick;
  const wheels = [-DIST / 2, DIST / 2].map((x) => { const s = makeSprocket(); s.position.set(x, 0, 0); demo.add(s); return s; });
  const per = 2 * DIST + 2 * Math.PI * R;
  const count = Math.round(per / LINK.pitch);
  const links = [];
  for (let i = 0; i < count; i++) { const l = makeLink(false); demo.add(l); links.push(l); }
  demo.position.y = R + 6;
  return {
    object3d: root,
    labels: [{ name: 'TRACK LINK', sub: 'ABS · 고리로 연결', object: link, anchor: [0, 3, 0], off: [60, -60] }],
    frameWith: [demo],
    handles: { link, demo, wheels, links, DIST, R, count },
  };
}
