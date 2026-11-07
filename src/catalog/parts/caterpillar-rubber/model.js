import * as THREE from 'three';
import { makeRubber, makeLink } from '../../../kit/caterpillar.js';

export function build() {
  const root = new THREE.Group();
  const pad = makeRubber(0);
  root.add(pad);
  const link = makeLink(false);
  link.position.y = -6;
  link.userData.noBounds = true;
  link.visible = false;
  root.add(link);
  return {
    object3d: root,
    labels: [{ name: 'RUBBER PAD', sub: '실리콘 · 미끄럼 방지', object: pad, anchor: [0, 1.25, 0], off: [60, -60] }],
    frameWith: [link],
    handles: { pad, link },
  };
}
