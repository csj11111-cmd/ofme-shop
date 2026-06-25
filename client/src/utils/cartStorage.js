const CART_PREFIX = 'ofme-cart:'

function getCartStorageKey(userId) {
  return `${CART_PREFIX}${userId}`
}

const emptyCartState = () => ({
  cart: [],
  selected: {},
  coupon: 0,
  points: '',
})

export function loadUserCart(userId) {
  if (!userId) {
    return emptyCartState()
  }

  try {
    const raw = localStorage.getItem(getCartStorageKey(userId))

    if (!raw) {
      return emptyCartState()
    }

    const data = JSON.parse(raw)

    return {
      cart: Array.isArray(data.cart) ? data.cart : [],
      selected: data.selected && typeof data.selected === 'object' ? data.selected : {},
      coupon: data.coupon ?? 0,
      points: data.points ?? '',
    }
  } catch {
    return emptyCartState()
  }
}

export function saveUserCart(userId, { cart, selected, coupon, points }) {
  if (!userId) {
    return
  }

  localStorage.setItem(
    getCartStorageKey(userId),
    JSON.stringify({ cart, selected, coupon, points })
  )
}
