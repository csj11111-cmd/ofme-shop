import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '@/components/product/ProductCard'
import { fetchProducts } from '@/api/products'
import { SORT_OPTIONS, filterAndSortProducts } from '@/data/ofMeCatalog'

function HomePage() {
  const [searchParams] = useSearchParams()
  const [sort, setSort] = useState('인기순')
  const [hoverId, setHoverId] = useState(null)
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const category = searchParams.get('cat') || '전체'

  useEffect(() => {
    setIsLoading(true)
    setLoadError('')

    fetchProducts()
      .then((data) => setProducts(data.products || []))
      .catch(() => {
        setProducts([])
        setLoadError('상품 목록을 불러오지 못했습니다.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, category, sort),
    [products, category, sort]
  )

  return (
    <main className="ofme__main">
      <div className="ofme__hero">
        <div className="ofme__hero-inner">
          <div className="ofme__hero-kicker">SUMMER FIZZ 2026</div>
          <h1 className="ofme__hero-title">
            시원하게 떠나는
            <br />
            여름 데일리룩
          </h1>
          <p className="ofme__hero-desc">
            전 상품 최대 50% + 첫 구매 쿠폰 15% · 5만원 이상 무료배송
          </p>
        </div>
      </div>

      <div className="ofme__toolbar">
        <div className="ofme__count">
          <b style={{ color: '#2c2c30' }}>{filteredProducts.length}</b>개의 여름 상품
        </div>
        <div className="ofme__sorts">
          {SORT_OPTIONS.map((name) => (
            <button
              key={name}
              type="button"
              className={`ofme__sort-btn${sort === name ? ' ofme__sort-btn--active' : ''}`}
              onClick={() => setSort(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="ofme__cart-empty" style={{ padding: '48px 0' }}>
          <p>상품 목록을 불러오는 중...</p>
        </div>
      )}

      {!isLoading && loadError && (
        <div className="ofme__cart-empty" style={{ padding: '48px 0' }}>
          <p>{loadError}</p>
        </div>
      )}

      {!isLoading && !loadError && filteredProducts.length === 0 && (
        <div className="ofme__cart-empty" style={{ padding: '48px 0' }}>
          <p>등록된 상품이 없습니다.</p>
        </div>
      )}

      {!isLoading && !loadError && filteredProducts.length > 0 && (
        <div className="ofme__grid">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isHovered={hoverId === product.id}
              onEnter={() => setHoverId(product.id)}
              onLeave={() => setHoverId(null)}
            />
          ))}
        </div>
      )}
    </main>
  )
}

export default HomePage
