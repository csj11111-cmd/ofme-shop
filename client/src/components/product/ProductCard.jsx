import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProductImage from '@/components/product/ProductImage'
import { formatPrice, getDiscountRate, getTagBg } from '@/data/ofMeCatalog'
import { bgFor, hex } from '@/utils/ofMeVisuals'
import { getCardFocal } from '@/utils/productImages'
import { getRegisteredCardImages, hasRegisteredImages } from '@/utils/registeredProductImages'

function preloadImage(src) {
  if (!src) return
  const img = new Image()
  img.src = src
}

function ProductCard({ product, isHovered, onEnter, onLeave }) {
  const discount = getDiscountRate(product.price, product.orig)
  const hasImages = hasRegisteredImages(product)
  const { primary, walk, coordi } = getRegisteredCardImages(product)
  const hoverSrc = walk || coordi || primary
  const focal = getCardFocal(product.g)

  useEffect(() => {
    if (hasImages) {
      preloadImage(primary)
      preloadImage(hoverSrc)
    }
  }, [hasImages, primary, hoverSrc])

  const handleEnter = () => {
    if (hasImages) {
      preloadImage(hoverSrc)
    }
    onEnter()
  }

  if (!hasImages) {
    return (
      <Link
        to={`/product/${product.id}`}
        className="ofme__card"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <div
          className="ofme__card-thumb"
          style={{
            background: `linear-gradient(155deg, ${hex(product.colors[0])}, #fff)`,
          }}
        >
          <div className="ofme__card-registered-label">{product.brand}</div>
          {product.tag && (
            <span className="ofme__card-tag" style={{ background: getTagBg(product.tag) }}>
              {product.tag}
            </span>
          )}
          <span className="ofme__card-like">♡</span>
        </div>
        <div className="ofme__card-body">
          <div className="ofme__card-brand">{product.brand}</div>
          <div className="ofme__card-name">{product.name}</div>
          <div className="ofme__card-price">
            {discount > 0 && <span className="ofme__card-discount">{discount}%</span>}
            <span className="ofme__card-amount">{formatPrice(product.price)}원</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/product/${product.id}`}
      className="ofme__card"
      onMouseEnter={handleEnter}
      onMouseLeave={onLeave}
    >
      <div className="ofme__card-thumb" style={{ background: bgFor(product) }}>
        <div className="ofme__card-layer" style={{ opacity: isHovered ? 0 : 1 }}>
          <ProductImage src={primary} fallback={primary} alt={product.name} focal={focal} />
        </div>
        <div
          className="ofme__card-layer ofme__card-layer--walk"
          style={{ opacity: isHovered ? 1 : 0 }}
          aria-hidden={!isHovered}
        >
          <ProductImage src={hoverSrc} fallback={primary} alt={`${product.name} 스타일링`} loading="eager" />
        </div>
        {product.tag && (
          <span className="ofme__card-tag" style={{ background: getTagBg(product.tag) }}>
            {product.tag}
          </span>
        )}
        <span className="ofme__card-like">♡</span>
      </div>
      <div className="ofme__card-body">
        <div className="ofme__card-brand">{product.brand}</div>
        <div className="ofme__card-name">{product.name}</div>
        <div className="ofme__card-price">
          {discount > 0 && <span className="ofme__card-discount">{discount}%</span>}
          <span className="ofme__card-amount">{formatPrice(product.price)}원</span>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
