import { createLedBoardFunction } from '../../../kit/ledBoardS.js';

// 기능: 신호로 LED를 켜고 끈다. 밝기는 PWM, 모드는 켜기 / 깜빡임 / 숨쉬기.
export function create(model, ui) {
  return createLedBoardFunction(model, ui);
}
