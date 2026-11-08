// 프레임 Main 플라스틱
export default {
  id: 'frame-main-plastic',
  name: '프레임 Main 플라스틱',
  category: 'frame',
  productNo: 130,
  url: 'https://roboroboshop.com/product/detail.html?product_no=130&cate_no=194',
  size: { x: 120, y: 1.6, z: 80, estimated: false, note: '상품 페이지 공식 규격 120 × 80 × 1.6 mm' },
  specs: [
    ['크기', '120 × 80 × 1.6 mm'],
    ['구멍', '117개: 10mm 격자 12 × 8 + 가운데 5mm 사이 줄 (사진 기준)'],
    ['재질', 'Plastic 1.6T'],
  ],
  function: '메인 PCB 프레임과 같은 구멍 배치의 가벼운 플라스틱 판.',
  ports: [{ id: 'holes', type: 'M3 구멍 12 × 8', role: '보드 · 프레임 · 모터 고정' }],
};
