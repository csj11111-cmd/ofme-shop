import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ImageUploadField from '@/components/seller/ImageUploadField'
import CloudinarySetupNotice from '@/components/seller/CloudinarySetupNotice'
import ProductPreviewCard from '@/components/seller/ProductPreviewCard'
import ProductImage from '@/components/product/ProductImage'
import { useAuth } from '@/context/AuthContext'
import {
  CATEGORIES,
  COLOR_NAMES,
  PALETTE,
  SIZE_CHARTS,
  SIZE_CLASS,
  formatPrice,
} from '@/data/ofMeCatalog'
import { isAdmin } from '@/utils/roles'
import {
  createProduct,
  deleteProduct,
  fetchMyProducts,
  updateProduct,
} from '@/api/products'
import { getProductCode } from '@/utils/productId'
import {
  GARMENT_OPTIONS,
  IMAGE_FIELDS,
  TAG_OPTIONS,
  applyGarmentType,
  buildPreviewProduct,
  createInitialForm,
  formToPayload,
  productToForm,
} from '@/utils/productForm'
import { getRegisteredImageSrc, hasRegisteredImages } from '@/utils/registeredProductImages'
import { getCardFocal } from '@/utils/productImages'

const COLOR_OPTIONS = Object.keys(PALETTE)

function SellerPage() {
  const { user } = useAuth()
  const [form, setForm] = useState(createInitialForm)
  const [editingId, setEditingId] = useState(null)
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const previewProduct = useMemo(
    () => buildPreviewProduct(form, products.find((product) => product.id === editingId)),
    [form, editingId, products]
  )

  const loadProducts = () => {
    setIsLoading(true)
    fetchMyProducts()
      .then((data) => setProducts(data.products || []))
      .catch((fetchError) => setError(fetchError.message))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const resetForm = () => {
    setForm(createInitialForm())
    setEditingId(null)
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setError('')
    setSuccess('')
  }

  const handleGarmentChange = (event) => {
    setForm((prev) => applyGarmentType(prev, event.target.value))
    setError('')
    setSuccess('')
  }

  const toggleColor = (colorKey) => {
    setForm((prev) => {
      const exists = prev.colors.includes(colorKey)
      const colors = exists
        ? prev.colors.filter((color) => color !== colorKey)
        : [...prev.colors, colorKey].slice(0, 4)

      return { ...prev, colors: colors.length > 0 ? colors : prev.colors }
    })
  }

  const handleImageChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      images: { ...prev.images, [key]: value },
    }))
  }

  const handleEdit = (product) => {
    setEditingId(product.id)
    setForm(productToForm(product))
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name.trim() || !form.brand.trim() || !form.price) {
      setError('상품명, 브랜드, 판매가는 필수입니다.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = formToPayload(form)

      if (editingId) {
        await updateProduct(editingId, payload)
        setSuccess('상품이 수정되었습니다.')
      } else {
        await createProduct(payload)
        setSuccess('상품이 등록되었습니다.')
      }

      resetForm()
      loadProducts()
    } catch (submitError) {
      setError(submitError.message || '저장에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('이 상품을 삭제할까요?')) {
      return
    }

    try {
      await deleteProduct(productId)
      if (editingId === productId) {
        resetForm()
      }
      loadProducts()
      setSuccess('상품이 삭제되었습니다.')
    } catch (deleteError) {
      setError(deleteError.message || '상품 삭제에 실패했습니다.')
    }
  }

  return (
    <main className="ofme__page-main ofme__page-main--wide ofme__seller-page">
      <div className="ofme__page-head">
        <h1>상품 관리</h1>
        <p>게시된 상품과 동일하게 이미지, 태그, 소재, 핏, 사이즈 정보까지 등록할 수 있습니다.</p>
      </div>

      <div className="ofme__seller-layout">
        <section className="ofme__panel ofme__seller-form-panel">
          <div className="ofme__panel-toolbar">
            <h2 className="ofme__panel-title">{editingId ? '상품 수정' : '상품 등록'}</h2>
            {editingId && (
              <button type="button" className="ofme__table-btn" onClick={resetForm}>
                새 등록
              </button>
            )}
          </div>

          <form className="ofme__seller-form" onSubmit={handleSubmit}>
            <div className="ofme__form-section">
              <h3>기본 정보</h3>
              <div className="ofme-auth__field">
                <label htmlFor="name">상품명</label>
                <input id="name" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="ofme-auth__field">
                <label htmlFor="brand">브랜드</label>
                <input id="brand" name="brand" value={form.brand} onChange={handleChange} required />
              </div>
              <div className="ofme-auth__row">
                <div className="ofme-auth__field">
                  <label htmlFor="g">상품 유형</label>
                  <select id="g" name="g" value={form.g} onChange={handleGarmentChange}>
                    {GARMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ofme-auth__field">
                  <label htmlFor="cat">카테고리</label>
                  <select id="cat" name="cat" value={form.cat} onChange={handleChange}>
                    {CATEGORIES.filter((cat) => cat !== '전체').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="ofme__form-section">
              <h3>가격 · 태그</h3>
              <div className="ofme-auth__row">
                <div className="ofme-auth__field">
                  <label htmlFor="price">판매가</label>
                  <input id="price" name="price" type="number" min="0" value={form.price} onChange={handleChange} required />
                </div>
                <div className="ofme-auth__field">
                  <label htmlFor="orig">정가 (선택)</label>
                  <input id="orig" name="orig" type="number" min="0" value={form.orig} onChange={handleChange} />
                </div>
              </div>
              <div className="ofme-auth__field">
                <label htmlFor="tag">태그</label>
                <select id="tag" name="tag" value={form.tag} onChange={handleChange}>
                  <option value="">없음</option>
                  {TAG_OPTIONS.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ofme__form-section">
              <h3>색상 (1~4개)</h3>
              <div className="ofme__colors">
                {COLOR_OPTIONS.map((colorKey) => (
                  <button
                    key={colorKey}
                    type="button"
                    className="ofme__color-dot"
                    title={COLOR_NAMES[colorKey]}
                    style={{
                      background: PALETTE[colorKey],
                      outline: `2.5px solid ${form.colors.includes(colorKey) ? '#ff6f61' : 'transparent'}`,
                    }}
                    onClick={() => toggleColor(colorKey)}
                  />
                ))}
              </div>
            </div>

            <div className="ofme__form-section">
              <h3>상품 이미지</h3>
              <CloudinarySetupNotice />
              <p className="ofme__form-help">
                Cloudinary 위젯으로 MODEL / WALK / STYLING / PRODUCT 이미지를 업로드하세요. 업로드하면 오른쪽 미리보기에 바로 반영됩니다.
              </p>
              <div className="ofme__image-grid">
                {IMAGE_FIELDS.map((field) => (
                  <ImageUploadField
                    key={field.key}
                    fieldKey={field.key}
                    label={field.label}
                    hint={field.hint}
                    value={form.images[field.key]}
                    onChange={(value) => handleImageChange(field.key, value)}
                  />
                ))}
              </div>
            </div>

            <div className="ofme__form-section">
              <h3>상세 정보</h3>
              <div className="ofme-auth__field">
                <label htmlFor="description">상품 설명</label>
                <textarea id="description" name="description" rows={4} value={form.description} onChange={handleChange} />
              </div>
              <div className="ofme-auth__row">
                <div className="ofme-auth__field">
                  <label htmlFor="fabric">소재</label>
                  <input id="fabric" name="fabric" value={form.fabric} onChange={handleChange} />
                </div>
                <div className="ofme-auth__field">
                  <label htmlFor="fit">핏</label>
                  <input id="fit" name="fit" value={form.fit} onChange={handleChange} />
                </div>
              </div>
              {SIZE_CHARTS[SIZE_CLASS[form.g]] && (
                <div className="ofme__size-preview">
                  <strong>사이즈 안내 ({form.g})</strong>
                  <p>상품 유형에 맞는 사이즈표가 상세 페이지에 자동 표시됩니다.</p>
                </div>
              )}
            </div>

            {editingId && (
              <div className="ofme__form-section">
                <h3>판매 설정</h3>
                <label className="ofme-signup__default-option">
                  <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                  쇼핑몰에 노출 (체크 해제 시 숨김)
                </label>
              </div>
            )}

            {error && <p className="ofme-auth__error">{error}</p>}
            {success && <p className="ofme__success-text">{success}</p>}

            <button type="submit" className="ofme-auth__submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : editingId ? '상품 수정하기' : '상품 등록하기'}
            </button>
          </form>
        </section>

        <aside className="ofme__seller-side">
          <section className="ofme__panel">
            <h2 className="ofme__panel-title">미리보기</h2>
            <ProductPreviewCard product={previewProduct} />
          </section>

          <section className="ofme__panel">
            <div className="ofme__panel-toolbar">
              <h2 className="ofme__panel-title">
                {isAdmin(user) ? '전체 등록 상품' : '내 등록 상품'} ({products.length})
              </h2>
              {isAdmin(user) && (
                <Link to="/admin" className="ofme__text-link">
                  어드민
                </Link>
              )}
            </div>

            {isLoading && <p className="ofme__empty-text">불러오는 중...</p>}
            {!isLoading && products.length === 0 && (
              <p className="ofme__empty-text">등록된 상품이 없습니다.</p>
            )}

            <div className="ofme__seller-list">
              {products.map((product) => {
                const thumb = getRegisteredImageSrc(product, 'primary')
                const focal = getCardFocal(product.g)

                return (
                  <div
                    key={product.id}
                    className={`ofme__seller-item${editingId === product.id ? ' ofme__seller-item--active' : ''}`}
                  >
                    <div
                      className="ofme__seller-thumb"
                      style={{
                        background: hasRegisteredImages(product)
                          ? undefined
                          : `linear-gradient(155deg, ${PALETTE[product.colors[0]] || '#ff6f61'}, #fff)`,
                      }}
                    >
                      {hasRegisteredImages(product) ? (
                        <ProductImage src={thumb} fallback={thumb} alt={product.name} focal={focal} />
                      ) : (
                        <span>{product.brand}</span>
                      )}
                    </div>
                    <div className="ofme__seller-item-body">
                      <div className="ofme__seller-item-brand">{product.brand}</div>
                      <div className="ofme__seller-item-name">{product.name}</div>
                      <div className="ofme__product-code">상품 ID · {getProductCode(product)}</div>
                      <div className="ofme__seller-item-meta">
                        {product.cat} · {formatPrice(product.price)}원
                        {!product.isActive && ' · 숨김'}
                        {isAdmin(user) && product.sellerName && ` · ${product.sellerName}`}
                      </div>
                      <div className="ofme__seller-item-actions">
                        <button type="button" onClick={() => handleEdit(product)}>
                          수정
                        </button>
                        <Link to={`/product/${product.id}`} className="ofme__text-link">
                          보기
                        </Link>
                        <button type="button" onClick={() => handleDelete(product.id)}>
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}

export default SellerPage
