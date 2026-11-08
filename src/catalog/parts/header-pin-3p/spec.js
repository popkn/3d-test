// 3핀 헤더핀: 3핀 케이블 두 개를 이어 길게 만드는 수-수 핀
export default {
  id: 'header-pin-3p',
  name: '헤더핀 3pin',
  category: 'hardware',
  productNo: 184,
  url: 'https://roboroboshop.com/product/detail.html?product_no=184&cate_no=194',
  size: { x: 16, y: 8, z: 2.5, estimated: false, note: '상품 페이지 공식 규격 8(L) × 16(W) × 2(H) mm, 1 g 이내 (판매 단위 10개)' },
  specs: [
    ['크기', '8 × 16 × 2 mm'],
    ['핀', '3개, 2.54 mm 간격 (양쪽 수핀)'],
    ['무게', '1 g 이내'],
  ],
  function: '3핀 케이블의 암 커넥터 두 개를 양쪽에서 꽂아 하나로 이어 준다. 케이블 길이가 모자랄 때 쓴다.',
  ports: [{ id: 'pins', type: '3핀 수 · 수', role: '3핀 케이블 연장 (S · + · -)' }],
};
