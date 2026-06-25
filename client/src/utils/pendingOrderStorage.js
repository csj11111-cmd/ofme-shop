const PENDING_ORDER_KEY = 'ofme-pending-order'

export function savePendingOrder(userId, payload) {
  if (!userId || !payload?.merchantUid) {
    return
  }

  try {
    localStorage.setItem(
      PENDING_ORDER_KEY,
      JSON.stringify({
        userId: String(userId),
        ...payload,
        savedAt: new Date().toISOString(),
      })
    )
  } catch {
    // ignore quota errors
  }
}

export function loadPendingOrder(userId) {
  if (!userId) {
    return null
  }

  try {
    const raw = localStorage.getItem(PENDING_ORDER_KEY)
    if (!raw) {
      return null
    }

    const data = JSON.parse(raw)
    if (String(data.userId) !== String(userId)) {
      return null
    }

    return data
  } catch {
    return null
  }
}

export function clearPendingOrder() {
  try {
    localStorage.removeItem(PENDING_ORDER_KEY)
  } catch {
    // ignore
  }
}
