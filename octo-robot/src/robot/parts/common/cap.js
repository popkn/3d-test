import * as THREE from 'three';
import { materials } from '../../../materials/index.js';
import { cachedGeometry } from './geometryCache.js';
import { placeOnCircle } from './placement.js';
import { createBoltField } from './bolt.js';

// 관절 캡: 볼록한 흰 원판 + 빨간 테두리 링 + 가운데 금속 허브 + 둘레 볼트.
// 팔 뿌리, 마디 측면, 몸체 이음새를 덮는다. +Y 방향을 바라본다.

function domeGeometry() {
  return cachedGeometry('cap.dome', () => {
    // 옆에서 본 단면 윤곽을 돌려서 만든다 (반지름 1 기준)
    const profile = [
      [0.0, 0.34], [0.35, 0.33], [0.62, 0.29], [0.8, 0.22],
      [0.9, 0.14], [0.94, 0.06], [0.94, 0.0], [0.0, 0.0], // 마지막 점: 바닥면을 막는다
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(profile, 40);
  });
}

function ringGeometry() {
  return cachedGeometry('cap.ring', () => {
    const g = new THREE.TorusGeometry(0.97, 0.07, 10, 48);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0.05, 0);
    return g;
  });
}

function hubGeometry() {
  return cachedGeometry('cap.hub', () => {
    const g = new THREE.CylinderGeometry(0.22, 0.26, 0.12, 24);
    g.translate(0, 0.38, 0);
    return g;
  });
}

export function createCap({
  radius = 0.12,
  ring = true,
  hub = true,
  bolts = 6,
  shellMaterial = materials.shell,
  ringMaterial = materials.accent,
} = {}) {
  const group = new THREE.Group();
  group.name = 'cap';

  const body = new THREE.Group();
  body.scale.setScalar(radius);
  group.add(body);

  const dome = new THREE.Mesh(domeGeometry(), shellMaterial);
  dome.name = 'cap.dome';
  body.add(dome);

  if (ring) {
    const r = new THREE.Mesh(ringGeometry(), ringMaterial);
    r.name = 'cap.ring';
    body.add(r);
  }
  if (hub) {
    const h = new THREE.Mesh(hubGeometry(), materials.metalDark);
    h.name = 'cap.hub';
    body.add(h);
  }
  body.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });

  // 둘레 볼트 (실제 크기 단위로 배치)
  if (bolts > 0) {
    const placements = placeOnCircle({
      radius: radius * 0.66, count: bolts, y: radius * 0.285, facing: 'up',
    });
    group.add(createBoltField(placements, { size: radius * 0.12 }));
  }

  return group;
}
