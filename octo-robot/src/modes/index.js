import holding from './holding.js';
import jetting from './jetting.js';
import mantleOpen from './mantleOpen.js';
import opticsOpen from './opticsOpen.js';
import siphonOpen from './siphonOpen.js';
import beakOpen from './beakOpen.js';
import armApart from './armApart.js';
import teardown from './teardown.js';
import departing from './departing.js';

// 모드 목록 (버튼과 HUD에 이 순서로 나온다)
export const modeList = [holding, jetting, mantleOpen, opticsOpen, siphonOpen, beakOpen, armApart, teardown, departing];
export const modes = Object.fromEntries(modeList.map((m) => [m.id, m]));
export { ModeController } from './ModeController.js';
