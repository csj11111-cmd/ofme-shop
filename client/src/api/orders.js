import { apiFetch } from '@/api/client'

export function createOrder(payload) {
  return apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchMyOrders() {
  return apiFetch('/orders/mine')
}

export function fetchOrderById(id) {
  return apiFetch(`/orders/${id}`)
}

export function fetchOrders() {
  return apiFetch('/orders')
}

export function cancelOrder(id, cancelReason) {
  return apiFetch(`/orders/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ cancelReason }),
  })
}

export function fetchOrphanPayments() {
  return apiFetch('/orders/orphans')
}

export function refundOrphanPayment(merchantUid, cancelReason) {
  return apiFetch('/orders/refund-orphan', {
    method: 'POST',
    body: JSON.stringify({ merchantUid, cancelReason }),
  })
}

export function updateOrderStatus(id, status, cancelReason) {
  return apiFetch(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, cancelReason }),
  })
}

export const ORDER_STATUSES = ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled']

export const ORDER_STATUS_LABEL = {
  pending: '결제대기',
  paid: '결제완료',
  preparing: '상품준비',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '취소',
}

export const ORDER_STATUS_CLASS = {
  pending: 'ofme__order-status--pending',
  paid: 'ofme__order-status--paid',
  preparing: 'ofme__order-status--preparing',
  shipped: 'ofme__order-status--shipped',
  delivered: 'ofme__order-status--delivered',
  cancelled: 'ofme__order-status--cancelled',
}
