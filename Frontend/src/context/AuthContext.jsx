import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loginUser, registerUser } from '../services/api'

const STORAGE_KEY = 'simplyfly-auth'

const AuthContext = createContext(null)

function decodeJwt(token) {
  try {
    const payloadBase64 = token.split('.')[1]
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(payloadJson)
  } catch {
    return null
  }
}

function readStoredAuth() {
  const rawValue = localStorage.getItem(STORAGE_KEY)
  if (!rawValue) {
    return { token: null, user: null }
  }

  try {
    const parsed = JSON.parse(rawValue)
    return {
      token: parsed.token ?? null,
      user: parsed.user ?? null,
    }
  } catch {
    return { token: null, user: null }
  }
}

function extractUser(token, fallbackUser = null) {
  const payload = token ? decodeJwt(token) : null

  if (!payload) {
    return fallbackUser
  }

  const role =
    payload.role ??
    payload[
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    ] ??
    fallbackUser?.role ??
    'Passenger'

  const email =
    payload.email ??
    payload[
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
    ] ??
    fallbackUser?.email ??
    ''

  const userId =
    payload.nameid ??
    payload[
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
    ] ??
    fallbackUser?.userId ??
    null

  return {
    userId,
    email,
    role,
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => {
    const stored = readStoredAuth()
    return {
      token: stored.token,
      user: stored.token ? extractUser(stored.token, stored.user) : stored.user,
    }
  })

  useEffect(() => {
    const storageValue = authState.token
      ? JSON.stringify({ token: authState.token, user: authState.user })
      : ''

    if (storageValue) {
      localStorage.setItem(STORAGE_KEY, storageValue)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [authState])

  async function signIn(credentials) {
    const response = await loginUser(credentials)
    const token = response?.data?.token ?? response?.data?.Token

    if (!token) {
      throw new Error('Login succeeded, but no token was returned.')
    }

    setAuthState({
      token,
      user: extractUser(token),
    })

    return token
  }

  async function signUp(payload) {
    const response = await registerUser(payload)
    const token = response?.data?.token ?? response?.data?.Token ?? null
    const user = {
      email: payload.email,
      role: payload.role,
    }

    setAuthState({
      token,
      user: token ? extractUser(token, user) : user,
    })

    return response
  }

  function signOut() {
    setAuthState({
      token: null,
      user: null,
    })
  }

  const value = useMemo(
    () => ({
      token: authState.token,
      user: authState.user,
      isAuthenticated: Boolean(authState.token),
      signIn,
      signUp,
      signOut,
    }),
    [authState],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
