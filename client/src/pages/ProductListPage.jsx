import { Link, useParams } from 'react-router-dom'
import ProductCard from '@/components/product/ProductCard'
import { CATEGORIES, PRODUCTS } from '@/data/products'

function ProductListPage() {
  const { category = 'all' } = useParams()
  const activeCategory = CATEGORIES[category] ? category : 'all'
  const items =
    activeCategory === 'all'
      ? PRODUCTS
      : PRODUCTS.filter((product) => product.cat === activeCategory)

  return (
    <section className="wrap">
      <div className="sec-head">
        <h2>{CATEGORIES[activeCategory]}</h2>
        <span>{items.length}개 상품</span>
      </div>
      <div className="cats">
        {Object.entries(CATEGORIES).map(([key, label]) => (
          <Link
            key={key}
            to={`/products/${key}`}
            className={key === activeCategory ? 'on' : ''}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="grid">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

export default ProductListPage
