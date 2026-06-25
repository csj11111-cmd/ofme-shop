import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ProductImage from '@/components/product/ProductImage'
import {
  ORDER_STATUS_CLASS,
  ORDER_STATUS_LABEL,
  cancelOrder,
  createOrder,
  fetchMyOrders,
  fetchOrphanPayments,
  refundOrphanPayment,
} from '@/api/orders'
import { createReview, fetchMyReviews } from '@/api/reviews'
import { COLOR_NAMES, formatPrice } from '@/data/ofMeCatalog'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { clearPendingOrder, loadPendingOrder } from '@/utils/pendingOrderStorage'

const CANCELLABLE_STATUSES = ['pending', 'paid', 'preparing']
const ORDER_FILTER_TABS = [
  { key: 'all', label: '전체' },
  { key: 'received', label: '주문접수' },
  { key: 'preparing', label: '상품준비' },
  { key: 'shipped', label: '배송중' },
  { key: 'delivered', label: '배송완료' },
  { key: 'failed', label: '취소/실패' },
]

const makeReviewKey = ({ orderId, productId, color, size }) =>
  `${orderId}:${productId}:${color}:${size}`

function MyPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { clearCartItems, clearCheckout, getCheckoutItems } = useCart()
  const [orders, setOrders] = useState([])
  const [orphanPayments, setOrphanPayments] = useState([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [isLoadingOrphans, setIsLoadingOrphans] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [orphanActionId, setOrphanActionId] = useState(null)
  const [highlightOrders, setHighlightOrders] = useState(false)
  const [highlightOrphans, setHighlightOrphans] = useState(false)
  const [activeOrderTab, setActiveOrderTab] = useState('all')
  const [reviewedKeys, setReviewedKeys] = useState(new Set())
  const [reviewDraft, setReviewDraft] = useState(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewContent, setReviewContent] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const pendingOrder = useMemo(() => loadPendingOrder(user?.id), [user?.id])
  const orderStageCounts = useMemo(() => {
    const counts = {
      all: orders.length,
      received: 0,
      preparing: 0,
      shipped: 0,
      delivered: 0,
      failed: 0,
    }

    orders.forEach((order) => {
      if (order.status === 'pending' || order.status === 'paid') {
        counts.received += 1
      } else if (order.status === 'preparing') {
        counts.preparing += 1
      } else if (order.status === 'shipped') {
        counts.shipped += 1
      } else if (order.status === 'delivered') {
        counts.delivered += 1
      } else if (order.status === 'cancelled') {
        counts.failed += 1
      }
    })

    return counts
  }, [orders])

  const filteredOrders = useMemo(() => {
    if (activeOrderTab === 'all') {
      return orders
    }

    if (activeOrderTab === 'received') {
      return orders.filter((order) => order.status === 'pending' || order.status === 'paid')
    }

    if (activeOrderTab === 'failed') {
      return orders.filter((order) => order.status === 'cancelled')
    }

    return orders.filter((order) => order.status === activeOrderTab)
  }, [activeOrderTab, orders])

  useEffect(() => {
    fetchMyOrders()
      .then((data) => setOrders(data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setIsLoadingOrders(false))

    fetchOrphanPayments()
      .then((data) => setOrphanPayments(data.payments || []))
      .catch(() => setOrphanPayments([]))
      .finally(() => setIsLoadingOrphans(false))

    fetchMyReviews()
      .then((data) => {
        const keys = new Set((data.reviews || []).map((review) => review.key))
        setReviewedKeys(keys)
      })
      .catch(() => setReviewedKeys(new Set()))
  }, [])

  useEffect(() => {
    if (location.hash !== '#orders' || isLoadingOrders) {
      return
    }

    setHighlightOrders(true)

    const timer = window.setTimeout(() => {
      document.getElementById('orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)

    const clearTimer = window.setTimeout(() => setHighlightOrders(false), 2400)

    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(clearTimer)
    }
  }, [location.hash, isLoadingOrders])

  useEffect(() => {
    if (location.hash !== '#orphans' || isLoadingOrphans) {
      return
    }

    setHighlightOrphans(true)

    const timer = window.setTimeout(() => {
      document.getElementById('orphans')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)

    const clearTimer = window.setTimeout(() => setHighlightOrphans(false), 2400)

    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(clearTimer)
    }
  }, [location.hash, isLoadingOrphans])

  if (!user) {
    return null
  }

  const addresses = user.addresses?.filter(
    (address) => address.alias || address.baseAddress || address.postcode
  )

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('이 주문을 취소하고 결제를 환불할까요?')) {
      return
    }

    const cancelReason = window.prompt('취소 사유를 입력해 주세요.', '단순 변심')

    if (cancelReason === null) {
      return
    }

    setCancellingId(orderId)

    try {
      const data = await cancelOrder(orderId, cancelReason.trim() || '단순 변심')
      setOrders((prev) => prev.map((order) => (order.id === orderId ? data.order : order)))
      window.alert('주문이 취소되었고 결제 환불이 요청되었습니다.')
    } catch (error) {
      window.alert(error.message || '주문 취소에 실패했습니다.')
    } finally {
      setCancellingId(null)
    }
  }

  const refreshOrphans = () =>
    fetchOrphanPayments()
      .then((data) => setOrphanPayments(data.payments || []))
      .catch(() => setOrphanPayments([]))

  const handleRecoverOrphan = async (paymentId) => {
    if (!pendingOrder || pendingOrder.merchantUid !== paymentId) {
      window.alert('저장된 주문 정보가 없어 자동 복구할 수 없습니다. 결제 환불 후 다시 주문해 주세요.')
      return
    }

    if (!window.confirm('결제된 내역으로 주문을 등록할까요?')) {
      return
    }

    setOrphanActionId(paymentId)

    try {
      const result = await createOrder({
        items: pendingOrder.items,
        shippingAddressId: pendingOrder.shippingAddressId,
        deliveryMemo: pendingOrder.deliveryMemo,
        phone: pendingOrder.phone,
        couponType: pendingOrder.couponType,
        pointsUsed: pendingOrder.pointsUsed,
        impUid: pendingOrder.impUid,
        merchantUid: pendingOrder.merchantUid,
        paymentMethod: 'card',
      })

      const checkoutItems = getCheckoutItems()
      if (checkoutItems.length > 0) {
        clearCartItems(checkoutItems.map((item) => item.key))
      }
      clearCheckout()
      clearPendingOrder()
      navigate(`/order/complete/${result.order.id}`, { replace: true })
    } catch (error) {
      window.alert(error.message || '주문 등록에 실패했습니다.')
    } finally {
      setOrphanActionId(null)
    }
  }

  const handleRefundOrphan = async (paymentId, amount) => {
    if (!window.confirm(`${formatPrice(amount)}원 결제를 환불할까요?`)) {
      return
    }

    setOrphanActionId(paymentId)

    try {
      await refundOrphanPayment(paymentId, '주문 미생성 - 고객 환불 요청')
      if (pendingOrder?.merchantUid === paymentId) {
        clearPendingOrder()
      }
      await refreshOrphans()
      window.alert(
        'PG 취소(환불) 요청이 완료되었습니다.\n\n' +
          '· 테스트 결제(INIpayTest)는 실제 카드 청구·환불 문자가 오지 않습니다.\n' +
          '· 실결제 환불은 카드사에 따라 3~7영업일 걸릴 수 있으며, 환불 문자는 카드사마다 다릅니다.\n' +
          '· 포트원 관리자 콘솔에서 취소 내역을 확인할 수 있습니다.'
      )
    } catch (error) {
      window.alert(error.message || '결제 환불에 실패했습니다.')
    } finally {
      setOrphanActionId(null)
    }
  }

  const handleOpenReview = (order, item) => {
    setReviewDraft({
      orderId: order.id,
      orderNumber: order.orderNumber,
      item,
      key: makeReviewKey({
        orderId: order.id,
        productId: item.productId,
        color: item.color,
        size: item.size,
      }),
    })
    setReviewRating(5)
    setReviewContent('')
  }

  const handleSubmitReview = async () => {
    if (!reviewDraft) {
      return
    }

    setIsSubmittingReview(true)
    try {
      const data = await createReview({
        orderId: reviewDraft.orderId,
        productId: reviewDraft.item.productId,
        color: reviewDraft.item.color,
        size: reviewDraft.item.size,
        rating: reviewRating,
        content: reviewContent,
      })
      setReviewedKeys((prev) => new Set([...prev, data.review.key]))
      setReviewDraft(null)
      window.alert('리뷰가 등록되었습니다.')
    } catch (error) {
      window.alert(error.message || '리뷰 등록에 실패했습니다.')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  return (
    <main className="ofme__page-main">
      <div className="ofme__page-head">
        <h1>마이페이지</h1>
        <p>{user.name}님, Of Me.에서 즐거운 쇼핑 되세요.</p>
      </div>

      <section className="ofme__panel">
        <h2 className="ofme__panel-title">배송지</h2>
        {addresses?.length > 0 ? (
          <div className="ofme__address-list">
            {addresses.map((address, index) => (
              <div key={address._id || address.id || index} className="ofme__address-card">
                <div className="ofme__address-card-head">
                  <strong>{address.alias || `${index + 1}번 배송지`}</strong>
                  {address.isDefault && <span className="ofme__badge ofme__badge--mint">기본</span>}
                </div>
                <p>
                  [{address.postcode}] {address.baseAddress} {address.detailAddress}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="ofme__empty-text">등록된 배송지가 없습니다.</p>
        )}
      </section>

      <section
        id="orphans"
        className={`ofme__panel${highlightOrphans ? ' ofme__panel--orders-highlight' : ''}`}
        style={orphanPayments.length > 0 ? { borderColor: '#f0c4bf', background: '#fffaf9' } : undefined}
      >
        <div className="ofme__panel-head">
          <h2 className="ofme__panel-title">미처리 결제</h2>
          <span className="ofme__badge">{orphanPayments.length}건</span>
        </div>

        {isLoadingOrphans && <p className="ofme__empty-text">결제 내역을 확인하는 중...</p>}

        {!isLoadingOrphans && orphanPayments.length === 0 && (
          <p className="ofme__empty-text">미처리 결제가 없습니다.</p>
        )}

        <div className="ofme__order-list">
          {orphanPayments.map((payment) => {
            const canRecover = pendingOrder?.merchantUid === payment.paymentId

            return (
              <article key={payment.paymentId} className="ofme__order-card">
                <div className="ofme__order-card-head">
                  <div>
                    <div className="ofme__order-number">{payment.orderName || 'Of Me 주문'}</div>
                    <div className="ofme__order-meta">
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleString('ko-KR')
                        : '-'}
                    </div>
                    <div className="ofme__order-meta">결제 ID · {payment.paymentId}</div>
                  </div>
                  <span className="ofme__order-status ofme__order-status--pending">주문 미생성</span>
                </div>

                <div className="ofme__order-card-foot">
                  <span>결제만 완료된 건입니다</span>
                  <strong>{formatPrice(payment.amount)}원</strong>
                </div>

                <div className="ofme__complete-actions" style={{ marginTop: 12 }}>
                  {canRecover && (
                    <button
                      type="button"
                      className="ofme__btn-primary"
                      disabled={orphanActionId === payment.paymentId}
                      onClick={() => handleRecoverOrphan(payment.paymentId)}
                    >
                      {orphanActionId === payment.paymentId ? '처리 중...' : '주문 등록'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="ofme__btn-outline"
                    disabled={orphanActionId === payment.paymentId}
                    onClick={() => handleRefundOrphan(payment.paymentId, payment.amount)}
                  >
                    {orphanActionId === payment.paymentId ? '처리 중...' : '결제 환불'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section
        id="orders"
        className={`ofme__panel${highlightOrders ? ' ofme__panel--orders-highlight' : ''}`}
      >
        <div className="ofme__panel-head">
          <h2 className="ofme__panel-title">주문 내역</h2>
          <span className="ofme__badge">{filteredOrders.length}건</span>
        </div>
        <div className="ofme__order-stage-summary">
          <span>주문접수 {orderStageCounts.received}건</span>
          <span>상품준비 {orderStageCounts.preparing}건</span>
          <span>배송중 {orderStageCounts.shipped}건</span>
          <span>배송완료 {orderStageCounts.delivered}건</span>
          <span>취소/실패 {orderStageCounts.failed}건</span>
        </div>
        <div className="ofme__order-tabs">
          {ORDER_FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`ofme__order-tab${activeOrderTab === tab.key ? ' ofme__order-tab--active' : ''}`}
              onClick={() => setActiveOrderTab(tab.key)}
            >
              <span className="ofme__order-tab-count">{orderStageCounts[tab.key] ?? 0}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {isLoadingOrders && <p className="ofme__empty-text">주문 내역을 불러오는 중...</p>}

        {!isLoadingOrders && orders.length === 0 && (
          <p className="ofme__empty-text">아직 주문 내역이 없습니다.</p>
        )}

        {!isLoadingOrders && orders.length > 0 && filteredOrders.length === 0 && (
          <p className="ofme__empty-text">선택한 상태의 주문이 없습니다.</p>
        )}

        <div className="ofme__order-list">
          {filteredOrders.map((order) => (
            <article key={order.id} className="ofme__order-card">
              <div className="ofme__order-card-head">
                <div>
                  <div className="ofme__order-number">{order.orderNumber}</div>
                  <div className="ofme__order-meta">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString('ko-KR')
                      : '-'}
                  </div>
                </div>
                <span className={`ofme__order-status ${ORDER_STATUS_CLASS[order.status] || ''}`}>
                  {ORDER_STATUS_LABEL[order.status] || order.status}
                </span>
              </div>

              {order.shipping && (
                <div className="ofme__order-meta" style={{ marginBottom: 12 }}>
                  배송지 · [{order.shipping.postcode}] {order.shipping.baseAddress} {order.shipping.detailAddress}
                </div>
              )}

              <div className="ofme__order-items">
                {order.items.map((item, index) => (
                  <div key={`${order.id}-${index}`} className="ofme__order-item">
                    <div className="ofme__order-item-thumb">
                      {item.image ? (
                        <ProductImage src={item.image} fallback={item.image} alt={item.name} />
                      ) : (
                        item.brand.slice(0, 2)
                      )}
                    </div>
                    <div className="ofme__order-item-body">
                      <div className="ofme__order-item-brand">{item.brand}</div>
                      <div className="ofme__order-item-name">{item.name}</div>
                      <div className="ofme__order-item-option">
                        {COLOR_NAMES[item.color] || item.color} / {item.size} · {item.qty}개
                      </div>
                    </div>
                    <div className="ofme__order-item-price">{formatPrice(item.lineTotal ?? item.price * item.qty)}원</div>
                    {order.status === 'delivered' && (
                      <button
                        type="button"
                        className="ofme__table-btn"
                        style={{ marginLeft: 8 }}
                        disabled={reviewedKeys.has(
                          makeReviewKey({
                            orderId: order.id,
                            productId: item.productId,
                            color: item.color,
                            size: item.size,
                          })
                        )}
                        onClick={() => handleOpenReview(order, item)}
                      >
                        {reviewedKeys.has(
                          makeReviewKey({
                            orderId: order.id,
                            productId: item.productId,
                            color: item.color,
                            size: item.size,
                          })
                        )
                          ? '리뷰 완료'
                          : '리뷰 작성'}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {order.cancelReason && (
                <div className="ofme__order-meta" style={{ padding: '0 18px 12px', color: '#c0392b' }}>
                  취소 사유 · {order.cancelReason}
                </div>
              )}

              <div className="ofme__order-card-foot">
                <div>
                  <div>상품 {formatPrice(order.goodsAmount)}원</div>
                  <div>배송비 {order.shippingFee === 0 ? '무료' : `${formatPrice(order.shippingFee)}원`}</div>
                </div>
                <strong>{formatPrice(order.totalAmount)}원</strong>
              </div>

              {CANCELLABLE_STATUSES.includes(order.status) && (
                <button
                  type="button"
                  className="ofme__btn-outline"
                  style={{ marginTop: 12, width: '100%' }}
                  disabled={cancellingId === order.id}
                  onClick={() => handleCancelOrder(order.id)}
                >
                  {cancellingId === order.id ? '환불 처리 중...' : '주문 취소 · 환불'}
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      {reviewDraft && (
        <div className="ofme-modal__overlay" onClick={() => setReviewDraft(null)}>
          <section className="ofme-modal" onClick={(event) => event.stopPropagation()}>
            <h3 className="ofme-modal__title">리뷰 작성</h3>
            <p className="ofme-modal__message">
              {reviewDraft.orderNumber} · {reviewDraft.item.name}
            </p>
            <label style={{ display: 'block', textAlign: 'left', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>별점</span>
              <select
                value={reviewRating}
                onChange={(event) => setReviewRating(Number(event.target.value))}
                className="ofme__role-select"
                style={{ width: '100%', marginTop: 6 }}
              >
                {[5, 4, 3, 2, 1].map((score) => (
                  <option key={score} value={score}>
                    {score}점
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'block', textAlign: 'left', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>리뷰 내용</span>
              <textarea
                value={reviewContent}
                onChange={(event) => setReviewContent(event.target.value)}
                rows={4}
                placeholder="상품은 어떠셨나요?"
                style={{
                  width: '100%',
                  marginTop: 6,
                  border: '1px solid #ece8df',
                  borderRadius: 10,
                  padding: 10,
                  fontFamily: 'inherit',
                }}
              />
            </label>
            <button
              type="button"
              className="ofme-modal__button"
              disabled={isSubmittingReview}
              onClick={handleSubmitReview}
            >
              {isSubmittingReview ? '등록 중...' : '리뷰 등록'}
            </button>
          </section>
        </div>
      )}

      <div className="ofme__page-actions">
        <Link to="/" className="ofme__btn-outline ofme__btn-inline">
          쇼핑 계속하기
        </Link>
        <Link to="/cart" className="ofme__btn-primary ofme__btn-inline">
          장바구니 보기
        </Link>
      </div>
    </main>
  )
}

export default MyPage
