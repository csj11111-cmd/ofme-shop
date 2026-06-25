import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProductImage from '@/components/product/ProductImage'
import { formatPrice, getDiscountRate, getTagBg } from '@/data/ofMeCatalog'
import { bgFor, hex } from '@/utils/ofMeVisuals'
import { IMAGE_FIELDS } from '@/utils/productForm'
import { getCardFocal } from '@/utils/productImages'
import { getRegisteredCardImages, hasRegisteredImages } from '@/utils/registeredProductImages'

function ProductPreviewCard({ product }) {
  const [isHovered, setIsHovered] = useState(false)
  const discount = getDiscountRate(product.price, product.orig)
  const hasImages = hasRegisteredImages(product)
  const { primary, walk } = getRegisteredCardImages(product)
  const focal = getCardFocal(product.g)
  const uploadedCount = IMAGE_FIELDS.filter(({ key }) => product.images?.[key]).length

  return (
    <div className="ofme__preview-card">
      <div
        className="ofme__card ofme__card--preview"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="ofme__card-thumb"
          style={{
            background: hasImages ? bgFor(product) : `linear-gradient(155deg, ${hex(product.colors[0])}, #fff)`,
          }}
        >
          {hasImages ? (
            <>
              <div className="ofme__card-layer" style={{ opacity: isHovered && walk !== primary ? 0 : 1 }}>
                <ProductImage src={primary} fallback={primary} alt={product.name} focal={focal} />
              </div>
              {walk && walk !== primary && (
                <div
                  className="ofme__card-layer ofme__card-layer--walk"
                  style={{ opacity: isHovered ? 1 : 0 }}
                >
                  <ProductImage src={walk} fallback={primary} alt={`${product.name} 호버`} loading="eager" />
                </div>
              )}
            </>
          ) : (
            <div className="ofme__card-registered-label">{product.brand}</div>
          )}
          {product.tag && (
            <span className="ofme__card-tag" style={{ background: getTagBg(product.tag) }}>
              {product.tag}
            </span>
          )}
        </div>
        <div className="ofme__card-body">
          <div className="ofme__card-brand">{product.brand}</div>
          <div className="ofme__card-name">{product.name}</div>
          <div className="ofme__card-price">
            {discount > 0 && <span className="ofme__card-discount">{discount}%</span>}
            <span className="ofme__card-amount">{formatPrice(product.price)}원</span>
          </div>
        </div>
      </div>

      <div className="ofme__preview-strip">
        <div className="ofme__preview-strip-head">
          <strong>이미지 미리보기</strong>
          <span>{uploadedCount}/{IMAGE_FIELDS.length}</span>
        </div>
        <div className="ofme__preview-strip-grid">
          {IMAGE_FIELDS.map((field) => {
            const src = product.images?.[field.key]

            return (
              <div key={field.key} className={`ofme__preview-thumb${src ? ' ofme__preview-thumb--filled' : ''}`}>
                <div className="ofme__preview-thumb-image">
                  {src ? (
                    <img src={src} alt={`${field.label} 미리보기`} />
                  ) : (
                    <span>없음</span>
                  )}
                </div>
                <span>{field.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="ofme__preview-note">
        {product.id === 'preview'
          ? 'Cloudinary 업로드 즉시 미리보기가 갱신됩니다.'
          : '등록된 상품 미리보기'}
      </p>
      {product.id !== 'preview' && (
        <Link to={`/product/${product.id}`} className="ofme__text-link ofme__preview-link">
          상품 페이지 보기
        </Link>
      )}
    </div>
  )
}

export default ProductPreviewCard
