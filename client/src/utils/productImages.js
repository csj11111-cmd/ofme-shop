const CARD_FOCAL = {
  tee: { scale: 1.42, origin: '50% 44%' },
  tank: { scale: 1.42, origin: '50% 44%' },
  dress: { scale: 1.22, origin: '50% 42%' },
  swim: { scale: 1.3, origin: '50% 46%' },
  active: { scale: 1.32, origin: '50% 46%' },
  shorts: { scale: 1.46, origin: '50% 62%' },
  skirt: { scale: 1.4, origin: '50% 58%' },
}

export function getPrimaryPhotoSrc(productId) {
  return `/models/p${productId}.png`
}

export function getWalkPhotoSrc(productId) {
  return `/models/p${productId}_w.png`
}

export function getColorPhotoSrc(productId, color) {
  return `/models/p${productId}_${color}.png`
}

export function getCoordiPhotoSrc(productId) {
  return `/models/p${productId}_coordi.png`
}

export function getFlatPhotoSrc(productId) {
  return `/models/p${productId}_flat.png`
}

/** DC 원본 photoSrc 규칙 */
export function getPhotoSrc(productId, color, primaryColor, walk = false) {
  if (color === primaryColor) {
    return walk ? getWalkPhotoSrc(productId) : getPrimaryPhotoSrc(productId)
  }

  return getColorPhotoSrc(productId, color)
}

export function getCardFocal(garmentType) {
  return CARD_FOCAL[garmentType] || { scale: 1.3, origin: '50% 46%' }
}

/** _w가 기본샷과 거의 같아 줌아웃만 보이는 상품 → coordi 호버 */
const CARD_HOVER_COORDI_IDS = new Set([28, 29, 36])

export function getCardHoverSrc(productId) {
  if (CARD_HOVER_COORDI_IDS.has(productId)) {
    return getCoordiPhotoSrc(productId)
  }

  return getWalkPhotoSrc(productId)
}

export function getCardHoverFallback(productId) {
  if (CARD_HOVER_COORDI_IDS.has(productId)) {
    return getWalkPhotoSrc(productId)
  }

  return getCoordiPhotoSrc(productId)
}

export function getDetailImageSrc(product, { color, detailImg, detailHover }) {
  const primaryColor = product.colors[0]

  if (detailImg === 'coordi') {
    return getCoordiPhotoSrc(product.id)
  }

  if (detailImg === 'flat') {
    return getFlatPhotoSrc(product.id)
  }

  if (detailImg === 'walk') {
    return getPhotoSrc(product.id, color, primaryColor, true)
  }

  return getPhotoSrc(product.id, color, primaryColor, detailHover)
}
