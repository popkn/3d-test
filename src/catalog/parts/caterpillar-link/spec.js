// 캐터필러 (80개입): 마디를 이어 탱크 바퀴(무한궤도)를 만드는 부품
export default {
  id: 'caterpillar-link',
  name: '캐터필러 (마디)',
  category: 'wheel',
  productNo: 71,
  url: 'https://roboroboshop.com/product/detail.html?product_no=71&cate_no=194',
  size: { x: 10, y: 6, z: 22, estimated: true, note: '상품 페이지에 크기 없음 (재질 ABS, 80개입) · 사진으로 추정' },
  specs: [
    ['재질', 'ABS'],
    ['수량', '80개입 (상품) · 7호 키트 100개'],
    ['연결', '마디끼리 고리를 끼워 이어 붙임'],
    ['함께 쓰는 부품', '캐터필러 휠(톱니) · 캐터필러 휠가이드 · 캐터필러 러버'],
  ],
  function: '마디를 이어 고리 모양 궤도를 만들고, 톱니 휠 두 개에 걸어 돌리면 탱크처럼 울퉁불퉁한 곳도 지나간다.',
  ports: [{ id: 'hinge', type: '고리 연결', role: '다음 마디와 연결' }],
};
