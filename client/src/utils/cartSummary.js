export function calculateCartSummary(items, coupon = 0, points = '') {
  const goods = items.reduce((sum, item) => sum + (item.price ?? 0) * item.qty, 0)

  const discountAmount = items.reduce((sum, item) => {
    if (!item.orig) return sum
    return sum + (item.orig - item.price) * item.qty
  }, 0)

  let couponDiscount = 0
  let freeShip = false

  if (coupon === 1) couponDiscount = Math.min(5000, goods)
  else if (coupon === 2) couponDiscount = Math.round(goods * 0.1)
  else if (coupon === 3) freeShip = true

  const pointsUsed = Math.min(
    parseInt(points || '0', 10) || 0,
    3200,
    Math.max(0, goods - couponDiscount)
  )
  const shipping = goods >= 50000 || freeShip || goods === 0 ? 0 : 3000
  const total = Math.max(0, goods - couponDiscount - pointsUsed + shipping)

  return {
    goods,
    discountAmount,
    couponDiscount,
    pointsUsed,
    shipping,
    total,
  }
}
