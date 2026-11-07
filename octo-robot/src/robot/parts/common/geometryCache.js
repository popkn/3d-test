// 같은 모양의 도형은 한 번만 만들고 재사용한다. (리벳 수백 개가 도형 하나를 공유)
const cache = new Map();

export function cachedGeometry(key, factory) {
  if (!cache.has(key)) cache.set(key, factory());
  return cache.get(key);
}
