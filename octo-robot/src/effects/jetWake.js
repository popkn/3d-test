import * as THREE from 'three';

// 물살 흔적: 분사할 때 사이펀 노즐에서 거품 입자가 뿜어져 나와 뒤로 흩어지며 사라진다.
// strength(0~1)로 세기를 정하고, enabled로 켜고 끈다 (HUD 표시 옵션).
export class JetWake {
  constructor({ max = 500 } = {}) {
    this.max = max;
    this.enabled = true;
    this.strength = 0;

    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.vel = new Float32Array(max * 3);
    this.age = new Float32Array(max).fill(Infinity);
    this.life = new Float32Array(max);
    this.size = new Float32Array(max);
    this.next = 0;
    this.spawnAcc = 0;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.PointsMaterial({
      size: 0.09, map: bubbleTexture(), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true,
    });
    this.object3d = new THREE.Points(geo, mat);
    this.object3d.name = 'jetWake';
    this.object3d.frustumCulled = false;

    this._origin = new THREE.Vector3();
    this._dir = new THREE.Vector3();
    this._q = new THREE.Quaternion();
  }

  // emitter: 노즐 물체 (+Y가 분사 방향인 사이펀 안쪽 좌표), axisObject: 사이펀 (+Z가 분사 방향)
  update(dt, nozzle, axisObject) {
    const rate = this.enabled ? this.strength * 260 : 0;
    if (rate > 0) {
      nozzle.getWorldPosition(this._origin);
      axisObject.getWorldQuaternion(this._q);
      this._dir.set(0, 0, 1).applyQuaternion(this._q);
      this.spawnAcc += rate * dt;
      while (this.spawnAcc >= 1) {
        this.spawnAcc -= 1;
        this.spawn();
      }
    }

    for (let i = 0; i < this.max; i++) {
      const a = (this.age[i] += dt);
      const i3 = i * 3;
      const i4 = i * 4;
      if (a >= this.life[i]) { this.col[i4 + 3] = 0; continue; }
      // 물의 저항으로 느려지고 살짝 떠오른다
      const drag = Math.exp(-dt * 2.2);
      this.vel[i3] *= drag; this.vel[i3 + 1] = this.vel[i3 + 1] * drag + dt * 0.25; this.vel[i3 + 2] *= drag;
      this.pos[i3] += this.vel[i3] * dt;
      this.pos[i3 + 1] += this.vel[i3 + 1] * dt;
      this.pos[i3 + 2] += this.vel[i3 + 2] * dt;
      const u = a / this.life[i];
      this.col[i4 + 3] = (1 - u) * Math.min(1, a * 8) * 0.75;
    }
    const g = this.object3d.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.color.needsUpdate = true;
  }

  spawn() {
    const i = this.next;
    this.next = (this.next + 1) % this.max;
    const i3 = i * 3;
    const i4 = i * 4;
    const spread = 0.35;
    const speed = 2.2 + Math.random() * 1.8;
    this.pos[i3] = this._origin.x + (Math.random() - 0.5) * 0.08;
    this.pos[i3 + 1] = this._origin.y + (Math.random() - 0.5) * 0.08;
    this.pos[i3 + 2] = this._origin.z + (Math.random() - 0.5) * 0.08;
    this.vel[i3] = (this._dir.x + (Math.random() - 0.5) * spread) * speed;
    this.vel[i3 + 1] = (this._dir.y + (Math.random() - 0.5) * spread) * speed;
    this.vel[i3 + 2] = (this._dir.z + (Math.random() - 0.5) * spread) * speed;
    const shade = 0.82 + Math.random() * 0.15;
    this.col[i4] = shade; this.col[i4 + 1] = shade + 0.02; this.col[i4 + 2] = Math.min(1, shade + 0.06);
    this.age[i] = 0;
    this.life[i] = 0.9 + Math.random() * 1.1;
  }
}

// 동그란 거품 모양 (테두리가 진하고 가운데가 옅은 원)
function bubbleTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,0.25)');
  grad.addColorStop(0.7, 'rgba(200,210,220,0.55)');
  grad.addColorStop(0.9, 'rgba(120,130,140,0.9)');
  grad.addColorStop(1, 'rgba(120,130,140,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(32, 32, 30, 0, Math.PI * 2);
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
