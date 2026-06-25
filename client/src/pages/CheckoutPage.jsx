import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProductImage from '@/components/product/ProductImage'
import { createOrder } from '@/api/orders'
import { COLOR_NAMES, formatPrice } from '@/data/ofMeCatalog'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { bgFor, hex } from '@/utils/ofMeVisuals'
import { calculateCartSummary } from '@/utils/cartSummary'
import {
  createMerchantUid,
  getPortOneConfigError,
  initPortOne,
  requestPortOnePayment,
} from '@/utils/portone'
import { clearPendingOrder, savePendingOrder } from '@/utils/pendingOrderStorage'

function getDefaultAddressId(addresses = []) {
  const valid = addresses.filter((address) => address.baseAddress && address.postcode)

  if (valid.length === 0) {
    return ''
  }

  const defaultAddress = valid.find((address) => address.isDefault)

  return String((defaultAddress || valid[0])._id || (defaultAddress || valid[0]).id || '')
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function getOrderName(items) {
  if (items.length === 0) {
    return 'Of Me 주문'
  }

  if (items.length === 1) {
    return items[0].name
  }

  return `${items[0].name} 외 ${items.length - 1}건`
}

function resolveFailureState(message, paymentCompleted) {
  if (message === 'PAY_CANCEL' || message.includes('PAY_CANCEL') || message.includes('취소')) {
    return { reason: 'cancelled', message: '결제 창에서 취소하셨습니다.' }
  }

  if (paymentCompleted) {
    return {
      reason: 'order',
      message: '결제는 완료되었으나 주문 저장에 실패했습니다.',
    }
  }

  if (message.includes('모듈') || message.includes('설정')) {
    return { reason: 'payment', message }
  }

  return { reason: 'payment', message }
}

function CheckoutPage() {
  const navigate = useNavigate()
  const { user, refreshUser, isLoading: isAuthLoading } = useAuth()
  const {
    coupon,
    points,
    clearCartItems,
    showToast,
    clearCheckout,
    getCheckoutItems,
    isCartHydrated,
  } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPortOneReady, setIsPortOneReady] = useState(false)
  const [shippingAddressId, setShippingAddressId] = useState('')
  const [phone, setPhone] = useState('')
  const [deliveryMemo, setDeliveryMemo] = useState('')
  const isCompletingOrderRef = useRef(false)

  const configError = getPortOneConfigError()
  const selectedItems = useMemo(() => getCheckoutItems(), [getCheckoutItems])
  const summary = useMemo(
    () => calculateCartSummary(selectedItems, coupon, points),
    [selectedItems, coupon, points]
  )

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    if (configError) {
      return undefined
    }

    let cancelled = false

    initPortOne()
      .then(() => {
        if (!cancelled) {
          setIsPortOneReady(true)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          showToast(error.message || '결제 모듈을 불러오지 못했습니다.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [configError, showToast])

  const isCheckoutReady = isCartHydrated && !isAuthLoading

  useEffect(() => {
    if (!isCheckoutReady || isCompletingOrderRef.current || isSubmitting) {
      return
    }

    if (selectedItems.length === 0) {
      navigate('/cart', { replace: true })
    }
  }, [isCheckoutReady, isSubmitting, selectedItems.length, navigate])

  const addresses = useMemo(
    () => (user?.addresses || []).filter((address) => address.baseAddress && address.postcode),
    [user]
  )

  useEffect(() => {
    if (!shippingAddressId && addresses.length > 0) {
      setShippingAddressId(getDefaultAddressId(addresses))
    }
  }, [addresses, shippingAddressId])

  const handleSubmitOrder = async () => {
    if (configError) {
      window.alert(configError)
      return
    }

    if (!shippingAddressId) {
      window.alert('배송지를 선택해 주세요.')
      return
    }

    if (!phone.trim()) {
      window.alert('연락처를 입력해 주세요.')
      return
    }

    if (summary.total <= 0) {
      window.alert('결제할 금액이 없습니다.')
      return
    }

    const items = selectedItems.map((item) => ({
      productId: String(item.id),
      color: item.color,
      size: item.size,
      qty: item.qty,
    }))

    const merchantUid = createMerchantUid()
    const orderName = getOrderName(selectedItems)

    setIsSubmitting(true)

    let paymentCompleted = false
    let recoveryMerchantUid = ''

    try {
      const payment = await requestPortOnePayment({
        amount: summary.total,
        merchantUid,
        name: orderName,
        buyerEmail: user.email,
        buyerName: user.name,
        buyerTel: phone.trim(),
      })

      paymentCompleted = true

      const orderPayload = {
        items,
        shippingAddressId,
        deliveryMemo,
        phone: phone.trim(),
        couponType: coupon,
        pointsUsed: summary.pointsUsed,
        impUid: payment.imp_uid,
        merchantUid: payment.merchant_uid,
        paymentMethod: 'card',
      }

      savePendingOrder(user.id, {
        ...orderPayload,
        totalAmount: summary.total,
      })
      recoveryMerchantUid = orderPayload.merchantUid

      let orderResult = null
      let lastError = null

      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          orderResult = await createOrder(orderPayload)
          break
        } catch (orderError) {
          lastError = orderError
          const shouldRetry =
            attempt < 3 &&
            (orderError.message?.includes('찾을 수 없') ||
              orderError.message?.includes('완료되지 않'))

          if (!shouldRetry) {
            throw orderError
          }

          await sleep(700 * (attempt + 1))
        }
      }

      if (!orderResult) {
        throw lastError || new Error('주문 생성에 실패했습니다.')
      }

      if (!orderResult?.order?.id) {
        throw new Error('주문 생성에 실패했습니다.')
      }

      const purchasedKeys = selectedItems.map((item) => item.key)
      isCompletingOrderRef.current = true
      clearPendingOrder()
      navigate(`/order/complete/${orderResult.order.id}`, { replace: true })
      clearCartItems(purchasedKeys)
      clearCheckout()
    } catch (checkoutError) {
      const message = checkoutError.message || '결제에 실패했습니다.'
      const failure = resolveFailureState(message, paymentCompleted)

      navigate('/order/failed', {
        replace: true,
        state: {
          reason: failure.reason,
          message: failure.message,
          total: summary.total,
          itemCount: selectedItems.reduce((sum, item) => sum + item.qty, 0),
          merchantUid: paymentCompleted ? recoveryMerchantUid : undefined,
        },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isCheckoutReady) {
    return (
      <main className="ofme__cart-main">
        <p className="ofme__empty-text">주문 정보를 불러오는 중...</p>
      </main>
    )
  }

  if (selectedItems.length === 0) {
    return (
      <main className="ofme__cart-main">
        <p className="ofme__empty-text">선택된 상품이 없습니다. 장바구니로 이동합니다...</p>
      </main>
    )
  }

  return (
    <main className="ofme__cart-main">
      <div className="ofme__breadcrumb" style={{ marginBottom: 18 }}>
        <Link to="/cart">← 장바구니</Link> &nbsp;·&nbsp; 주문하기
      </div>

      <h1 className="ofme__cart-title">주문하기</h1>

      {configError && (
        <section
          className="ofme__summary-box"
          style={{ marginBottom: 18, borderColor: '#ffb4ab', background: '#fff8f7' }}
        >
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#c0392b' }}>
            {configError}
          </p>
        </section>
      )}

      <section className="ofme__summary-box" style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>주문 상품</h2>
        <div className="ofme__cart-items" style={{ gap: 12 }}>
          {selectedItems.map((item) => (
            <div key={item.key} className="ofme__cart-item" style={{ padding: 0, border: 'none' }}>
              <div
                className="ofme__cart-thumb"
                style={{
                  width: 72,
                  height: 72,
                  background: item.imagePrimary
                    ? bgFor({ colors: [item.color, item.color] })
                    : `linear-gradient(155deg, ${hex(item.color)}, #fff)`,
                }}
              >
                {item.imagePrimary ? (
                  <ProductImage src={item.imagePrimary} fallback={item.imagePrimary} alt={item.name} />
                ) : (
                  <span className="ofme__cart-registered-label">{item.brand}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: '#8a8579' }}>{item.brand}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, margin: '2px 0 5px', lineHeight: 1.3 }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 11.5, color: '#8a8579' }}>
                  {COLOR_NAMES[item.color] || item.color} / {item.size} · {item.qty}개
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{formatPrice(item.price * item.qty)}원</div>
            </div>
          ))}
        </div>
      </section>

      <section className="ofme__summary-box" style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>배송 정보</h2>

        {addresses.length === 0 ? (
          <p className="ofme__empty-text">
            등록된 배송지가 없습니다.{' '}
            <Link to="/mypage" style={{ color: '#ff6f61', fontWeight: 700 }}>
              마이페이지
            </Link>
            에서 배송지를 등록해 주세요.
          </p>
        ) : (
          <>
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>배송지</span>
              <select
                value={shippingAddressId}
                onChange={(event) => setShippingAddressId(event.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid #e2ddd2',
                  fontFamily: 'inherit',
                  fontSize: 13.5,
                }}
              >
                {addresses.map((address) => {
                  const addressId = String(address._id || address.id)

                  return (
                    <option key={addressId} value={addressId}>
                      {(address.alias || '배송지')} · [{address.postcode}] {address.baseAddress} {address.detailAddress}
                    </option>
                  )
                })}
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>연락처</span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="010-0000-0000"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid #e2ddd2',
                  fontFamily: 'inherit',
                  fontSize: 13.5,
                }}
              />
            </label>

            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>배송 메모</span>
              <input
                type="text"
                value={deliveryMemo}
                onChange={(event) => setDeliveryMemo(event.target.value)}
                placeholder="문 앞에 놓아주세요"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid #e2ddd2',
                  fontFamily: 'inherit',
                  fontSize: 13.5,
                }}
              />
            </label>
          </>
        )}
      </section>

      <section className="ofme__summary-box">
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>결제 금액</h2>
        <div className="ofme__summary-line">
          <span>상품금액</span>
          <span style={{ fontWeight: 700 }}>{formatPrice(summary.goods)}원</span>
        </div>
        <div className="ofme__summary-line">
          <span>상품할인</span>
          <span style={{ fontWeight: 700, color: '#ff6f61' }}>−{formatPrice(summary.discountAmount)}원</span>
        </div>
        <div className="ofme__summary-line">
          <span>쿠폰할인</span>
          <span style={{ fontWeight: 700, color: '#ff6f61' }}>−{formatPrice(summary.couponDiscount)}원</span>
        </div>
        <div className="ofme__summary-line">
          <span>포인트</span>
          <span style={{ fontWeight: 700, color: '#ff6f61' }}>−{formatPrice(summary.pointsUsed)}원</span>
        </div>
        <div className="ofme__summary-line">
          <span>배송비</span>
          <span style={{ fontWeight: 700 }}>{summary.shipping === 0 ? '무료' : `${formatPrice(summary.shipping)}원`}</span>
        </div>
        <div className="ofme__summary-total">
          <span style={{ fontSize: 15, fontWeight: 800 }}>총 결제금액</span>
          <span>{formatPrice(summary.total)}원</span>
        </div>
        <button
          type="button"
          className="ofme__btn-primary"
          style={{ width: '100%', marginTop: 18, padding: 17, fontSize: 16 }}
          disabled={isSubmitting || Boolean(configError) || !isPortOneReady || addresses.length === 0}
          onClick={handleSubmitOrder}
        >
          {configError
            ? '결제 설정 필요'
            : !isPortOneReady
              ? '결제 모듈 불러오는 중...'
              : isSubmitting
                ? '결제 처리 중...'
                : `${formatPrice(summary.total)}원 결제하기`}
        </button>
      </section>
    </main>
  )
}

export default CheckoutPage
