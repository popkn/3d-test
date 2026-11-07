import { createFastenFunction } from '../../../kit/fastenSim.js';

// 캡너트는 막힌 구멍이라 볼트가 끝까지 들어가면 멈춘다 (깊이 약 4mm, 추정)
export function create(model, ui) {
  return createFastenFunction(model, ui, { nutHeight: 6, maxDepth: 4.2 });
}
