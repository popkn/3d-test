import { createMotorFunction } from '../../../kit/motorSim.js';
import spec from './spec.js';

// 기능: 전압에 비례한 속도로 축이 회전한다 (정격 6V → 400 rpm). 바퀴를 달아 확인할 수 있다.
export function create(model, ui) {
  return createMotorFunction(model, ui, spec.motor);
}
