import ky from 'ky';
import { API_URL } from '../config';
import { useAuthStore } from '../stores/auth.store';
import { isAuthEndpoint, tryRefreshAccessToken } from './auth-refresh';
import { runHttpUnauthorizedMiddleware } from './http-middleware';

export const http = ky.create({
  prefix: API_URL,
  credentials: 'include',
  retry: {
    limit: 0,
  },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const { accessToken } = useAuthStore.getState()
        if (accessToken) {
          request.headers.set('Authorization', `Bearer ${accessToken}`)
        }
      },
    ],
    afterResponse: [
      async ({ request, response }) => {
        if (response.status !== 401) return
        if (isAuthEndpoint(request.url)) return

        if (request.headers.get('x-auth-retried')) {
          runHttpUnauthorizedMiddleware()
          return
        }

        request.headers.set('x-auth-retried', '1')

        const refreshed = await tryRefreshAccessToken()
        if (!refreshed) {
          runHttpUnauthorizedMiddleware()
          return
        }

        const { accessToken } = useAuthStore.getState()
        if (!accessToken) {
          runHttpUnauthorizedMiddleware()
          return
        }

        const headers = new Headers(request.headers)
        headers.set('Authorization', `Bearer ${accessToken}`)

        return ky.retry({
          request: new Request(request, { headers }),
          code: 'TOKEN_REFRESHED',
        })
      },
    ],
  },
})
