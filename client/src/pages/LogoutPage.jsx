import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

function LogoutPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  return (
    <main className="ofme__page-main">
      <p className="ofme__empty-text">로그아웃 처리 중...</p>
    </main>
  )
}

export default LogoutPage
