import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearAuthSession, getAuthUser, getTokenExpiresIn, isLoggedIn } from '@/api/auth'
import './MainPage.css'

function MainPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(() => (isLoggedIn() ? getAuthUser() : null))
  const tokenExpiresIn = getTokenExpiresIn()
  const [successMessage, setSuccessMessage] = useState(() => {
    if (location.state?.loginSuccess) {
      return `${location.state.userName}님, 로그인되었습니다.`
    }

    return ''
  })

  const handleLogout = () => {
    clearAuthSession()
    setUser(null)
    setSuccessMessage('')
  }

  const dismissSuccessMessage = () => {
    setSuccessMessage('')
    navigate('/', { replace: true, state: null })
  }

  return (
    <div className="main">
      <header className="main__header">
        <h1 className="main__logo">Shopping Mall</h1>
        <nav className="main__nav">
          {user ? (
            <>
              <span className="main__user-name">{user.name}님</span>
              <button type="button" className="main__logout-button" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="main__login-link">
                로그인
              </Link>
              <Link to="/signup" className="main__signup-link">
                회원가입
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="main__hero">
        <p className="main__eyebrow">Welcome</p>
        <h2>쇼핑몰에 오신 것을 환영합니다</h2>
        <p className="main__description">
          다양한 상품을 둘러보고, 계정을 만들어 더 많은 기능을 이용해 보세요.
        </p>

        {successMessage && (
          <div className="main__success-banner">
            <p>{successMessage}</p>
            <button type="button" onClick={dismissSuccessMessage}>
              닫기
            </button>
          </div>
        )}

        {!user && (
          <div className="main__actions">
            <Link to="/login" className="main__cta">
              로그인
            </Link>
            <Link to="/signup" className="main__cta main__cta--secondary">
              회원가입
            </Link>
          </div>
        )}

        {user && (
          <div className="main__welcome-card">
            <p>{user.name}님, 환영합니다.</p>
            <p className="main__welcome-email">{user.email}</p>
            <p className="main__welcome-type">회원 유형: {user.userType}</p>
            {tokenExpiresIn && (
              <p className="main__welcome-token">토큰 유효기간: {tokenExpiresIn}</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default MainPage
