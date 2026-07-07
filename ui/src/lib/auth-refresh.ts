import { authHttp } from './auth-http';
import { useAuthStore } from '../stores/auth.store';

let refreshPromise: Promise<boolean> | null = null

export function isAccessTokenExpired(token: string, bufferMs = 60_000): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!)) as { exp?: number }
    if (!payload.exp) return true
    return Date.now() >= payload.exp * 1000 - bufferMs
  } catch {
    return true
  }
}

export async function tryRefreshAccessToken(): Promise<boolean> {
  const { setToken } = useAuthStore.getState()

  if (!refreshPromise) {
    refreshPromise = authHttp
      .post('auth/refresh')
      .json<{ accessToken: string }>()
      .then(({ accessToken }) => {
        setToken(accessToken)
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export function isAuthEndpoint(url: string): boolean {
  return /\/auth\/(login|register|refresh|logout)(?:\?|$)/.test(url)
}
