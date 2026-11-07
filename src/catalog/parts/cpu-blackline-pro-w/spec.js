// CPU-블랙라인프로W: 정밀 고속 라인트레이싱용 로봇 메인보드
export default {
  id: 'cpu-blackline-pro-w',
  name: 'CPU-블랙라인프로W',
  category: 'board',
  productNo: 67,
  url: 'https://roboroboshop.com/product/detail.html?product_no=67&cate_no=194',
  size: { x: 160, y: 35, z: 158, estimated: false, note: '상품 페이지 공식 규격 160(L) × 158(W) × 35(H) mm' },
  specs: [
    ['CPU', 'ATmega64A'],
    ['권장 전압', '6 ~ 12 V'],
    ['무게', '197 g (배터리 제외)'],
    ['PCB', 'FR-4 1.6T 양면'],
    ['다운로드', 'USB ISP 방식 (ISP 보드 제공)'],
    ['입·출력', '8채널'],
    ['서보 포트', '8채널 (5V 출력 / 직접 전원 출력 구분)'],
    ['내장', '부저 · 고휘도 LED · 바닥면 라인 센서'],
    ['기타', '전·후진 라인트레이싱, 모터 과부하 에러 검출, 배터리 체크, 무선조종 포트'],
  ],
  function: '바닥면 센서로 검은 선을 감지해 따라가는 라인트레이싱 로봇의 두뇌. Motor Drive Board[프로] (별매)와 함께 모터를 구동한다.',
  ports: [
    { id: 'isp', type: '6P 모듈러 (RJ12)', role: 'AVR USB ISP 보드로 프로그램 다운로드' },
    { id: 'servo', type: '3핀 × 8', role: '서보 모터' },
    { id: 'sensor', type: '센서 커넥터', role: '추가 센서보드' },
    { id: 'power', type: '2핀 전원', role: '배터리 6~12V' },
    { id: 'frame', type: '프레임 구멍', role: '로보로보 프레임 고정' },
  ],
};
