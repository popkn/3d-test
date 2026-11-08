// S후크 35 (노랑): 프레임 두 개를 돌아가게 잇는 플라스틱 슬라이드 샤프트
export default {
  id: 's-hook-35',
  name: '후크 S35 [노랑]',
  category: 'hardware',
  productNo: 102,
  url: 'https://roboroboshop.com/product/detail.html?product_no=102&cate_no=194',
  size: { x: 6.5, y: 7.6, z: 6.5, estimated: true, note: '축 지름 3.5 mm만 공식 (Slide Shaft 3.5mm). 머리 Ø6.5 · 길이는 사진과 프레임 두 장(1.6 × 2) 두께로 추정' },
  specs: [
    ['축 지름', '3.5 mm'],
    ['재질', '플라스틱 (노랑)'],
    ['끝', '두 갈래로 갈라진 걸림 턱 (눌러 끼우면 빠지지 않음)'],
  ],
  function: '프레임 두 장의 구멍에 눌러 끼우면 빠지지 않으면서도 돌아간다. 링크 · 관절처럼 움직여야 하는 곳을 볼트 대신 잇는다.',
  ports: [{ id: 'shaft', type: 'Ø3.5 축', role: '프레임 두 장을 돌아가게 연결' }],
};
