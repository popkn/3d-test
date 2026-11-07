// 캐터필러 러버: 캐터필러 마디 바깥에 끼우는 파란 실리콘 고무 (미끄럼 방지)
export default {
  id: 'caterpillar-rubber',
  name: '캐터필러 러버',
  category: 'wheel',
  productNo: 157,
  url: 'https://roboroboshop.com/product/detail.html?product_no=157&cate_no=194',
  size: { x: 7.5, y: 2.5, z: 18, estimated: true, note: '상품 페이지에 크기 없음 (재질 실리콘) · 캐터필러 마디에 맞춰 추정' },
  specs: [
    ['재질', '실리콘'],
    ['색', '파랑'],
    ['용도', '캐터필러 마디 바깥면에 끼움'],
  ],
  function: '딱딱한 캐터필러 마디에 끼우면 바닥과 닿는 면이 고무가 되어 미끄러지지 않고 잘 올라간다.',
  ports: [{ id: 'fit', type: '끼움', role: '캐터필러 마디 바깥면' }],
};
