import { buildBolt } from '../../../kit/boltSim.js';

export function build() {
  return buildBolt({ length: 6, dia: 3, headDia: 6.3, washer: false, name: 'BOLT', sub: 'M3 × 6mm · SUS' });
}
