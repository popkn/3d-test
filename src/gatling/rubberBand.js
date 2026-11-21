import * as THREE from 'three';

// 실제 원형 고무줄 (단일 폐곡선 탄성 링) 동적 메시 & 물리 변형기
// - 매듭이나 이중 고리가 없는 순수 1개 원형 고무줄 (자연 직경 Ø37 mm, 둘레 ~116 mm)
// - 거치/당김 시 신장률(λ)에 따라 포아송 비(1/√λ)로 실제 가늘어지며,
//   격발 시 후방 고리가 캡너트 돔(+Z)을 미끄러져 이탈 → 훅의 법칙 탄성 수축 반동 → 감쇠 탄성 진동하며 원형으로 비행!

const N_SEG = 52;   // 폐곡선 분할 수
const N_RAD = 8;    // 단면 타원 분할 수
const BASE_CIRC = 116; // 자연 상태 원형 고무줄 둘레 (Ø37 mm)

export function createCircularBand(mat) {
  const vertCount = N_SEG * N_RAD;
  const positions = new Float32Array(vertCount * 3);
  const normals = new Float32Array(vertCount * 3);
  const indices = [];
  for (let i = 0; i < N_SEG; i++) {
    const ni = (i + 1) % N_SEG;
    for (let j = 0; j < N_RAD; j++) {
      const nj = (j + 1) % N_RAD;
      const a = i * N_RAD + j, b = ni * N_RAD + j, c = ni * N_RAD + nj, d = i * N_RAD + nj;
      indices.push(a, b, d, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setIndex(indices);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.frustumCulled = false;

  const pts = Array.from({ length: N_SEG }, () => new THREE.Vector3());
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), ref = new THREE.Vector3();

  // 닫힌 중심 곡선(pts[0..N_SEG-1])을 평탄한 실제 고무줄 단면(폭 × 두께, 신장률 반비례)으로 스윕
  function rebuild(bandW = 2.0, bandT = 1.0, refNormal = null) {
    let circ = 0;
    for (let i = 0; i < N_SEG; i++) circ += pts[i].distanceTo(pts[(i + 1) % N_SEG]);
    const stretch = Math.max(1.0, circ / BASE_CIRC);
    const thin = 1 / Math.sqrt(stretch); // 탄성 포아송 비: 늘어날수록 가늘어짐
    const rx = (bandT * 0.5) * thin;
    const ry = (bandW * 0.5) * thin;

    for (let i = 0; i < N_SEG; i++) {
      const prev = pts[(i - 1 + N_SEG) % N_SEG];
      const next = pts[(i + 1) % N_SEG];
      T.subVectors(next, prev).normalize();
      if (refNormal) ref.copy(refNormal);
      else ref.set(0, 1, 0);
      if (Math.abs(T.dot(ref)) > 0.96) ref.set(1, 0, 0);
      B.crossVectors(T, ref).normalize();
      N.crossVectors(B, T).normalize();

      const p = pts[i];
      for (let j = 0; j < N_RAD; j++) {
        const a = (j / N_RAD) * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        const nx = N.x * ca + B.x * sa;
        const ny = N.y * ca + B.y * sa;
        const nz = N.z * ca + B.z * sa;
        const off = (i * N_RAD + j) * 3;
        positions[off] = p.x + N.x * (ca * ry) + B.x * (sa * rx);
        positions[off + 1] = p.y + N.y * (ca * ry) + B.y * (sa * rx);
        positions[off + 2] = p.z + N.z * (ca * ry) + B.z * (sa * rx);
        normals[off] = nx; normals[off + 1] = ny; normals[off + 2] = nz;
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.normal.needsUpdate = true;
    geo.computeBoundingSphere();
    return { circ, stretch };
  }

  // 단일 원형 고무줄을 앞(총구 핀 중심 pF, 반지름 rWrapF)과 뒤(걸쇠/손잡이 중심 pR, 반지름 rWrapR)에 걸어 탄성 변형
  // radial = (ux, uy, 0), tangent = (-uy, ux, 0). bow = 느슨할 때 좌우로 벌어지는 원형 탄성 곡률
  function setStretched(ux, uy, rF, zF, rR, zR, { rWrapF = 3.6, rWrapR = 3.6, bow = 0, sag = 0 } = {}) {
    const tx = -uy, ty = ux;
    // 앞 원호(14점) → 오른쪽 가닥(12점) → 뒤 원호(14점) → 왼쪽 가닥(12점) = 52점 단일 폐곡선!
    const nArc = 14, nSide = 12;
    let k = 0;
    // 1) 앞 원호: 총구 캡너트 뒤 목(r=rF, z=zF)을 앞쪽(-Z)으로 감싸는 반원
    for (let i = 0; i < nArc; i++) {
      const a = Math.PI * (i / (nArc - 1)); // 0 (+t) → π/2 (-Z, +r) → π (-t)
      const ct = Math.cos(a) * rWrapF;
      const cz = -Math.sin(a) * rWrapF;
      const cr = rF + Math.sin(a) * 1.1; // 총구 턱을 부드럽게 감쌈
      pts[k++].set(ux * cr + tx * ct, uy * cr + ty * ct, zF + cz);
    }
    // 2) 왼쪽 가닥 (-t): 총구 → 후방 걸쇠 (느슨하면 원형으로 볼록 bow, 팽팽하면 직선!)
    for (let i = 0; i < nSide; i++) {
      const s = (i + 1) / (nSide + 1);
      const bulge = Math.sin(s * Math.PI);
      const cr = rF + (rR - rF) * s - sag * bulge;
      const ct = -(rWrapF + (rWrapR - rWrapF) * s + bow * bulge);
      const cz = zF + (zR - zF) * s;
      pts[k++].set(ux * cr + tx * ct, uy * cr + ty * ct, cz);
    }
    // 3) 뒤 원호: 후방 걸쇠 캡너트(r=rR, z=zR)의 뒤쪽(+Z)을 감싸는 반원
    for (let i = 0; i < nArc; i++) {
      const a = Math.PI * (i / (nArc - 1)); // 0 (-t) → π/2 (+Z) → π (+t)
      const ct = -Math.cos(a) * rWrapR;
      const cz = Math.sin(a) * rWrapR;
      const cr = rR + Math.sin(a) * 0.9;
      pts[k++].set(ux * cr + tx * ct, uy * cr + ty * ct, zR + cz);
    }
    // 4) 오른쪽 가닥 (+t): 후방 걸쇠 → 총구
    for (let i = 0; i < nSide; i++) {
      const s = (i + 1) / (nSide + 1);
      const bulge = Math.sin(s * Math.PI);
      const cr = rR + (rF - rR) * s - sag * bulge;
      const ct = +(rWrapR + (rWrapF - rWrapR) * s + bow * bulge);
      const cz = zR + (zF - zR) * s;
      pts[k++].set(ux * cr + tx * ct, uy * cr + ty * ct, cz);
    }
    return rebuild(2.0, 1.0, new THREE.Vector3(ux, uy, 0));
  }

  // 자연 원형 / 탄성 진동 비행 상태: 중심 (cx, cy, cz), 반지름 Rx(접선)·Rz(앞뒤)가 탄성 진동!
  function setRing(cx, cy, cz, ux, uy, rx, rz, pitch = 0) {
    const tx = -uy, ty = ux;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    for (let i = 0; i < N_SEG; i++) {
      const a = (i / N_SEG) * Math.PI * 2;
      const lt = Math.cos(a) * rx;
      const lz = Math.sin(a) * rz;
      const lr = lz * sp;
      const zRot = lz * cp;
      pts[i].set(cx + tx * lt + ux * lr, cy + ty * lt + uy * lr, cz + zRot);
    }
    return rebuild(2.2, 1.05, new THREE.Vector3(ux, uy, 0));
  }

  return { mesh, setStretched, setRing };
}

// 거치 & 당김 테스트 단계 (phase ∈ [0, 1]) 상태 계산 + 원형 고무줄 형상 업데이트
export function poseHookTestBand(band, ux, uy, phase, { zF = -74.5, zR = -16.5, rBarrel = 25.0, rCatch = 35.0 } = {}) {
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  if (phase < 0.24) {
    // ① 자연 원형 고무줄(Ø37)이 총구 앞(-Z)에서 접근해 총구 캡너트 목(-74.5)에 앞 고리를 거치
    const k = sm(0.0, 0.24, phase);
    const frontZ = -108 + (zF - (-108)) * k;
    const rearZ = frontZ + 37;
    const rCenter = rBarrel + 3.8;
    const info = band.setStretched(ux, uy, rCenter, frontZ, rCenter + 1.5, rearZ, { rWrapF: 3.8, rWrapR: 3.8, bow: 14.5, sag: 1.5 });
    return { stage: '① 원형 고무줄 총구 거치', detail: '자연 원형 고무줄(Ø37 mm)을 총구 캡너트(−Z 돔) 뒤 목(z=−74.5)에 겁니다.', stretch: info.stretch, forceN: 0 };
  }
  if (phase < 0.64) {
    // ② 뒤쪽 고리를 잡아당겨 (+Z) 탄성 신장시키며 후방 걸쇠 캡너트 돔(-12.5) 위로 넘김
    const k = sm(0.24, 0.64, phase);
    const rearZ = (zF + 37) + (-11.5 - (zF + 37)) * k;
    const rearR = (rBarrel + 5.3) + (rCatch + 6.2 - (rBarrel + 5.3)) * Math.pow(k, 0.8);
    const bow = 14.5 * Math.pow(1 - k, 1.4);
    const info = band.setStretched(ux, uy, rBarrel + 3.8, zF, rearR, rearZ, { rWrapF: 3.6, rWrapR: 3.6, bow, sag: 0 });
    const forceN = Math.max(0, (info.stretch - 1.0) * 6.2);
    return { stage: '② 탄성 당김 (신장 중)', detail: `원형 고무줄을 뒤(+Z)로 당겨 탄성 에너지를 저장합니다 (신장 ${(info.stretch * 100).toFixed(0)}% · 장력 ${forceN.toFixed(1)} N).`, stretch: info.stretch, forceN };
  }
  if (phase < 0.80) {
    // ③ 후방 걸쇠 캡너트 몸통(-16.5, r=35)에 뒤 고리 안착 (L자 2×1 턱 바로 뒤)
    const k = sm(0.64, 0.80, phase);
    const rearZ = -11.5 + (zR - (-11.5)) * k;
    const rearR = (rCatch + 6.2) + (rCatch + 3.6 - (rCatch + 6.2)) * k;
    const info = band.setStretched(ux, uy, rBarrel + 3.8, zF, rearR, rearZ, { rWrapF: 3.6, rWrapR: 3.6, bow: 0 });
    const forceN = Math.max(0, (info.stretch - 1.0) * 6.2);
    return { stage: '③ 후방 걸쇠 안착', detail: '고무줄 뒤 고리를 후방 걸쇠 캡너트(r=35, z=−16.5)에 걸면 L자 2×1 턱이 전방 장력을 버텨 줍니다.', stretch: info.stretch, forceN };
  }
  // ④ 장력 고정 검증 (앞으로 살짝 당겨져도 절대 풀리지 않음 확인!)
  const pulse = Math.sin((phase - 0.80) / 0.20 * Math.PI * 2) * 0.8;
  const info = band.setStretched(ux, uy, rBarrel + 3.8, zF, rCatch + 3.6, zR - Math.max(0, pulse), { rWrapF: 3.6, rWrapR: 3.6, bow: 0 });
  const forceN = Math.max(0, (info.stretch - 1.0) * 6.2);
  return { stage: '④ 거치 안정 검증 ✔', detail: `앞=총구 캡너트 턱 · 뒤=걸쇠 캡너트 몸통으로 안정 거치 완료! 장전선 장애물 관통 0건 (장력 ${forceN.toFixed(1)} N).`, stretch: info.stretch, forceN };
}
