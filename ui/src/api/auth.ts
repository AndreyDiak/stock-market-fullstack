import { HTTPError } from 'ky'
import { http } from '../lib/http'

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
  return http.post('auth/login', { json: { login, password } }).json<AuthTokenResponse>()
}

export async function registerWithPassword(
  username: string,
  email: string,
  password: string,
): Promise<AuthTokenResponse> {
  return http.post('auth/register', { json: { username, email, password } }).json<AuthTokenResponse>()
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
