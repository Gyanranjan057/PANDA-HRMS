import { apiRequest, getAuthToken } from './api'

const SESSION_KEY = 'panda_session'
const AUTH_KEYS = [SESSION_KEY, 'token', 'user', 'userInfo', 'role', 'email']

export const loginWithBackend = async (identifier, password, rememberMe = true) => {
  try {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    })
    const storage = rememberMe ? localStorage : sessionStorage
    const otherStorage = rememberMe ? sessionStorage : localStorage
    const session = { token: result.token, user: result.user }

    storage.setItem(SESSION_KEY, JSON.stringify(session))
    storage.setItem('token', result.token)
    storage.setItem('user', JSON.stringify(result.user))
    for (const key of AUTH_KEYS) otherStorage.removeItem(key)

    return { ok: true, ...result }
  } catch (error) {
    return { ok: false, message: error.message }
  }
}

export function getCurrentSession() {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const rawSession = storage.getItem(SESSION_KEY)
      if (rawSession) return JSON.parse(rawSession)
    } catch {
      continue
    }
  }

  for (const storage of [localStorage, sessionStorage]) {
    try {
      const rawUser = storage.getItem('user') || storage.getItem('userInfo')
      if (rawUser) {
        const parsedUser = JSON.parse(rawUser)
        return {
          token: storage.getItem('token') || '',
          user: parsedUser?.user || parsedUser,
        }
      }
    } catch {
      continue
    }
  }

  return null
}

export function logoutFromLocalStorage() {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of AUTH_KEYS) storage.removeItem(key)
  }
}

export { getAuthToken }