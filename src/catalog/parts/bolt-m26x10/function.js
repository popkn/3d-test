import { createBoltFunction } from '../../../kit/boltSim.js';

// 기능: 돌릴 때마다 나사 간격만큼 들어간다.
export function create(model, ui) {
  return createBoltFunction(model, ui, { selfTapping: true });
}
