import {
  createTopBar, createJetPanel, createPowerPanel, createArmCurlPanel, createDepthPanel,
  createAssembliesPanel, createDisplayPanel, createSubsystemsPanel, createOperationLog,
  createModeTitle, createFooter,
} from './panels/index.js';
import './styles/theme.css';
import './styles/hud.css';

// HUD 조립: 상단 바, 왼쪽 열(분사, 전원, 팔), 오른쪽 열(수심, 부위 선택, 표시 옵션, 서브시스템),
// 모드 이름, 하단 진행 패널, 맨 아래 설명 줄.
// 숫자 패널은 초당 10번, 진행 막대와 모드 이름은 매 프레임 갱신한다.
export class Hud {
  constructor(container, { armNames, onSelectAssembly, onToggleDisplay, onTogglePlay, onSeek }) {
    this.container = container;
    this.top = createTopBar();
    this.left = [createJetPanel(), createPowerPanel(), createArmCurlPanel(armNames)];
    this.right = [
      createDepthPanel(),
      createAssembliesPanel({ onSelect: onSelectAssembly }),
      createDisplayPanel({ onToggle: onToggleDisplay }),
      createSubsystemsPanel(),
    ];
    this.modeTitle = createModeTitle();
    this.log = createOperationLog({ onToggle: onTogglePlay, onSeek });
    this.footer = createFooter();

    const leftCol = document.createElement('div');
    leftCol.className = 'hud-col hud-col-left';
    this.left.forEach((p) => leftCol.appendChild(p.el));
    const rightCol = document.createElement('div');
    rightCol.className = 'hud-col hud-col-right';
    this.right.forEach((p) => rightCol.appendChild(p.el));
    this.leftCol = leftCol;
    this.rightCol = rightCol;

    container.classList.add('hud');
    container.append(this.top.el, leftCol, rightCol, this.modeTitle.el, this.log.el, this.footer.el);

    this.slow = [this.top, ...this.left, ...this.right];
    this.acc = Infinity;
  }

  update(S, dt) {
    this.acc += dt;
    if (this.acc >= 0.1) {
      this.acc = 0;
      for (const p of this.slow) p.update(S);
      return true; // 이번 프레임에 숫자 패널을 갱신했다
    }
    this.modeTitle.update(S);
    this.log.update(S);
    return false;
  }

  // 이름표가 들어갈 수 있는 화면 영역: 패널에 가리지 않는 가운데 부분
  safeArea() {
    const vis = (el) => el.offsetParent !== null && el.offsetWidth > 0;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    return {
      left: vis(this.leftCol) ? this.leftCol.getBoundingClientRect().right + 12 : 16,
      right: vis(this.rightCol) ? w - this.rightCol.getBoundingClientRect().left + 12 : 16,
      top: this.top.el.getBoundingClientRect().bottom + 12,
      bottom: h - this.log.el.getBoundingClientRect().top + 12,
    };
  }
}
