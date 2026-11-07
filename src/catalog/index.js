// 부품 목록 (7호 키트 기준). 새 부품은 parts/<id>/ 폴더(spec.js, model.js, function.js)를 만들고 여기에 한 줄 추가한다.
import buzzerBoardS from './parts/buzzer-board-s/spec.js';
import ledBoardRedS from './parts/led-board-red-s/spec.js';
import ledBoardGreenS from './parts/led-board-green-s/spec.js';
import ledBoardOrangeS from './parts/led-board-orange-s/spec.js';
import cpuBoard8m from './parts/cpu-board-8m/spec.js';
import dcMotor130Rs from './parts/dc-motor-130-rs/spec.js';
import dcMotor130Dual from './parts/dc-motor-130-dual/spec.js';
import dcMotor400Rs from './parts/dc-motor-400-rs/spec.js';
import motorDriveA3 from './parts/motor-drive-a3/spec.js';
import motorDriveLinkS from './parts/motor-drive-link-s/spec.js';
import rgbLedBright from './parts/rgb-led-bright/spec.js';
import sensorSound from './parts/sensor-sound/spec.js';
import sensorIrTr from './parts/sensor-ir-tr/spec.js';
import sensorTouch from './parts/sensor-touch/spec.js';

// 7호 키트 부품목록(CHECKLIST.md)에 있는 부품만 넣는다
export const catalog = [
  cpuBoard8m, motorDriveA3, motorDriveLinkS, buzzerBoardS, ledBoardRedS, ledBoardGreenS, ledBoardOrangeS, rgbLedBright,
  sensorTouch, sensorIrTr, sensorSound,
  dcMotor130Rs, dcMotor130Dual, dcMotor400Rs,
];

export const categories = [['board', '보드'], ['sensor', '센서'], ['motor', '모터']];

// 부품의 3D 모양과 기능은 선택할 때 불러온다
export async function loadPart(id) {
  const [model, fn] = await Promise.all([
    import(`./parts/${id}/model.js`),
    import(`./parts/${id}/function.js`),
  ]);
  return { build: model.build, createFunction: fn.create };
}
