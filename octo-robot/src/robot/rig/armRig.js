import * as THREE from 'three';

// 팔 리그: 몇 개의 숫자(자세)로 모든 관절 각도를 계산한다.
//   pitch: 관절의 X축 회전. + 는 배쪽(바퀴 쪽, -Y)으로 말리고, - 는 등쪽으로 젖혀진다.
//   yaw:   관절의 Y축 회전. 옆으로 휜다.
// 마디가 끝으로 갈수록 짧아지므로 끝쪽 각도를 키우면 자연스럽게 나선이 된다.
export function computeArmAngles(pose, count, t, phase = 0) {
  const { curl = 0, spiral = 0, lift = 0, side = 0, wave = 0, waveSpeed = 1.4 } = pose;
  const pitch = new Array(count);
  const yaw = new Array(count);
  for (let i = 0; i < count; i++) {
    const u = i / (count - 1); // 0 = 뿌리, 1 = 끝

    // 전체 말림: 고르게 굽는다
    let p = curl * 0.16;
    // 끝 나선: 끝쪽에서 급격히 감긴다 (+ 배쪽, - 등쪽)
    p += spiral * 1.4 * THREE.MathUtils.smoothstep(u, 0.25, 0.9);
    // 뿌리 들어올림: 처음 몇 마디만
    p -= lift * 0.55 * Math.max(0, 1 - i / 3);
    // 흔들림: 뿌리에서 끝으로 파도가 지나간다 (끝으로 갈수록 크게)
    p += wave * 0.09 * (0.35 + u) * Math.sin(t * waveSpeed * 2 - i * 0.45 + phase);

    let y = side * 0.07;
    y += wave * 0.05 * (0.3 + u) * Math.sin(t * waveSpeed * 1.3 - i * 0.35 + phase * 1.7);

    pitch[i] = p;
    yaw[i] = y;
  }
  return { pitch, yaw };
}
