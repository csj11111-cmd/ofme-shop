import { apiFetch } from '@/api/client'

export function fetchProducts() {
  return apiFetch('/products')
}

export function fetchProductById(id) {
  return apiFetch(`/products/${id}`)
}

export function fetchMyProducts() {
  return apiFetch('/products/mine')
}

export function createProduct(payload) {
  return apiFetch('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProduct(id, payload) {
  return apiFetch(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteProduct(id) {
  return apiFetch(`/products/${id}`, {
    method: 'DELETE',
  })
}
