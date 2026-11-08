import { buildBolt } from '../../../kit/boltSim.js';

export function build() {
  return buildBolt({ length: 10, dia: 3, headDia: 6.3, washer: false, name: 'BOLT', sub: 'M3 × 10mm · SUS' });
}
