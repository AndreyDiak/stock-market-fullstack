import { HTTPError } from 'ky'
import { authHttp } from '../lib/auth-http'

export interface AuthTokenResponse {
  accessToken: string
}

interface ApiErrorBody {
  error?: {
    code?: string
    message?: string
  }
}

export async function loginWithPassword(login: string, password: string): Promise<AuthTokenResponse> {
  return authHttp.post('auth/login', { json: { login, password } }).json<AuthTokenResponse>()
}

export async function registerWithPassword(
  username: string,
  email: string,
  password: string,
): Promise<AuthTokenResponse> {
  return authHttp.post('auth/register', { json: { username, email, password } }).json<AuthTokenResponse>()
}

export async function refreshAccessToken(): Promise<AuthTokenResponse> {
  return authHttp.post('auth/refresh').json<AuthTokenResponse>()
}

export async function getApiErrorMessage(error: unknown, fallback = 'Произошла ошибка'): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const body = await error.response.json<ApiErrorBody>()
      return body.error?.message ?? fallback
    } catch {
      return fallback
    }
  }
  return fallback
}
