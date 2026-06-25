import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductImage from '@/components/product/ProductImage'
import { fetchAdminDashboard } from '@/api/admin'
import {
  ORDER_STATUS_CLASS,
  ORDER_STATUS_LABEL,
  ORDER_STATUSES,
  fetchOrders,
  updateOrderStatus,
} from '@/api/orders'
import { deleteUser, fetchUsers, updateUser } from '@/api/users'
import { useAuth } from '@/context/AuthContext'
import { COLOR_NAMES, formatPrice } from '@/data/ofMeCatalog'
import { getRoleLabel } from '@/utils/roles'

const ROLE_OPTIONS = ['customer', 'seller', 'admin']

const QUICK_ACTIONS = [
  { label: '상품 관리', desc: '등록·수정·삭제', to: '/seller', icon: '📦' },
  { label: '주문 관리', desc: '주문 목록 확인', href: '#admin-orders', icon: '🧾' },
  { label: '회원 관리', desc: '역할 변경·삭제', href: '#admin-users', icon: '👥' },
  { label: '쇼핑몰 보기', desc: '스토어 화면 확인', to: '/', icon: '🛍' },
]

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function AdminPage() {
  const { user: currentUser } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  const loadDashboard = useCallback(() => {
    setIsLoading(true)
    setError('')

    Promise.all([fetchAdminDashboard(), fetchOrders(), fetchUsers()])
      .then(([dashboardData, ordersData, usersData]) => {
        setDashboard(dashboardData)
        setOrders(ordersData.orders || [])
        setUsers(usersData.users || [])
      })
      .catch((fetchError) => {
        setError(fetchError.message || '대시보드 정보를 불러오지 못했습니다.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const stats = dashboard?.stats || {
    users: 0,
    products: 0,
    orders: 0,
    pendingOrders: 0,
    revenue: 0,
    todayOrders: 0,
    todayRevenue: 0,
  }

  const userStats = useMemo(() => ({
    customer: users.filter((user) => user.userType === 'customer').length,
    seller: users.filter((user) => user.userType === 'seller').length,
    admin: users.filter((user) => user.userType === 'admin').length,
  }), [users])

  const handleRoleChange = async (userId, userType) => {
    setError('')
    setSuccess('')
    setUpdatingUserId(userId)

    try {
      await updateUser(userId, { userType })
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, userType } : user))
      )
      setSuccess('회원 역할이 변경되었습니다.')
    } catch (updateError) {
      setError(updateError.message || '역할 변경에 실패했습니다.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (userId === currentUser?.id) {
      setError('본인 계정은 삭제할 수 없습니다.')
      return
    }

    if (!window.confirm(`${userName} 회원을 삭제할까요?`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await deleteUser(userId)
      setUsers((prev) => prev.filter((user) => user.id !== userId))
      setDashboard((prev) =>
        prev
          ? {
              ...prev,
              stats: {
                ...prev.stats,
                users: Math.max(0, prev.stats.users - 1),
              },
            }
          : prev
      )
      setSuccess('회원이 삭제되었습니다.')
    } catch (deleteError) {
      setError(deleteError.message || '회원 삭제에 실패했습니다.')
    }
  }

  const handleOrderStatusChange = async (orderId, status) => {
    let cancelReason = ''
    if (status === 'cancelled') {
      const input = window.prompt('취소 사유를 입력해 주세요.', '재고 부족')
      if (input === null) {
        return
      }
      cancelReason = input.trim() || '관리자 취소'
    }

    setError('')
    setSuccess('')
    setUpdatingOrderId(orderId)

    try {
      const data = await updateOrderStatus(orderId, status, cancelReason)
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? data.order : order))
      )
      setSuccess('주문 상태가 변경되었습니다.')
      loadDashboard()
    } catch (statusError) {
      setError(statusError.message || '주문 상태 변경에 실패했습니다.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  return (
    <main className="ofme__page-main ofme__page-main--wide ofme__admin-page">
      <div className="ofme__admin-hero">
        <div>
          <p className="ofme__admin-kicker">ADMIN DASHBOARD</p>
          <h1>운영 대시보드</h1>
          <p>{currentUser?.name}님, Of Me. 쇼핑몰 현황을 한눈에 확인하세요.</p>
        </div>
        <button type="button" className="ofme__admin-refresh" onClick={loadDashboard}>
          새로고침
        </button>
      </div>

      {error && <p className="ofme-auth__error">{error}</p>}
      {success && <p className="ofme__success-text">{success}</p>}

      <div className="ofme__stat-grid ofme__stat-grid--dashboard">
        <div className="ofme__stat-card ofme__stat-card--accent">
          <span>총 주문</span>
          <strong>{isLoading ? '—' : stats.orders.toLocaleString()}</strong>
          <em>오늘 {stats.todayOrders}건</em>
        </div>
        <div className="ofme__stat-card ofme__stat-card--revenue">
          <span>총 매출</span>
          <strong>{isLoading ? '—' : `${formatPrice(stats.revenue)}원`}</strong>
          <em>오늘 {formatPrice(stats.todayRevenue)}원</em>
        </div>
        <div className="ofme__stat-card">
          <span>회원 수</span>
          <strong>{isLoading ? '—' : stats.users.toLocaleString()}</strong>
          <em>판매자 {userStats.seller} · 관리자 {userStats.admin}</em>
        </div>
        <div className="ofme__stat-card">
          <span>등록 상품</span>
          <strong>{isLoading ? '—' : stats.products.toLocaleString()}</strong>
          <em>등록된 활성 상품</em>
        </div>
        <div className="ofme__stat-card ofme__stat-card--warn">
          <span>처리 대기</span>
          <strong>{isLoading ? '—' : stats.pendingOrders.toLocaleString()}</strong>
          <em>결제·준비·배송 전</em>
        </div>
        <div className="ofme__stat-card">
          <span>고객 회원</span>
          <strong>{isLoading ? '—' : userStats.customer.toLocaleString()}</strong>
          <em>일반 구매 고객</em>
        </div>
      </div>

      <section className="ofme__panel ofme__admin-quick">
        <h2 className="ofme__panel-title">빠른 작업</h2>
        <div className="ofme__quick-grid">
          {QUICK_ACTIONS.map((action) =>
            action.to ? (
              <Link key={action.label} to={action.to} className="ofme__quick-card">
                <span className="ofme__quick-icon">{action.icon}</span>
                <strong>{action.label}</strong>
                <span>{action.desc}</span>
              </Link>
            ) : (
              <button
                key={action.label}
                type="button"
                className="ofme__quick-card"
                onClick={() => scrollToSection(action.href.replace('#', ''))}
              >
                <span className="ofme__quick-icon">{action.icon}</span>
                <strong>{action.label}</strong>
                <span>{action.desc}</span>
              </button>
            )
          )}
        </div>
      </section>

      <section id="admin-orders" className="ofme__panel">
        <div className="ofme__panel-toolbar">
          <div>
            <h2 className="ofme__panel-title">최근 주문</h2>
            <p className="ofme__panel-subtitle">고객이 주문한 상품 내역을 확인하고 상태를 관리합니다.</p>
          </div>
          <span className="ofme__badge">{orders.length}건</span>
        </div>

        {isLoading && <p className="ofme__empty-text">불러오는 중...</p>}

        {!isLoading && orders.length === 0 && (
          <div className="ofme__admin-empty">
            <span>🧾</span>
            <p>아직 접수된 주문이 없습니다.</p>
            <span>장바구니에서 주문하면 이곳에 표시됩니다.</span>
          </div>
        )}

        <div className="ofme__order-list">
          {orders.map((order) => (
            <article key={order.id} className="ofme__order-card">
              <div className="ofme__order-card-head">
                <div>
                  <div className="ofme__order-number">{order.orderNumber}</div>
                  <div className="ofme__order-meta">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString('ko-KR')
                      : '-'}
                  </div>
                  <div className="ofme__admin-order-customer">
                    <span>{order.customerName || order.customer?.name || '고객'}</span>
                    <span>{order.customerEmail || order.customer?.email || '-'}</span>
                    <span>{order.customer?.phone || order.shipping?.phone || '-'}</span>
                  </div>
                </div>
                <div className="ofme__order-head-actions">
                  <span className={`ofme__order-status ${ORDER_STATUS_CLASS[order.status] || ''}`}>
                    {ORDER_STATUS_LABEL[order.status] || order.status}
                  </span>
                  <select
                    className="ofme__role-select"
                    value={order.status}
                    disabled={updatingOrderId === order.id}
                    onChange={(event) => handleOrderStatusChange(order.id, event.target.value)}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ofme__order-items">
                {order.items.map((item, index) => (
                  <div key={`${order.id}-${index}`} className="ofme__order-item">
                    <div className="ofme__order-item-thumb">
                      {item.image ? (
                        <ProductImage src={item.image} fallback={item.image} alt={item.name} />
                      ) : (
                        item.brand.slice(0, 2)
                      )}
                    </div>
                    <div className="ofme__order-item-body">
                      <div className="ofme__order-item-brand">{item.brand}</div>
                      <div className="ofme__order-item-name">{item.name}</div>
                      <div className="ofme__order-item-option">
                        {COLOR_NAMES[item.color] || item.color} / {item.size} · {item.qty}개
                      </div>
                    </div>
                    <div className="ofme__order-item-price">
                      {formatPrice(item.lineTotal ?? item.price * item.qty)}원
                    </div>
                  </div>
                ))}
              </div>

              {order.shipping && (
                <div className="ofme__order-meta" style={{ padding: '0 18px 12px' }}>
                  배송 · [{order.shipping.postcode}] {order.shipping.baseAddress} {order.shipping.detailAddress}
                </div>
              )}

              {order.cancelReason && (
                <div className="ofme__order-meta" style={{ padding: '0 18px 12px', color: '#c0392b' }}>
                  취소 사유 · {order.cancelReason}
                </div>
              )}

              <div className="ofme__order-card-foot">
                <span>결제완료 · {order.itemCount ?? order.items.length}종</span>
                <strong>{formatPrice(order.totalAmount)}원</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="admin-users" className="ofme__panel">
        <div className="ofme__panel-toolbar">
          <div>
            <h2 className="ofme__panel-title">회원 관리</h2>
            <p className="ofme__panel-subtitle">회원 역할 변경 및 계정 관리</p>
          </div>
          <Link to="/seller" className="ofme__text-link">
            상품 관리
          </Link>
        </div>

        {!isLoading && (
          <div className="ofme__table-wrap">
            <table className="ofme__table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>역할</th>
                  <th>가입일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className="ofme__role-select"
                        value={user.userType}
                        disabled={updatingUserId === user.id}
                        onChange={(event) => handleRoleChange(user.id, event.target.value)}
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {getRoleLabel(role)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</td>
                    <td>
                      <button
                        type="button"
                        className="ofme__table-btn"
                        disabled={user.id === currentUser?.id}
                        onClick={() => handleDeleteUser(user.id, user.name)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminPage
