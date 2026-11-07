// 서포트 5 ~ 40mm: 프레임과 프레임 사이를 띄워 고정하는 육각 지지대 (9가지 길이)
export default {
  id: 'support-spacer',
  name: '서포트 (5 ~ 40mm)',
  category: 'hardware',
  productNo: 101,
  url: 'https://roboroboshop.com/product/detail.html?product_no=101&cate_no=194',
  size: { x: 6.4, y: 46, z: 5.5, estimated: true, note: '상품 페이지: 길이 5~40mm · SUS · 육각 맞변 5.5mm, 수나사 6mm는 사진과 M3 표준으로 추정 (높이는 40mm 기준)' },
  specs: [
    ['길이', '5 · 7 · 10 · 15 · 20 · 25 · 30 · 35 · 40 mm (상품 9종)'],
    ['재질', 'SUS (스테인리스)'],
    ['나사', '한쪽 M3 수나사 · 반대쪽 M3 암나사'],
    ['조립', 'M3 볼트 · M3 너트로 조립 가능'],
  ],
  function: '프레임 사이에 세워 두 층을 원하는 높이만큼 띄워 고정한다. 수나사 쪽은 너트로, 암나사 쪽은 볼트로 조인다.',
  ports: [
    { id: 'male', type: 'M3 수나사', role: '프레임 구멍 + M3 너트' },
    { id: 'female', type: 'M3 암나사', role: '프레임 구멍 + M3 볼트' },
  ],
};
