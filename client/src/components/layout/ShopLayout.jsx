import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { CATEGORIES, SHOP_NAME } from '@/data/ofMeCatalog'
import { isAdmin, isSeller } from '@/utils/roles'
import '@/styles/ofme.css'

function Header() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { cartCount, toastMessage } = useCart()
  const { user, isLoading } = useAuth()
  const activeCategory = searchParams.get('cat') || '전체'
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    if (!isUserMenuOpen) {
      return
    }

    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [isUserMenuOpen])

  return (
    <>
      <header className="ofme__header">
        <div className="ofme__header-top">
          <Link to="/" className="ofme__logo">
            {SHOP_NAME}
            <span className="ofme__logo-dot">.</span>
          </Link>
          <div className="ofme__search">
            <span style={{ opacity: 0.4, fontSize: 16 }}>⌕</span>
            <input placeholder="여름 신상, 브랜드를 검색해보세요" />
          </div>
          <div className="ofme__icons">
            <span className="ofme__icons-muted ofme__wish-link">♡ 찜</span>
            {user && (
              <Link to="/cart" className="ofme__cart-link">
                <span className="ofme__cart-icon">🛒</span> 장바구니
                {cartCount > 0 && <span className="ofme__cart-badge">{cartCount}</span>}
              </Link>
            )}
            {!isLoading && user ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div className="ofme__user-menu" ref={userMenuRef}>
                  <button
                    type="button"
                    className="ofme__user-menu-trigger"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  >
                    <span className="ofme__user-greeting">
                      <span className="ofme__user-name">{user.name}</span>
                      <span className="ofme__user-greeting-suffix">님 반갑습니다</span>
                    </span>
                    <span className="ofme__user-menu-caret">▾</span>
                  </button>
                  {isUserMenuOpen && (
                    <div className="ofme__user-menu-dropdown">
                      <Link to="/my-info" onClick={() => setIsUserMenuOpen(false)}>
                        내 정보
                      </Link>
                      <Link to="/mypage#orders" onClick={() => setIsUserMenuOpen(false)}>
                        주문내역
                      </Link>
                      <Link to="/my-reviews" onClick={() => setIsUserMenuOpen(false)}>
                        내 리뷰
                      </Link>
                      <Link to="/logout" onClick={() => setIsUserMenuOpen(false)}>
                        로그아웃
                      </Link>
                    </div>
                  )}
                </div>
                {isSeller(user) && (
                  <Link to="/seller" className="ofme__seller-link">
                    상품관리
                  </Link>
                )}
                {isAdmin(user) && (
                  <Link to="/admin" className="ofme__admin-link">
                    어드민
                  </Link>
                )}
              </span>
            ) : (
              !isLoading && (
                <>
                  <Link to="/login" className="ofme__icons-muted">
                    로그인
                  </Link>
                  <Link to="/signup" className="ofme__icons-muted">
                    회원가입
                  </Link>
                </>
              )
            )}
          </div>
        </div>
        <div className="ofme__cats">
          {CATEGORIES.map((name) => {
            const isActive = activeCategory === name
            const to = name === '전체' ? '/' : `/?cat=${encodeURIComponent(name)}`

            return (
              <button
                key={name}
                type="button"
                className={`ofme__cat-btn${isActive ? ' ofme__cat-btn--active' : ''}`}
                onClick={() => navigate(to)}
              >
                {name}
              </button>
            )
          })}
        </div>
      </header>
      {toastMessage && <div className="ofme__toast">{toastMessage}</div>}
    </>
  )
}

function Footer() {
  return (
    <footer className="ofme__footer">
      <div className="ofme__footer-logo">
        {SHOP_NAME}
        <span className="ofme__logo-dot">.</span>
      </div>
      <div style={{ marginTop: 8 }}>
        여성 패션 쇼핑몰 · 가상 데모 · 모델/상품 이미지는 일러스트 플레이스홀더입니다
      </div>
    </footer>
  )
}

function ShopLayout() {
  return (
    <div className="ofme">
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}

export default ShopLayout
