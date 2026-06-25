import { apiFetch } from '@/api/client'

export function fetchAdminDashboard() {
  return apiFetch('/admin/dashboard')
}
