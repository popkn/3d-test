// 적외선 센서 보드[TR]: 적외선을 쏘고 반사된 빛으로 물체·바닥 색을 감지한다
export default {
  id: 'sensor-ir-tr',
  name: '적외선 센서 보드[TR]',
  category: 'sensor',
  productNo: 190,
  url: 'https://roboroboshop.com/product/detail.html?product_no=190&cate_no=194',
  size: { x: 48, y: 9, z: 28, estimated: true, note: '상품 페이지에 사양 없음 · 같은 센서 보드(소리·접촉, 48×28×9mm 공식)와 같은 기판으로 추정' },
  specs: [
    ['종류', '반사형 적외선 센서 (TR 방식)'],
    ['발광', '적외선 LED (D2, 투명)'],
    ['수광', '포토 트랜지스터 (Q1, 검정)'],
    ['표시', '감지 LED (D1)'],
    ['출력', '감지 여부 디지털 신호 (감지 시 LOW로 가정)'],
    ['용도', '물체 감지 · 라인트레이싱 (흰 바닥 / 검은 선)'],
  ],
  function: '적외선 LED가 빛을 쏘고, 물체나 흰 바닥에 반사된 빛을 포토 트랜지스터가 받으면 감지한다. 검은 선은 빛을 흡수해 감지되지 않는다.',
  ports: [{ id: 'signal', type: '3핀 2.54mm', role: 'CPU 입력 포트 연결' }],
};
