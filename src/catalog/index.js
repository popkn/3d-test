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
import frameBigMain from './parts/frame-big-main/spec.js';
import lFrame6x6 from './parts/l-frame-6x6/spec.js';
import tire80Buggy from './parts/tire-80-buggy/spec.js';
import btModule from './parts/bt-module/spec.js';
import battleG from './parts/battle-g/spec.js';
import battleI from './parts/battle-i/spec.js';
import battleJ from './parts/battle-j/spec.js';
import frameHalfPcb from './parts/frame-half-pcb/spec.js';
import frameMainPcb from './parts/frame-main-pcb/spec.js';
import frameMainPlastic from './parts/frame-main-plastic/spec.js';
import battleS from './parts/battle-s/spec.js';
import battleT from './parts/battle-t/spec.js';
import battleU from './parts/battle-u/spec.js';
import battleV from './parts/battle-v/spec.js';
import motorFrame3x3 from './parts/motor-frame-3x3/spec.js';
import pcFrame45x60 from './parts/pc-frame-45x60/spec.js';
import frameS3Pcb from './parts/frame-s3-pcb/spec.js';
import frameS4Pcb from './parts/frame-s4-pcb/spec.js';
import frameS5Pcb from './parts/frame-s5-pcb/spec.js';
import frameS7Pcb from './parts/frame-s7-pcb/spec.js';
import frameS8Pcb from './parts/frame-s8-pcb/spec.js';
import frameS3Plastic from './parts/frame-s3-plastic/spec.js';
import frameS4Plastic from './parts/frame-s4-plastic/spec.js';
import frameS5Plastic from './parts/frame-s5-plastic/spec.js';
import frameMPcb from './parts/frame-m-pcb/spec.js';
import frameS8Plastic from './parts/frame-s8-plastic/spec.js';
import frameOptionPcb from './parts/frame-option-pcb/spec.js';
import frameOptionPlastic from './parts/frame-option-plastic/spec.js';
import frameM6Pcb from './parts/frame-m6-pcb/spec.js';
import frameMidPcb from './parts/frame-mid-pcb/spec.js';
import frameMidPlastic from './parts/frame-mid-plastic/spec.js';
import frame5x13Pcb from './parts/frame-5x13-pcb/spec.js';
import lFrame2x1 from './parts/l-frame-2x1/spec.js';
import lFrame2x2 from './parts/l-frame-2x2/spec.js';
import lFrame2x6 from './parts/l-frame-2x6/spec.js';
import lFrame1202x2 from './parts/l-frame-120-2x2/spec.js';

// 7호 키트 부품목록(CHECKLIST.md)에 있는 부품만 넣는다
export const catalog = [
  cpuBoard8m, motorDriveA3, motorDriveLinkS, buzzerBoardS, ledBoardRedS, ledBoardGreenS, ledBoardOrangeS, rgbLedBright, irRemoteTx, irRemoteRx, melodyBoard, btWirelessBoard2, btModule,
  sensorTouch, sensorIrTr, sensorSound, sensorColor,
  dcMotor130Rs, dcMotor130Dual, dcMotor400Rs, servoDigital,
  wheelSet130, wheelAxle, inner80Buggy, inner130Giant, shaft75, axleGuide, tire50, tire80Buggy,
  caterpillarLink, caterpillarSprocket, caterpillarWheelGuide, caterpillarRubber,
  batteryCase4aa,
  frameBigMain, frameMainPcb, frameMainPlastic, frameHalfPcb, lFrame6x6, motorFrame3x3, pcFrame45x60,
  frameS3Pcb, frameS4Pcb, frameS5Pcb, frameS7Pcb, frameS8Pcb, frameS3Plastic, frameS4Plastic, frameS5Plastic, frameMPcb,
  frameS8Plastic, frameOptionPcb, frameOptionPlastic, frameM6Pcb, frameMidPcb, frameMidPlastic, frame5x13Pcb, lFrame2x1, lFrame2x2, lFrame2x6, lFrame1202x2,
  battleG, battleI, battleJ, battleS, battleT, battleU, battleV,
  hinge3x3, grab, nutM3, capNutM3, sNutBlue, nutFrame4, motorGuide, boltM26x10, boltM3x6, boltM3x10, supportSpacer, spongeBall, colorBall, cable3pin,
];

export const categories = [['board', '보드'], ['sensor', '센서'], ['motor', '모터'], ['wheel', '바퀴'], ['power', '전원'], ['frame', '프레임'], ['battle', '배틀무기'], ['hardware', '조립 부품']];

// 부품의 3D 모양과 기능은 선택할 때 불러온다
export async function loadPart(id) {
  const [model, fn] = await Promise.all([
    import(`./parts/${id}/model.js`),
    import(`./parts/${id}/function.js`),
  ]);
  return { build: model.build, createFunction: fn.create };
}
