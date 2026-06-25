import { apiFetch } from '@/api/client'

export function fetchUsers() {
  return apiFetch('/users')
}

export function updateUser(id, payload) {
  return apiFetch(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteUser(id) {
  return apiFetch(`/users/${id}`, {
    method: 'DELETE',
  })
}
