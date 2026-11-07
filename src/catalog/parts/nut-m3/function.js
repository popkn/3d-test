import { createFastenFunction } from '../../../kit/fastenSim.js';

export function create(model, ui) {
  return createFastenFunction(model, ui, { nutHeight: 2.4 });
}
