import * as THREE from 'three';
import { M, mesh } from '../../../kit/materials.js';
import { femaleHeader } from '../../../kit/components.js';

// 양 끝 3핀 암 커넥터 + 세 가닥 선 (S 노랑 · + 빨강 · - 검정). 펼친 길이 약 200mm
const WIRES = [[0xf2c21b, 'S'], [0xc8231d, '+'], [0x1a1a1a, '-']];

export function build() {
  const root = new THREE.Group();
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-90, 4, 0), new THREE.Vector3(-55, 4, 18), new THREE.Vector3(-15, 4, 26),
    new THREE.Vector3(25, 4, 20), new THREE.Vector3(60, 4, 6), new THREE.Vector3(90, 4, 0),
  ]);
  const wires = WIRES.map(([c], i) => {
    const off = (i - 1) * 1.1;
    const pts = path.getPoints(60).map((p, k, arr) => {
      const t = arr[Math.min(k + 1, arr.length - 1)].clone().sub(arr[Math.max(k - 1, 0)]).normalize();
      return p.clone().add(new THREE.Vector3(-t.z, 0, t.x).multiplyScalar(off));
    });
    const tube = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.55, 8, false), new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }));
    root.add(tube);
    return tube;
  });
  const plugs = [-1, 1].map((s) => {
    const p = femaleHeader({ cols: 3, height: 14 });
    p.rotation.z = s * Math.PI / 2;
    p.position.set(s * 97, 4, 0);
    root.add(p);
    return p;
  });
  // 신호 표시 (선을 따라 움직이는 빛)
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 8), new THREE.MeshBasicMaterial({ color: 0xe8432a }));
  pulse.visible = false;
  pulse.userData.noBounds = true;
  root.add(pulse);
  return {
    object3d: root,
    labels: [
      { name: '3P PLUG', sub: 'S · + · - (2.54mm)', object: plugs[0], anchor: [0, 7, 0], off: [-110, -60] },
      { name: 'WIRES', sub: '노랑 S · 빨강 + · 검정 -', object: wires[0], anchor: [-15, 4, 26], off: [40, 60] },
    ],
    handles: { path, pulse },
  };
}
