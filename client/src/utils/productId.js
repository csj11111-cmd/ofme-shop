export function getProductCode(product) {
  if (product?.productCode) {
    return product.productCode
  }

  return getProductCodeFromId(product?.id)
}

export function getProductCodeFromId(id) {
  const value = String(id ?? '')

  if (/^\d+$/.test(value)) {
    return `P-${value.padStart(3, '0')}`
  }

  return value
}

export function getCatalogNumericId(product) {
  const code = product?.productCode

  if (!code) {
    return null
  }

  const match = String(code).match(/^P-(\d+)$/i)

  return match ? Number(match[1]) : null
}
