import { apiFetch } from '@/api/client'

export function fetchMyReviews() {
  return apiFetch('/reviews/mine')
}

export function fetchProductReviews(productId) {
  return apiFetch(`/reviews/product/${productId}`)
}

export function createReview(payload) {
  return apiFetch('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
