import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useAuth } from '@/context/AuthContext'
import { loadUserCart, saveUserCart } from '@/utils/cartStorage'
import { calculateCartSummary } from '@/utils/cartSummary'

const CartContext = createContext(null)

function makeCartKey(id, color, size) {
  return `${id}|${color}|${size}`
}

export function CartProvider({ children }) {
  const { user, isLoading } = useAuth()
  const userId = user?.id ?? null
  const skipSaveRef = useRef(false)

  const [cart, setCart] = useState([])
  const [selected, setSelected] = useState({})
  const [checkoutKeys, setCheckoutKeys] = useState(null)
  const [coupon, setCoupon] = useState(0)
  const [points, setPoints] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [isCartHydrated, setIsCartHydrated] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setIsCartHydrated(false)
      return
    }

    skipSaveRef.current = true
    const stored = loadUserCart(userId)
    setCart(stored.cart)
    setSelected(stored.selected)
    setCoupon(stored.coupon)
    setPoints(stored.points)
    setCheckoutKeys(null)
    setIsCartHydrated(true)
  }, [userId, isLoading])

  useEffect(() => {
    if (!userId || isLoading) {
      return
    }

    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }

    saveUserCart(userId, { cart, selected, coupon, points })
  }, [userId, cart, selected, coupon, points, isLoading])

  const cartCount = useMemo(() => {
    if (!userId) {
      return 0
    }

    return cart.reduce((sum, item) => sum + item.qty, 0)
  }, [cart, userId])

  const showToast = useCallback((message) => {
    setToastMessage(message)
    window.clearTimeout(showToast.timer)
    showToast.timer = window.setTimeout(() => setToastMessage(''), 1900)
  }, [])

  const addToCart = useCallback(({ id, color, size, qty = 1, buyNow = false, name, brand, price, orig, imagePrimary }) => {
    if (!userId) {
      showToast('로그인 후 장바구니를 이용할 수 있어요')
      return 'login'
    }

    const key = makeCartKey(id, color, size)
    const nextItem = { key, id, color, size, qty, name, brand, price, orig, imagePrimary }

    if (buyNow) {
      flushSync(() => {
        setCart((prev) => {
          const existing = prev.find((item) => item.key === key)

          if (existing) {
            return prev.map((item) =>
              item.key === key ? { ...item, qty: item.qty + qty } : item
            )
          }

          return [...prev, nextItem]
        })
        setSelected((prev) => ({ ...prev, [key]: true }))
        setCheckoutKeys([key])
      })

      return 'checkout'
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.key === key)

      if (existing) {
        return prev.map((item) =>
          item.key === key ? { ...item, qty: item.qty + qty } : item
        )
      }

      return [...prev, nextItem]
    })

    setSelected((prev) => ({ ...prev, [key]: true }))

    showToast('장바구니에 담았어요 🛍')
    return null
  }, [showToast, userId])

  const prepareCheckout = useCallback((keys) => {
    setCheckoutKeys(keys)
  }, [])

  const clearCheckout = useCallback(() => {
    setCheckoutKeys(null)
  }, [])

  const getCheckoutItems = useCallback(() => {
    const keys = checkoutKeys?.length
      ? checkoutKeys
      : cart.filter((item) => selected[item.key]).map((item) => item.key)

    return cart.filter((item) => keys.includes(item.key))
  }, [cart, checkoutKeys, selected])

  const changeQty = useCallback((key, delta) => {
    setCart((prev) => {
      const next = prev
        .map((item) => (item.key === key ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty >= 1)

      return next
    })
  }, [])

  const removeItem = useCallback((key) => {
    setCart((prev) => prev.filter((item) => item.key !== key))
    setSelected((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const toggleSelected = useCallback((key) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const selectAll = useCallback((checked) => {
    if (!checked) {
      setSelected({})
      return
    }

    setSelected((prev) => {
      const next = { ...prev }
      cart.forEach((item) => {
        next[item.key] = true
      })
      return next
    })
  }, [cart])

  const removeSelected = useCallback(() => {
    setCart((prev) => prev.filter((item) => !selected[item.key]))
    setSelected({})
  }, [selected])

  const clearCartItems = useCallback((keys) => {
    const keySet = new Set(keys)

    setCart((prev) => prev.filter((item) => !keySet.has(item.key)))
    setSelected((prev) => {
      const next = { ...prev }
      keys.forEach((key) => {
        delete next[key]
      })
      return next
    })
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setSelected({})
  }, [])

  const summary = useMemo(
    () => calculateCartSummary(cart, coupon, points),
    [cart, coupon, points]
  )

  const value = {
    cart,
    selected,
    checkoutKeys,
    coupon,
    points,
    cartCount,
    toastMessage,
    summary,
    isCartHydrated,
    setCoupon,
    setPoints,
    showToast,
    addToCart,
    changeQty,
    removeItem,
    toggleSelected,
    selectAll,
    removeSelected,
    clearCartItems,
    clearCart,
    prepareCheckout,
    clearCheckout,
    getCheckoutItems,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }

  return context
}
