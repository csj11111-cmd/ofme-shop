import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProductImage from '@/components/product/ProductImage'
import { COLOR_NAMES, formatPrice } from '@/data/ofMeCatalog'
import { useCart } from '@/context/CartContext'
import { bgFor, hex } from '@/utils/ofMeVisuals'
import { calculateCartSummary } from '@/utils/cartSummary'

function CartPage() {
  const navigate = useNavigate()
  const {
    cart,
    cartCount,
    selected,
    coupon,
    points,
    changeQty,
    removeItem,
    toggleSelected,
    selectAll,
    removeSelected,
    showToast,
    prepareCheckout,
  } = useCart()

  const selectedItems = useMemo(
    () => cart.filter((item) => selected[item.key]),
    [cart, selected]
  )
  const selectedSummary = useMemo(
    () => calculateCartSummary(selectedItems, coupon, points),
    [selectedItems, coupon, points]
  )

  const allSelected = cart.length > 0 && cart.every((item) => selected[item.key])

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      showToast('주문할 상품을 선택해 주세요')
      return
    }

    prepareCheckout(selectedItems.map((item) => item.key))
    navigate('/checkout')
  }

  if (cart.length === 0) {
    return (
      <main className="ofme__cart-main">
        <div className="ofme__cart-empty">
          <div style={{ fontSize: 46, marginBottom: 14 }}>🛍</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>장바구니가 비었어요</div>
          <div style={{ fontSize: 13.5, color: '#8a8579', marginBottom: 22 }}>
            여름 신상을 둘러보고 마음에 드는 옷을 담아보세요
          </div>
          <Link to="/" className="ofme__btn-primary" style={{ display: 'inline-block', padding: '14px 28px' }}>
            쇼핑 계속하기
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="ofme__cart-main">
      <h1 className="ofme__cart-title">
        장바구니 <span>{cartCount}</span>
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 4px', fontSize: 13 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700 }}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => selectAll(event.target.checked)}
            style={{ width: 17, height: 17, accentColor: '#ff6f61' }}
          />
          전체 선택
        </label>
        <button
          type="button"
          onClick={removeSelected}
          style={{
            border: '1px solid #e2ddd2',
            background: '#fff',
            padding: '7px 13px',
            borderRadius: 9,
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: '#6a655c',
          }}
        >
          선택삭제
        </button>
      </div>

      <div className="ofme__cart-items">
        {cart.map((item) => (
          <div key={item.key} className="ofme__cart-item">
            <input
              type="checkbox"
              checked={Boolean(selected[item.key])}
              onChange={() => toggleSelected(item.key)}
              style={{ width: 17, height: 17, accentColor: '#ff6f61', flex: 'none' }}
            />
            <div
              className="ofme__cart-thumb"
              style={{
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
                옵션: {COLOR_NAMES[item.color] || item.color} / {item.size}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 }}>
                <div className="ofme__qty-control">
                  <button type="button" onClick={() => changeQty(item.key, -1)}>
                    −
                  </button>
                  <span>{item.qty}</span>
                  <button type="button" onClick={() => changeQty(item.key, 1)}>
                    +
                  </button>
                </div>
                <span style={{ fontWeight: 900, fontSize: 15 }}>{formatPrice(item.price * item.qty)}원</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.key)}
              style={{
                flex: 'none',
                alignSelf: 'flex-start',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 18,
                color: '#c5c0b6',
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="ofme__summary-box">
        <div className="ofme__summary-line">
          <span>선택 상품금액</span>
          <span style={{ fontWeight: 700 }}>{formatPrice(selectedSummary.goods)}원</span>
        </div>
        <div className="ofme__summary-line">
          <span>배송비</span>
          <span style={{ fontWeight: 700 }}>
            {selectedSummary.shipping === 0 ? '무료' : `${formatPrice(selectedSummary.shipping)}원`}
          </span>
        </div>
        <div className="ofme__summary-total">
          <span style={{ fontSize: 15, fontWeight: 800 }}>결제 예정 금액</span>
          <span>{formatPrice(selectedSummary.total)}원</span>
        </div>
        <button
          type="button"
          className="ofme__btn-primary"
          style={{ width: '100%', marginTop: 18, padding: 17, fontSize: 16 }}
          disabled={selectedItems.length === 0}
          onClick={handleCheckout}
        >
          {selectedItems.length === 0
            ? '상품을 선택해 주세요'
            : `${formatPrice(selectedSummary.total)}원 결제하기`}
        </button>
      </div>
    </main>
  )
}

export default CartPage
