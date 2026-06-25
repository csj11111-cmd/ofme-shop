import { getCatalogNumericId } from '@/utils/productId'

export function hasRegisteredImages(product) {
  return Boolean(product?.images?.primary)
}

export function getRegisteredImageSrc(product, type = 'primary') {
  const src = product?.images?.[type]

  if (!src) {
    return null
  }

  if (src.startsWith('data:') || src.startsWith('http')) {
    return src
  }

  return src.startsWith('/') ? src : `/${src}`
}

function getColorImageSrc(product, color) {
  if (product?.colorImages?.[color]) {
    return product.colorImages[color]
  }

  const catalogId = getCatalogNumericId(product)

  if (catalogId) {
    return `/models/p${catalogId}_${color}.png`
  }

  return null
}

/** 기본색은 primary/walk, 다른 색상은 colorImages 또는 로컬 p{id}_{color}.png */
export function getRegisteredPhotoSrc(product, color, primaryColor, walk = false) {
  if (color && color !== primaryColor) {
    const colorSrc = getColorImageSrc(product, color)

    if (colorSrc) {
      return colorSrc
    }
  }

  if (walk) {
    return getRegisteredImageSrc(product, 'walk') || getRegisteredImageSrc(product, 'primary')
  }

  return getRegisteredImageSrc(product, 'primary')
}

export function getRegisteredCardImages(product) {
  const primary = getRegisteredImageSrc(product, 'primary')
  const walk = getRegisteredImageSrc(product, 'walk') || primary
  const coordi = getRegisteredImageSrc(product, 'coordi') || walk

  return { primary, walk, coordi }
}

export function getRegisteredDetailImageSrc(product, { detailImg, color, detailHover }) {
  const primaryColor = product.colors?.[0]

  if (detailImg === 'coordi') {
    return getRegisteredImageSrc(product, 'coordi') || getRegisteredImageSrc(product, 'primary')
  }

  if (detailImg === 'flat') {
    return getRegisteredImageSrc(product, 'flat') || getRegisteredImageSrc(product, 'primary')
  }

  if (detailImg === 'walk') {
    return getRegisteredPhotoSrc(product, color, primaryColor, true)
  }

  return getRegisteredPhotoSrc(product, color, primaryColor, detailHover)
}
