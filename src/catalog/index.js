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
import sensorColor from './parts/sensor-color/spec.js';
import servoDigital from './parts/servo-digital/spec.js';
import wheelSet130 from './parts/wheel-set-130/spec.js';
import hinge3x3 from './parts/hinge-3x3/spec.js';
import grab from './parts/grab/spec.js';
import nutM3 from './parts/nut-m3/spec.js';
import capNutM3 from './parts/cap-nut-m3/spec.js';
import sNutBlue from './parts/s-nut-blue/spec.js';
import nutFrame4 from './parts/nut-frame-4/spec.js';
import irRemoteTx from './parts/ir-remote-tx/spec.js';
import irRemoteRx from './parts/ir-remote-rx/spec.js';
import melodyBoard from './parts/melody-board/spec.js';
import btWirelessBoard2 from './parts/bt-wireless-board2/spec.js';
import motorGuide from './parts/motor-guide/spec.js';
import wheelAxle from './parts/wheel-axle/spec.js';
import batteryCase4aa from './parts/battery-case-4aa/spec.js';
import boltM26x10 from './parts/bolt-m26x10/spec.js';
import boltM3x6 from './parts/bolt-m3x6/spec.js';
import boltM3x10 from './parts/bolt-m3x10/spec.js';
import supportSpacer from './parts/support-spacer/spec.js';
import spongeBall from './parts/sponge-ball/spec.js';
import inner80Buggy from './parts/inner-80-buggy/spec.js';
import inner130Giant from './parts/inner-130-giant/spec.js';
import shaft75 from './parts/shaft-75/spec.js';
import axleGuide from './parts/axle-guide/spec.js';
import caterpillarLink from './parts/caterpillar-link/spec.js';
import caterpillarSprocket from './parts/caterpillar-sprocket/spec.js';
import caterpillarWheelGuide from './parts/caterpillar-wheel-guide/spec.js';
import caterpillarRubber from './parts/caterpillar-rubber/spec.js';
import colorBall from './parts/color-ball/spec.js';
import cable3pin from './parts/cable-3pin/spec.js';
import tire50 from './parts/tire-50/spec.js';

// 7호 키트 부품목록(CHECKLIST.md)에 있는 부품만 넣는다
export const catalog = [
  cpuBoard8m, motorDriveA3, motorDriveLinkS, buzzerBoardS, ledBoardRedS, ledBoardGreenS, ledBoardOrangeS, rgbLedBright, irRemoteTx, irRemoteRx, melodyBoard, btWirelessBoard2,
  sensorTouch, sensorIrTr, sensorSound, sensorColor,
  dcMotor130Rs, dcMotor130Dual, dcMotor400Rs, servoDigital,
  wheelSet130, wheelAxle, inner80Buggy, inner130Giant, shaft75, axleGuide, tire50,
  caterpillarLink, caterpillarSprocket, caterpillarWheelGuide, caterpillarRubber,
  batteryCase4aa,
  hinge3x3, grab, nutM3, capNutM3, sNutBlue, nutFrame4, motorGuide, boltM26x10, boltM3x6, boltM3x10, supportSpacer, spongeBall, colorBall, cable3pin,
];

export const categories = [['board', '보드'], ['sensor', '센서'], ['motor', '모터'], ['wheel', '바퀴'], ['power', '전원'], ['hardware', '조립 부품']];

// 부품의 3D 모양과 기능은 선택할 때 불러온다
export async function loadPart(id) {
  const [model, fn] = await Promise.all([
    import(`./parts/${id}/model.js`),
    import(`./parts/${id}/function.js`),
  ]);
  return { build: model.build, createFunction: fn.create };
}
