import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  clearAuthSession,
  fetchMe,
  getAuthUser,
  getToken,
  getTokenExpiresIn,
  saveAuthSession,
} from '@/api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getAuthUser())
  const [isLoading, setIsLoading] = useState(Boolean(getToken()))

  const refreshUser = useCallback(async () => {
    const token = getToken()

    if (!token) {
      setUser(null)
      setIsLoading(false)
      return null
    }

    setIsLoading(true)

    try {
      const data = await fetchMe()

      if (data.user) {
        setUser(data.user)
        saveAuthSession({
          token,
          user: data.user,
          expiresIn: data.expiresIn,
        })
        return data.user
      }
    } catch {
      clearAuthSession()
      setUser(null)
    } finally {
      setIsLoading(false)
    }

    return null
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = useCallback((session) => {
    saveAuthSession(session)
    setUser(session.user)
  }, [])

  const updateSessionUser = useCallback((nextUser) => {
    const token = getToken()
    const expiresIn = getTokenExpiresIn()
    if (token && nextUser) {
      saveAuthSession({ token, user: nextUser, expiresIn })
    }
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    clearAuthSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isLoggedIn: Boolean(user),
      login,
      logout,
      updateSessionUser,
      refreshUser,
    }),
    [user, isLoading, login, logout, updateSessionUser, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
