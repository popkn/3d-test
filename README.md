# 로보로보 부품 3D

로보로보 쇼핑몰 부품을 three.js로 **실제 규격(1 = 1 mm)** 그대로 만들고, 각 부품의 **기능**까지 동작하게 구현한 부품 목록입니다.

`index.html`을 브라우저로 열면 됩니다. 빌드 없이 바로 실행되고, three.js는 CDN에서 불러옵니다.

## 부품 (로보로보 쇼핑몰 카테고리 194, 1페이지)

| 부품 | 크기 (mm) | 구현한 기능 |
|---|---|---|
| AVR USB ISP 보드 | 62 × 19 × 18 | USB·6P 케이블 연결, STK500 다운로드 (서명 확인 → 지우기 → 쓰기 → 검증), 데이터 흐름 표시 |
| CPU Board 8M[12V/S] | 83 × 61 × 14 (추정) | 전원, 6V/12V 스위치, 입력 7개 · 출력 5개, 예제 프로그램 (입력 따라 출력 · 차례로 켜기 · 부저) |
| CPU-블랙라인프로W | 160 × 158 × 35 | 바닥 센서 7개 라인트레이싱 (좌·우·직진 판단, 모터 명령), 배터리 체크, 고휘도 LED, 부저 |
| Interface Board [서보] | 46 × 18 × 19 | 배터리 연결, 전원 스위치, 포트 4·5 전원 선택, 출력별 전원 표시 |
| Buzzer 보드[S] | 22 × 32 × 12 (추정) | ON/OFF, 소리 높이, 삑, 도레미 (실제 소리) |
| LED 보드[빨강/S] | 22 × 32 × 12 (추정) | ON/OFF, PWM 밝기, 깜빡임 · 숨쉬기 |
| LED Dot Matrix Board | 83 × 50 × 12 (추정) | 16 × 8 삼색 도트: 글자 흐르기, 스마일, 하트, 색 순환 |
| DC Motor 130rpm [RS] | 60 × 25 × 36 (추정) | 전압에 비례한 회전, 정/역회전, 바퀴 달기 |
| DC Motor 130rpm [RS/M] | 60 × 25 × 36 (추정) | 〃 (금속 기어) |
| DC Motor 130rpm 양축 | 60 × 30 × 36 (추정) | 〃 (양쪽 축) |
| DC Motor 400rpm [RS] | 60 × 25 × 36 (추정) | 〃 (400 rpm) |
| DC Motor 600rpm [HT600] | 60 × 20 × 40 | 〃 (9V, 600 rpm, 무부하 전류 표시) |

**(추정)** 은 상품 페이지에 크기가 없어 사진 비율, 핀 간격(2.54mm), 같은 계열 부품의 공식 규격으로 정한 값입니다. 화면에도 "추정"으로 표시됩니다.

## 구조

```
index.html                 부품 뷰어 (목록 · 3D · 기능 패널)
src/
├── main.js                뷰어 연결
├── viewer/                3D 화면, 이름표/치수, 오른쪽 패널, 스타일
├── kit/                   부품을 만드는 공통 재료
│   ├── pcb.js             기판 (외곽선, 구멍, 프레임 구멍, 실크 인쇄)
│   ├── components.js      칩, 저항, LED, 핀 헤더, 커넥터, USB-B, RJ12, 스위치, 크리스털, 콘덴서, 부저
│   ├── sBoard.js          S 모듈 기판 (부저 · LED 보드)
│   ├── motorCase.js       기어드 모터 케이스, 바퀴
│   ├── motorSim.js        모터 기능 (전압 → 회전 속도)
│   ├── audio.js           소리
│   ├── materials.js       재질
│   └── textures.js        글자/그림 텍스처
└── catalog/
    ├── index.js           부품 목록
    └── parts/<부품>/
        ├── spec.js        규격 (출처, 공식/추정, 사양, 연결 포트)
        ├── model.js       3D 모양
        └── function.js    기능 (조작 버튼과 동작)
```

## 부품 추가 방법

1. `src/catalog/parts/<부품 id>/`에 `spec.js`, `model.js`, `function.js`를 만든다.
2. `src/catalog/index.js`의 목록에 한 줄 추가한다.

- `model.js`의 `build()`는 `{ object3d, labels, handles }`를 돌려준다.
- `function.js`의 `create(model, ui)`는 `ui.controls([...])`로 조작 버튼을, `ui.readouts([...])`로 결과 칸을 만들고 `{ onControl, update, dispose }`를 돌려준다.
