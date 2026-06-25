import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProductImage from '@/components/product/ProductImage'
import { fetchProductById } from '@/api/products'
import {
  COLOR_NAMES,
  DESCRIPTIONS,
  FABRIC,
  FIT,
  SIZE_CHARTS,
  SIZE_CLASS,
  formatPrice,
  getDiscountRate,
} from '@/data/ofMeCatalog'
import { useCart } from '@/context/CartContext'
import { bgFor, hex } from '@/utils/ofMeVisuals'
import { getProductCode } from '@/utils/productId'
import {
  getRegisteredDetailImageSrc,
  getRegisteredImageSrc,
  getRegisteredPhotoSrc,
  hasRegisteredImages,
} from '@/utils/registeredProductImages'
import { fetchProductReviews } from '@/api/reviews'

const SIZES = ['S', 'M', 'L']

const THUMBS = [
  { key: 'model', label: 'MODEL' },
  { key: 'coordi', label: 'STYLING' },
  { key: 'flat', label: 'PRODUCT' },
]

function ProductDetailView({ product, reviews }) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [color, setColor] = useState(null)
  const [size, setSize] = useState(null)
  const [qty, setQty] = useState(1)
  const [detailImg, setDetailImg] = useState('model')
  const [detailHover, setDetailHover] = useState(false)

  useEffect(() => {
    setColor(null)
    setSize(null)
    setQty(1)
    setDetailImg('model')
    setDetailHover(false)
  }, [product.id])

  const primaryColor = product.colors[0]
  const discount = getDiscountRate(product.price, product.orig)
  const description = product.description || DESCRIPTIONS[product.g] || '등록 상품입니다.'
  const fabric = product.fabric || FABRIC[product.g] || '-'
  const fit = product.fit || FIT[product.g] || '-'
  const chart = SIZE_CHARTS[SIZE_CLASS[product.g]]
  const hasImages = hasRegisteredImages(product)
  const activeColor = color || primaryColor
  const mainSrc = getRegisteredDetailImageSrc(product, {
    color: activeColor,
    detailImg: detailImg === 'model' ? 'primary' : detailImg,
    detailHover: detailImg === 'model' && detailHover && activeColor === primaryColor,
  })
  const fallback = getRegisteredImageSrc(product, 'primary')

  const getThumbKey = (key) => {
    if (key === 'coordi') return 'coordi'
    if (key === 'flat') return 'flat'
    return 'primary'
  }

  const handleAddToCart = (buyNow = false) => {
    if (!color) {
      window.alert('색상을 선택해 주세요.')
      return
    }

    if (!size) {
      window.alert('사이즈를 선택해 주세요.')
      return
    }

    const next = addToCart({
      id: product.id,
      color,
      size,
      qty,
      buyNow,
      name: product.name,
      brand: product.brand,
      price: product.price,
      orig: product.orig,
      imagePrimary: getRegisteredPhotoSrc(product, color, primaryColor) || product.images?.primary || null,
    })

    if (next === 'login') {
      navigate('/login')
      return
    }

    if (next === 'checkout') {
      navigate('/checkout')
      return
    }
  }

  return (
    <main className="ofme__detail-main">
      <div className="ofme__breadcrumb">
        <Link to="/">← 목록</Link> &nbsp;·&nbsp; 전체 &gt; {product.cat}
      </div>

      <div className="ofme__detail-grid">
        <div className="ofme__detail-media">
          <div
            className={`ofme__detail-image${hasImages ? '' : ' ofme__detail-image--registered'}`}
            style={{
              background: hasImages
                ? bgFor({ colors: color ? [color, product.colors[1] || color] : product.colors })
                : color
                  ? `linear-gradient(155deg, ${hex(color)}, #fff)`
                  : bgFor(product),
            }}
            onMouseEnter={() => setDetailHover(true)}
            onMouseLeave={() => setDetailHover(false)}
          >
            {hasImages ? (
              <ProductImage src={mainSrc} fallback={fallback} alt={product.name} />
            ) : (
              <span className="ofme__detail-registered-label">{product.brand}</span>
            )}
          </div>
          {hasImages && (
            <div style={{ display: 'flex', gap: 9, marginTop: 11 }}>
              {THUMBS.map((thumb, index) => {
                const src = getRegisteredDetailImageSrc(product, { detailImg: getThumbKey(thumb.key) })

                return (
                  <button
                    key={thumb.key}
                    type="button"
                    onClick={() => setDetailImg(thumb.key)}
                    style={{ flex: 1, cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}
                  >
                    <div
                      style={{
                        aspectRatio: '1/1',
                        borderRadius: 12,
                        overflow: 'hidden',
                        background: bgFor(product),
                        border: `2px solid ${detailImg === thumb.key ? '#ff6f61' : 'transparent'}`,
                        position: 'relative',
                      }}
                    >
                      <ProductImage src={src} fallback={fallback} alt={thumb.label} />
                      <span
                        style={{
                          position: 'absolute',
                          top: 7,
                          left: 7,
                          background: 'rgba(20,20,22,.5)',
                          color: '#fff',
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: 0.5,
                          padding: '2px 6px',
                          borderRadius: 20,
                        }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div
                      style={{
                        textAlign: 'center',
                        fontSize: 9.5,
                        letterSpacing: 1.5,
                        marginTop: 6,
                        fontWeight: 800,
                        color: detailImg === thumb.key ? '#ff6f61' : '#b5b0a6',
                      }}
                    >
                      {thumb.label}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="ofme__detail-info">
          <div className="ofme__detail-brand">{product.brand}</div>
          <h1 className="ofme__detail-name">{product.name}</h1>
          <div className="ofme__product-code">상품 ID · {getProductCode(product)}</div>
          {product.sellerName && (
            <div style={{ fontSize: 12.5, color: '#8a8579', marginBottom: 14 }}>
              판매자 · {product.sellerName}
            </div>
          )}
          <div className="ofme__detail-price-row">
            {discount > 0 && <span className="ofme__detail-discount">{discount}%</span>}
            <span className="ofme__detail-price">{formatPrice(product.price)}원</span>
            {product.orig && <span className="ofme__detail-orig">{formatPrice(product.orig)}원</span>}
          </div>

          <div style={{ padding: '18px 0 4px' }}>
            <div className="ofme__color-row">
              <span style={{ fontWeight: 800 }}>색상</span>
              <span style={{ color: color ? '#6a655c' : '#ff6f61' }}>
                {color ? COLOR_NAMES[color] || color : '선택해 주세요'}
              </span>
            </div>
            <div className="ofme__colors">
              {product.colors.map((colorKey) => (
                <button
                  key={colorKey}
                  type="button"
                  className={`ofme__color-dot${colorKey === color ? ' ofme__color-dot--active' : ''}`}
                  title={COLOR_NAMES[colorKey]}
                  aria-label={COLOR_NAMES[colorKey]}
                  aria-pressed={colorKey === color}
                  style={{
                    background: hex(colorKey),
                    outline: `2.5px solid ${colorKey === color ? '#ff6f61' : 'transparent'}`,
                  }}
                  onClick={() => {
                    setColor(colorKey)
                    setDetailImg('model')
                    setDetailHover(false)
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ padding: '20px 0 6px' }}>
            <div className="ofme__option-title">
              사이즈
              {!size && <span style={{ marginLeft: 8, fontSize: 12, color: '#ff6f61', fontWeight: 600 }}>선택해 주세요</span>}
            </div>
            <div className="ofme__sizes">
              {SIZES.map((sizeLabel) => (
                <button
                  key={sizeLabel}
                  type="button"
                  className={`ofme__size-btn${size === sizeLabel ? ' ofme__size-btn--active' : ''}`}
                  onClick={() => setSize(sizeLabel)}
                >
                  {sizeLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="ofme__qty-row">
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>수량</span>
            <div className="ofme__qty-control">
              <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))}>
                −
              </button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((value) => value + 1)}>
                +
              </button>
            </div>
          </div>

          <div className="ofme__total-row">
            <span style={{ fontSize: 14, fontWeight: 700 }}>총 상품금액</span>
            <span className="ofme__total-amount">{formatPrice(product.price * qty)}원</span>
          </div>

          <div className="ofme__actions">
            <button type="button" className="ofme__btn-outline" onClick={() => handleAddToCart(false)}>
              장바구니 담기
            </button>
            <button type="button" className="ofme__btn-primary" onClick={() => handleAddToCart(true)}>
              바로 구매
            </button>
          </div>
        </div>
      </div>

      <section className="ofme__section">
        <div className="ofme__section-title">상품 정보</div>
        <div className="ofme__desc-box">{description}</div>
      </section>

      {chart && (
        <section className="ofme__section">
          <div className="ofme__section-title">
            사이즈 안내 <span style={{ fontSize: 12, color: '#8a8579', fontWeight: 500 }}>(단위: cm)</span>
          </div>
          <div style={{ overflowX: 'auto', border: '1px solid #ece8df', borderRadius: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 380 }}>
              <thead>
                <tr style={{ background: '#faf8f3' }}>
                  <th style={{ padding: '13px 14px', textAlign: 'left' }}>사이즈</th>
                  {chart.cols.map((col) => (
                    <th key={col} style={{ padding: '13px 14px', textAlign: 'center' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIZES.map((sizeLabel) => (
                  <tr key={sizeLabel} style={{ borderTop: '1px solid #f0ece3' }}>
                    <td style={{ padding: '13px 14px', fontWeight: 800 }}>{sizeLabel}</td>
                    {chart.rows[sizeLabel].map((value, index) => (
                      <td key={index} style={{ padding: '13px 14px', textAlign: 'center' }}>
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="ofme__section" style={{ marginBottom: 30 }}>
        <div className="ofme__section-title">소재 &amp; 관리방법</div>
        <div className="ofme__desc-box">
          소재: {fabric} · 핏: {fit}
        </div>
      </section>

      <section className="ofme__section" style={{ marginBottom: 30 }}>
        <div className="ofme__section-title">리뷰 ({reviews.length})</div>
        {reviews.length === 0 ? (
          <div className="ofme__desc-box">아직 등록된 리뷰가 없습니다.</div>
        ) : (
          <div className="ofme__order-list">
            {reviews.map((review) => (
              <article key={review.id} className="ofme__order-card">
                <div className="ofme__order-card-head">
                  <div>
                    <div className="ofme__order-number">
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </div>
                    <div className="ofme__order-meta">
                      {review.userName} · {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <span className="ofme__order-status ofme__order-status--paid">
                    {COLOR_NAMES[review.color] || review.color} / {review.size}
                  </span>
                </div>
                <div className="ofme__order-items">
                  <p style={{ margin: 0, lineHeight: 1.6 }}>{review.content}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    setNotFound(false)

    Promise.all([fetchProductById(id), fetchProductReviews(id)])
      .then(([productData, reviewData]) => {
        setProduct(productData.product)
        setReviews(reviewData.reviews || [])
        setNotFound(false)
      })
      .catch(() => {
        setProduct(null)
        setReviews([])
        setNotFound(true)
      })
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <main className="ofme__detail-main">
        <div className="ofme__cart-empty">
          <p>상품 정보를 불러오는 중...</p>
        </div>
      </main>
    )
  }

  if (notFound || !product) {
    return (
      <main className="ofme__detail-main">
        <div className="ofme__cart-empty">
          <p>상품을 찾을 수 없습니다.</p>
          <Link to="/" className="ofme__btn-primary" style={{ display: 'inline-block', marginTop: 20 }}>
            홈으로
          </Link>
        </div>
      </main>
    )
  }

  return <ProductDetailView product={product} reviews={reviews} />
}

export default ProductDetailPage
