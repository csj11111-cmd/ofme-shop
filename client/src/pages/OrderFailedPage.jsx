import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createOrder, refundOrphanPayment } from '@/api/orders'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { formatPrice } from '@/data/ofMeCatalog'
import { clearPendingOrder, loadPendingOrder } from '@/utils/pendingOrderStorage'

const FAILURE_PRESETS = {
  cancelled: {
    title: '결제가 취소되었습니다',
    description: '결제를 완료하지 않아 주문이 접수되지 않았습니다.',
    hint: '장바구니에 담긴 상품은 그대로 보관되어 있어요.',
  },
  payment: {
    title: '결제에 실패했습니다',
    description: '결제가 정상적으로 처리되지 않아 주문이 생성되지 않았습니다.',
    hint: '카드 정보와 결제 한도를 확인한 뒤 다시 시도해 주세요.',
  },
  order: {
    title: '주문 등록에 실패했습니다',
    description: '결제는 완료되었으나 주문 정보를 저장하지 못했습니다.',
    hint: '아래에서 주문을 다시 등록하거나 결제를 환불받을 수 있습니다.',
  },
  default: {
    title: '주문을 완료하지 못했습니다',
    description: '주문 처리 중 문제가 발생했습니다.',
    hint: '장바구니는 그대로 유지됩니다. 잠시 후 다시 시도해 주세요.',
  },
}

function OrderFailedPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { clearCartItems, clearCheckout, getCheckoutItems } = useCart()
  const state = location.state || {}

  const [isRecovering, setIsRecovering] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)
  const [actionError, setActionError] = useState('')

  const pendingOrder = useMemo(() => loadPendingOrder(user?.id), [user?.id])
  const merchantUid = state.merchantUid || pendingOrder?.merchantUid || ''
  const canRecover = Boolean(
    pendingOrder?.merchantUid &&
      (!merchantUid || pendingOrder.merchantUid === merchantUid) &&
      pendingOrder.items?.length > 0
  )
  const canRefund = Boolean(merchantUid)

  useEffect(() => {
    if (state.reason === 'order' && !merchantUid) {
      navigate('/mypage#orphans', { replace: true })
    }
  }, [state.reason, merchantUid, navigate])

  const preset = FAILURE_PRESETS[state.reason] || FAILURE_PRESETS.default
  const detailMessage = state.message?.trim()

  const handleRecoverOrder = async () => {
    if (!pendingOrder) {
      return
    }

    setIsRecovering(true)
    setActionError('')

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

      if (!result?.order?.id) {
        throw new Error('주문 생성에 실패했습니다.')
      }

      const checkoutItems = getCheckoutItems()
      if (checkoutItems.length > 0) {
        clearCartItems(checkoutItems.map((item) => item.key))
      }
      clearCheckout()
      clearPendingOrder()
      navigate(`/order/complete/${result.order.id}`, { replace: true })
    } catch (error) {
      setActionError(error.message || '주문 등록에 실패했습니다.')
    } finally {
      setIsRecovering(false)
    }
  }

  const handleRefundPayment = async () => {
    if (!merchantUid) {
      return
    }

    if (!window.confirm('결제를 환불할까요? 주문은 생성되지 않습니다.')) {
      return
    }

    setIsRefunding(true)
    setActionError('')

    try {
      await refundOrphanPayment(merchantUid, '주문 미생성 - 고객 환불 요청')
      clearPendingOrder()
      window.alert(
        'PG 취소(환불) 요청이 완료되었습니다.\n\n' +
          '· 테스트 결제(INIpayTest)는 실제 카드 청구·환불 문자가 오지 않습니다.\n' +
          '· 실결제 환불은 카드사에 따라 3~7영업일 걸릴 수 있으며, 환불 문자는 카드사마다 다릅니다.'
      )
      navigate('/mypage', { replace: true })
    } catch (error) {
      setActionError(error.message || '결제 환불에 실패했습니다.')
    } finally {
      setIsRefunding(false)
    }
  }

  if (!location.state) {
    return (
      <main className="ofme__complete-main">
        <section className="ofme__failed-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p className="ofme__complete-sub">잘못된 접근입니다.</p>
          <div className="ofme__complete-actions ofme__complete-actions--single" style={{ maxWidth: 280, margin: '24px auto 0' }}>
            <Link to="/mypage#orphans" className="ofme__btn-primary">
              마이페이지로 이동
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="ofme__complete-main">
      <section className="ofme__failed-hero">
        <div className="ofme__failed-icon">!</div>
        <h1 className="ofme__complete-title">{preset.title}</h1>
        <p className="ofme__complete-sub">
          {preset.description}
          {detailMessage && detailMessage !== preset.description && (
            <>
              <br />
              <span style={{ color: '#c0392b', fontWeight: 600 }}>{detailMessage}</span>
            </>
          )}
        </p>
        {state.total > 0 && (
          <div className="ofme__complete-order-no">
            결제 시도 금액 <span>{formatPrice(state.total)}원</span>
            {state.itemCount > 0 && ` · ${state.itemCount}개 상품`}
          </div>
        )}
        {merchantUid && (
          <div className="ofme__complete-order-no" style={{ marginTop: 8 }}>
            결제 ID <span>{merchantUid}</span>
          </div>
        )}
      </section>

      <section className="ofme__failed-panel">
        <h2 className="ofme__complete-panel-title">안내</h2>
        <ul className="ofme__failed-list">
          <li>{preset.hint}</li>
          <li>주문이 생성되지 않았으며, 장바구니 상품은 삭제되지 않습니다.</li>
          {state.reason === 'order' && (
            <li>결제는 이미 완료된 상태일 수 있습니다. 중복 결제 없이 아래에서 처리해 주세요.</li>
          )}
        </ul>

        {actionError && (
          <p style={{ margin: '0 0 14px', color: '#c0392b', fontSize: 13.5, fontWeight: 600 }}>
            {actionError}
          </p>
        )}

        {state.reason === 'order' && (canRecover || canRefund) && (
          <div className="ofme__complete-actions" style={{ marginTop: 4 }}>
            {canRecover && (
              <button
                type="button"
                className="ofme__btn-primary"
                disabled={isRecovering || isRefunding}
                onClick={handleRecoverOrder}
              >
                {isRecovering ? '주문 등록 중...' : '주문 완료 처리'}
              </button>
            )}
            {canRefund && (
              <button
                type="button"
                className="ofme__btn-outline"
                disabled={isRecovering || isRefunding}
                onClick={handleRefundPayment}
              >
                {isRefunding ? '환불 처리 중...' : '결제 환불'}
              </button>
            )}
          </div>
        )}

        <div className="ofme__complete-actions" style={{ marginTop: state.reason === 'order' ? 10 : 4 }}>
          <Link to="/cart" className="ofme__btn-primary">
            장바구니로 돌아가기
          </Link>
          <button
            type="button"
            className="ofme__btn-outline"
            onClick={() => navigate('/checkout', { replace: true })}
          >
            다시 결제하기
          </button>
        </div>

        <div className="ofme__complete-actions ofme__complete-actions--single" style={{ marginTop: 10 }}>
          <Link to="/mypage#orphans" className="ofme__btn-outline">
            미처리 결제 확인
          </Link>
        </div>

        <p className="ofme__complete-note">
          문제가 반복되면 마이페이지의 미처리 결제에서 환불하거나 고객센터로 문의해 주세요.
        </p>
      </section>
    </main>
  )
}

export default OrderFailedPage
