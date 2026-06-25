import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { loginUser } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { SHOP_NAME } from '@/data/ofMeCatalog'
import '@/styles/ofme.css'

function LoginPage() {
  const navigate = useNavigate()
  const { login, user, isLoading } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.email.trim() || !form.password) {
      setError('이메일과 비밀번호를 입력해 주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const data = await loginUser(form)

      if (!data.token) {
        setError('토큰 발급에 실패했습니다. 다시 시도해 주세요.')
        return
      }

      login({
        token: data.token,
        user: data.user,
        expiresIn: data.expiresIn,
      })

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('rememberMe')
      }

      navigate('/', { replace: true })
    } catch (loginError) {
      setError(loginError.message || '로그인에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return null
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="ofme-auth">
      <main className="ofme-auth__main">
        <div className="ofme-auth__brand">
          <Link to="/" className="ofme-auth__logo">
            {SHOP_NAME}
            <span className="ofme-auth__logo-dot">.</span>
          </Link>
          <p className="ofme-auth__slogan">나로부터 시작되는 모든 무드 — 오롯이 나를 입다</p>
        </div>

        <form className="ofme-auth__form" onSubmit={handleSubmit}>
          <div className="ofme-auth__field">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@fizz.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="ofme-auth__field">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="ofme-auth__error">{error}</p>}

          <div className="ofme-auth__options">
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#ff6f61' }}
              />
              로그인 상태 유지
            </label>
            <span style={{ cursor: 'pointer' }}>아이디 · 비밀번호 찾기</span>
          </div>

          <button type="submit" className="ofme-auth__submit" disabled={isSubmitting}>
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="ofme-auth__divider">
          <span />
          SNS 간편 로그인
          <span />
        </div>

        <div className="ofme-auth__social">
          <button type="button" className="ofme-auth__social-kakao">
            카카오로 시작하기
          </button>
          <button type="button" className="ofme-auth__social-naver">
            네이버로 시작하기
          </button>
          <button type="button" className="ofme-auth__social-google">
            Google로 시작하기
          </button>
        </div>

        <p className="ofme-auth__guide">
          아직 회원이 아니신가요? <Link to="/signup">회원가입</Link>
        </p>

        <footer className="ofme__footer" style={{ marginTop: 40, borderTop: 'none' }}>
          <div className="ofme__footer-logo">
            {SHOP_NAME}
            <span className="ofme__logo-dot">.</span>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default LoginPage
