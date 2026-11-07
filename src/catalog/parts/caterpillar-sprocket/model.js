import * as THREE from 'three';
import { makeSprocket, makeLink, LINK } from '../../../kit/caterpillar.js';

export function build() {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 30;
  root.add(spin);
  const wheel = makeSprocket();
  spin.add(wheel);
  // 시연용: 위쪽에 걸린 마디 몇 개
  const links = [];
  for (let i = -3; i <= 3; i++) {
    const l = makeLink(false);
    const a = Math.PI / 2 + i * (LINK.pitch / (30 + LINK.thick));
    l.position.set(Math.cos(a) * (30 + LINK.thick), 30 + Math.sin(a) * (30 + LINK.thick), 0);
    l.rotation.z = a - Math.PI / 2;
    l.userData.noBounds = true;
    root.add(l);
    links.push(l);
  }
  return {
    object3d: root,
    labels: [{ name: 'SPROCKET', sub: 'Ø60 · 톱니 18개', object: wheel, anchor: [30, 0, 5], off: [60, -40] }],
    frameWith: links,
    handles: { spin, links },
  };
}
