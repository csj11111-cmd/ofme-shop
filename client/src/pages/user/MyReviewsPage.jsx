import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMyReviews } from '@/api/reviews'
import { COLOR_NAMES } from '@/data/ofMeCatalog'

function renderStars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

function MyReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMyReviews()
      .then((data) => setReviews(data.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <main className="ofme__page-main">
      <div className="ofme__page-head">
        <h1>내 리뷰</h1>
        <p>작성한 리뷰를 한 곳에서 확인할 수 있어요.</p>
      </div>

      <section className="ofme__panel">
        {isLoading && <p className="ofme__empty-text">리뷰를 불러오는 중...</p>}
        {!isLoading && reviews.length === 0 && <p className="ofme__empty-text">아직 작성한 리뷰가 없습니다.</p>}

        <div className="ofme__order-list">
          {reviews.map((review) => (
            <article key={review.id} className="ofme__order-card">
              <div className="ofme__order-card-head">
                <div>
                  <div className="ofme__order-number">{renderStars(review.rating)}</div>
                  <div className="ofme__order-meta">
                    {new Date(review.createdAt).toLocaleString('ko-KR')}
                  </div>
                </div>
                <Link to={`/product/${review.productId}`} className="ofme__text-link">
                  상품 보기
                </Link>
              </div>
              <div className="ofme__order-items">
                <div className="ofme__order-item-option">
                  옵션 · {COLOR_NAMES[review.color] || review.color} / {review.size}
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{review.content}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default MyReviewsPage
