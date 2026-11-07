import * as THREE from 'three';
import { materials } from '../../../materials/index.js';
import { createRootActuator, ROOT_LENGTH } from './rootActuator.js';
import { segmentTemplate } from './segment.js';
import { linkTemplate } from './link.js';
import { tipTemplate } from './tip.js';
import { computeArmAngles } from '../../rig/index.js';

// 팔 하나 조립: 뿌리 구동부 → 마디 N개 → 끝 마디.
// 팔은 물체의 +Z 방향으로 뻗고, 바퀴는 -Y(배쪽)에 있다.
//
// 관절: 마디마다 빈 Group(joint)이 있고, 다음 관절은 앞 관절의 자식이라 회전이 끝까지 이어진다.
// 그리기: 마디 수백 개를 따로 그리면 느리므로, 같은 종류 마디는 InstancedMesh 하나로 묶어 그리고
//         매 프레임 관절 위치를 계산해 각 마디 자리에 옮겨 놓는다.
export class Arm {
  constructor(config, { name = 'arm', phase = 0 } = {}) {
    const C = config;
    this.name = name;
    this.phase = phase;
    this.config = C;
    this.pose = { ...C.defaultPose };

    this.object3d = new THREE.Group();
    this.object3d.name = `arm${name}`;
    this.object3d.add(createRootActuator({ radius: C.rootRadius }));

    // 관절 뼈대 (보이지 않는 Group)
    this.joints = [];
    this.radii = [];
    this.kinds = [];
    let parent = this.object3d;
    for (let i = 0; i <= C.segments; i++) {
      const isTip = i === C.segments;
      const joint = new THREE.Group();
      joint.name = isTip ? `${name}.tip` : `${name}.seg${i}`;
      parent.add(joint);
      this.joints.push(joint);
      this.radii.push(C.rootRadius * C.taper ** (i + 1));
      this.kinds.push(isTip ? 'tip' : C.glassSegments.includes(i) ? 'glass' : 'shell');
      parent = joint;
    }
    this.joints[0].position.z = ROOT_LENGTH * C.rootRadius;

    // 종류별 InstancedMesh: { kind: { indices: [관절 번호], meshes: [...] } }
    const templates = {
      shell: segmentTemplate('shell', C.segmentLength),
      glass: segmentTemplate('glass', C.segmentLength),
      tip: tipTemplate(),
      link: linkTemplate(),
    };
    this.batches = {};
    for (const kind of ['shell', 'glass', 'tip', 'link']) {
      const indices = kind === 'link'
        ? this.joints.map((_, i) => i)
        : this.kinds.flatMap((k, i) => (k === kind ? [i] : []));
      if (!indices.length) continue;
      const meshes = Object.entries(templates[kind]).map(([matKey, geo]) => {
        const m = new THREE.InstancedMesh(geo, materials[matKey], indices.length);
        m.name = `${name}.${kind}.${matKey}`;
        // 팔은 수가 많으므로 흰 껍데기와 바퀴 고무만 그림자를 만든다
        m.castShadow = matKey === 'shell' || matKey === 'rubber';
        m.receiveShadow = matKey === 'shell';
        m.frustumCulled = false; // 팔이 움직이면 경계 상자가 계속 바뀌므로 잘라내기를 끈다
        if (matKey === 'glass') m.renderOrder = 2;
        this.object3d.add(m);
        return m;
      });
      this.batches[kind] = { indices, meshes };
    }

    this._jointMatrices = this.joints.map(() => new THREE.Matrix4());
    this.applySpread(0);
    this.update(0);
  }

  // 마디 분리 정도: 0 = 붙음, 1 = 연결부가 늘어나 마디가 벌어짐
  applySpread(spread) {
    const C = this.config;
    this.gaps = this.radii.map((r) => C.linkGap * r * (1 + spread * C.spreadGap));
    for (let i = 1; i < this.joints.length; i++) {
      this.joints[i].position.z = this.gaps[i - 1] + C.segmentLength * this.radii[i - 1];
    }
  }

  setPose(partial) {
    Object.assign(this.pose, partial);
    if ('spread' in partial) this.applySpread(this.pose.spread);
  }

  update(t) {
    const { pitch, yaw } = computeArmAngles(this.pose, this.joints.length, t, this.phase);
    for (let i = 0; i < this.joints.length; i++) this.joints[i].rotation.set(pitch[i], yaw[i], 0);
    this.writeInstances();
  }

  // 관절 위치(팔 기준 좌표)를 계산해서 각 마디 InstancedMesh에 기록한다
  writeInstances() {
    const J = this._jointMatrices;
    for (let i = 0; i < this.joints.length; i++) {
      const joint = this.joints[i];
      joint.updateMatrix();
      if (i === 0) J[i].copy(joint.matrix);
      else J[i].multiplyMatrices(J[i - 1], joint.matrix);
    }
    const m = new THREE.Matrix4();
    const local = new THREE.Matrix4();
    for (const [kind, { indices, meshes }] of Object.entries(this.batches)) {
      indices.forEach((ji, slot) => {
        const r = this.radii[ji];
        if (kind === 'link') local.makeScale(r, r, this.gaps[ji]);
        else local.makeScale(r, r, r).setPosition(0, 0, this.gaps[ji]);
        m.multiplyMatrices(J[ji], local);
        for (const mesh of meshes) mesh.setMatrixAt(slot, m);
      });
      for (const mesh of meshes) mesh.instanceMatrix.needsUpdate = true;
    }
  }
}
