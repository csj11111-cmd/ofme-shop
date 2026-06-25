import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProductImage from '@/components/product/ProductImage'
import { fetchOrderById } from '@/api/orders'
import { COLOR_NAMES, formatPrice } from '@/data/ofMeCatalog'

function formatPaidAt(value) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function OrderCompletePage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!orderId) {
      navigate('/', { replace: true })
      return
    }

    fetchOrderById(orderId)
      .then((data) => {
        const nextOrder = data.order

        if (!nextOrder || nextOrder.payment?.status !== 'paid') {
          setError('결제가 완료되지 않은 주문입니다.')
          return
        }

        setOrder(nextOrder)
      })
      .catch((fetchError) => {
        setError(fetchError.message || '주문 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [orderId, navigate])

  if (isLoading) {
    return (
      <main className="ofme__complete-main">
        <p className="ofme__empty-text" style={{ textAlign: 'center', padding: '80px 0' }}>
          결제 정보를 확인하는 중...
        </p>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="ofme__complete-main">
        <section className="ofme__complete-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="ofme__complete-icon" style={{ background: '#c0392b', fontSize: 28 }}>!</div>
          <h1 className="ofme__complete-title">주문을 확인할 수 없습니다</h1>
          <p className="ofme__complete-sub">{error || '주문을 찾을 수 없습니다.'}</p>
          <div className="ofme__complete-actions ofme__complete-actions--single" style={{ maxWidth: 280, margin: '24px auto 0' }}>
            <Link to="/mypage#orders" className="ofme__btn-primary">
              주문 내역 보기
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <main className="ofme__complete-main">
      <section className="ofme__complete-hero">
        <div className="ofme__complete-icon">✓</div>
        <h1 className="ofme__complete-title">결제가 완료되었습니다</h1>
        <p className="ofme__complete-sub">
          주문이 정상적으로 접수되었어요.
          <br />
          {formatPaidAt(order.payment?.paidAt || order.createdAt)}
        </p>
        <div className="ofme__complete-order-no">
          주문번호 <span>{order.orderNumber}</span>
        </div>
      </section>

      <div className="ofme__complete-grid">
        <section className="ofme__complete-panel">
          <h2 className="ofme__complete-panel-title">
            구매 상품 <span className="ofme__badge">{itemCount}개</span>
          </h2>
          {order.items.map((item, index) => (
            <div key={`${item.productId}-${index}`} className="ofme__complete-item">
              <div className="ofme__complete-item-thumb">
                {item.image ? (
                  <ProductImage src={item.image} fallback={item.image} alt={item.name} />
                ) : (
                  <span className="ofme__cart-registered-label" style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    {item.brand}
                  </span>
                )}
              </div>
              <div className="ofme__complete-item-body">
                <div className="ofme__complete-item-brand">{item.brand}</div>
                <div className="ofme__complete-item-name">{item.name}</div>
                <div className="ofme__complete-item-option">
                  {COLOR_NAMES[item.color] || item.color} / {item.size} · {item.qty}개
                </div>
              </div>
              <div className="ofme__complete-item-price">
                {formatPrice(item.lineTotal ?? item.price * item.qty)}원
              </div>
            </div>
          ))}
        </section>

        {order.shipping && (
          <section className="ofme__complete-panel">
            <h2 className="ofme__complete-panel-title">배송 정보</h2>
            <p className="ofme__complete-shipping">
              <strong>{order.shipping.recipientName}</strong>
              {order.shipping.phone}
              <br />
              [{order.shipping.postcode}] {order.shipping.baseAddress} {order.shipping.detailAddress}
              {order.shipping.deliveryMemo && (
                <>
                  <br />
                  <span style={{ color: '#8a8579' }}>배송 메모: {order.shipping.deliveryMemo}</span>
                </>
              )}
            </p>
          </section>
        )}

        <section className="ofme__complete-panel">
          <h2 className="ofme__complete-panel-title">결제 내역</h2>
          <div className="ofme__summary-line">
            <span>상품금액</span>
            <span style={{ fontWeight: 700 }}>{formatPrice(order.goodsAmount)}원</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="ofme__summary-line">
              <span>상품할인</span>
              <span style={{ fontWeight: 700, color: '#ff6f61' }}>−{formatPrice(order.discountAmount)}원</span>
            </div>
          )}
          {order.couponDiscount > 0 && (
            <div className="ofme__summary-line">
              <span>쿠폰할인</span>
              <span style={{ fontWeight: 700, color: '#ff6f61' }}>−{formatPrice(order.couponDiscount)}원</span>
            </div>
          )}
          {order.pointsUsed > 0 && (
            <div className="ofme__summary-line">
              <span>포인트</span>
              <span style={{ fontWeight: 700, color: '#ff6f61' }}>−{formatPrice(order.pointsUsed)}원</span>
            </div>
          )}
          <div className="ofme__summary-line">
            <span>배송비</span>
            <span style={{ fontWeight: 700 }}>
              {order.shippingFee === 0 ? '무료' : `${formatPrice(order.shippingFee)}원`}
            </span>
          </div>
          <div className="ofme__complete-total">
            <span>총 결제금액</span>
            <span>{formatPrice(order.totalAmount)}원</span>
          </div>

          <div className="ofme__complete-actions">
            <Link to="/mypage#orders" className="ofme__btn-primary">
              주문 내역 보기
            </Link>
            <Link to="/" className="ofme__btn-outline">
              쇼핑 계속하기
            </Link>
          </div>
          <p className="ofme__complete-note">
            마이페이지에서 주문 상태와 배송 정보를 확인할 수 있어요.
          </p>
        </section>
      </div>
    </main>
  )
}

export default OrderCompletePage
