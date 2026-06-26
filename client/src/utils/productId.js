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

  if (code) {
    const match = String(code).match(/^P-(\d+)$/i)

    if (match) {
      return Number(match[1])
    }
  }

  const primary = product?.images?.primary

  if (primary) {
    const match = String(primary).match(/\/models\/p(\d+)\.png/i)

    if (match) {
      return Number(match[1])
    }
  }

  return null
}
