// 그랩[플라스틱]: 로봇 집게 손가락으로 쓰는 빗 모양 프레임
export default {
  id: 'grab',
  name: '그랩[플라스틱]',
  category: 'hardware',
  productNo: 150,
  url: 'https://roboroboshop.com/product/detail.html?product_no=150&cate_no=194',
  size: { x: 22, y: 12, z: 32, estimated: true, note: '상품 페이지에 크기 없음 (재질 ABS) · 사진 비율로 추정' },
  specs: [
    ['재질', 'ABS'],
    ['색', '회색'],
    ['모양', '고정 구멍이 있는 몸통 + 빗살 5개'],
  ],
  function: '두 개를 마주 보게 달아 집게(그리퍼)를 만든다. 빗살 사이로 공 같은 물체를 감싸 쥔다.',
  ports: [{ id: 'mount', type: '고정 구멍', role: '프레임 · 서보에 볼트 고정' }],
};
