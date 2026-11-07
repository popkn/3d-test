import * as THREE from 'three';
import { sceneConfig } from './sceneConfig.js';

// 배경 장식선: 바닥의 원형 궤도선, 궤도 위 작은 표식, 뒤쪽 십자 격자
export function createBackdrop() {
  const { colors, backdrop: B } = sceneConfig;
  const group = new THREE.Group();
  group.name = 'backdrop';

  const lineMat = new THREE.LineBasicMaterial({ color: colors.line, transparent: true, opacity: 0.45 });
  const dashMat = new THREE.LineDashedMaterial({
    color: colors.line, transparent: true, opacity: 0.35, dashSize: 0.12, gapSize: 0.1,
  });

  // 원형 궤도선 (바깥 원은 점선)
  B.orbitRadii.forEach((r, i) => {
    const pts = [];
    for (let k = 0; k <= 128; k++) {
      const t = (k / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * r, 0.002, Math.sin(t) * r));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, i === B.orbitRadii.length - 1 ? dashMat : lineMat);
    if (line.material === dashMat) line.computeLineDistances();
    group.add(line);
  });

  // 궤도 위 작은 원형 표식
  const markerGeo = new THREE.RingGeometry(0.07, 0.09, 24);
  const markerMat = new THREE.MeshBasicMaterial({ color: colors.line, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
  [[B.orbitRadii[1], 0.6], [B.orbitRadii[1], 3.6], [B.orbitRadii[0], 2.2], [B.orbitRadii[2], 5.1]].forEach(([r, t]) => {
    const m = new THREE.Mesh(markerGeo, markerMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(Math.cos(t) * r, 0.003, Math.sin(t) * r);
    group.add(m);
  });

  // 뒤쪽 공중의 빨간 십자 격자
  const crossMat = new THREE.LineBasicMaterial({ color: colors.lineAccent, transparent: true, opacity: 0.55 });
  const s = 0.06;
  const pts = [];
  const width = (B.crossCols - 1) * B.crossSpacing;
  for (let row = 0; row < B.crossRows; row++) {
    for (let col = 0; col < B.crossCols; col++) {
      const x = col * B.crossSpacing - width / 2;
      const y = B.crossHeight - row * B.crossSpacing * 0.8;
      pts.push(x - s, y, 0, x + s, y, 0, x, y - s, 0, x, y + s, 0);
    }
  }
  const crossGeo = new THREE.BufferGeometry();
  crossGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const crosses = new THREE.LineSegments(crossGeo, crossMat);
  crosses.position.z = B.crossDepth;
  group.add(crosses);

  return group;
}
