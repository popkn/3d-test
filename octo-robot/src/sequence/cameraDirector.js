
// 카메라 연출: 구간마다 정해진 카메라 자리로 천천히 이동한다.
// 사용자가 마우스로 화면을 돌리면 잠시(holdSeconds) 연출을 멈추고 사용자 조작을 따른다.
export class CameraDirector {
  constructor(camera, controls, { speed = 0.9, holdSeconds = 5 } = {}) {
    this.camera = camera;
    this.controls = controls;
    this.speed = speed;
    this.holdSeconds = holdSeconds;
    this.enabled = true;
    this.userHold = 0;
    this.goalPos = camera.position.clone();
    this.goalTarget = controls.target.clone();
    controls.addEventListener('start', () => { this.userHold = this.holdSeconds; this.dragging = true; });
    controls.addEventListener('end', () => { this.dragging = false; });
  }

  setShot(shot, { immediate = false } = {}) {
    if (!shot) return;
    this.goalPos.fromArray(shot.position);
    this.goalTarget.fromArray(shot.target);
    if (immediate) {
      this.camera.position.copy(this.goalPos);
      this.controls.target.copy(this.goalTarget);
    }
  }

  update(dt) {
    if (!this.enabled) return;
    if (this.dragging) return;
    if (this.userHold > 0) { this.userHold -= dt; return; }
    const k = 1 - Math.exp(-dt * this.speed);
    this.camera.position.lerp(this.goalPos, k);
    this.controls.target.lerp(this.goalTarget, k);
  }
}

