import { apiFetch } from '@/api/client'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'
const TOKEN_EXPIRES_IN_KEY = 'tokenExpiresIn'

export function registerUser(signupData) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(signupData),
  })
}

export function loginUser(credentials) {
  return apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email.trim(),
      password: credentials.password,
    }),
  })
}

export function fetchMe() {
  return apiFetch('/auth/me')
}

export function updateMe(payload) {
  return apiFetch('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function saveAuthSession({ token, user, expiresIn }) {
  if (!token) {
    throw new Error('토큰이 발급되지 않았습니다.')
  }

  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))

  if (expiresIn) {
    localStorage.setItem(TOKEN_EXPIRES_IN_KEY, expiresIn)
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getAuthUser() {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export function getTokenExpiresIn() {
  return localStorage.getItem(TOKEN_EXPIRES_IN_KEY)
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_EXPIRES_IN_KEY)
}

export function isLoggedIn() {
  return Boolean(getToken())
}
