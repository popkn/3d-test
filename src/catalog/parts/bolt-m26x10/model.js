import { buildBolt } from '../../../kit/boltSim.js';

export function build() {
  return buildBolt({ length: 10, dia: 2.6, headDia: 5, washer: true, name: 'BOLT', sub: 'M2.6 × 10mm · SUS' });
}
