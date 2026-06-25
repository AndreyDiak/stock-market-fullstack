import ky, { HTTPError } from 'ky';
import { API_URL } from '../config';
import { useAuthStore } from '../stores/auth.store';
import { isAuthEndpoint, tryRefreshAccessToken } from './auth-refresh';
import { runHttpUnauthorizedMiddleware } from './http-middleware';

export const http = ky.create({
  prefix: API_URL,
  credentials: 'include',
  retry: {
    limit: 1,
    statusCodes: [401],
    methods: ['get', 'post', 'put', 'patch', 'delete'],
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
    beforeRetry: [
      async ({ request, error }) => {
        if (!(error instanceof HTTPError) || error.response.status !== 401) {
          throw error
        }

        if (isAuthEndpoint(request.url)) {
          throw error
        }

        if (request.headers.get('x-auth-retried')) {
          runHttpUnauthorizedMiddleware()
          throw error
        }

        request.headers.set('x-auth-retried', '1')

        const refreshed = await tryRefreshAccessToken()
        if (!refreshed) {
          runHttpUnauthorizedMiddleware()
          throw error
        }

        const { accessToken } = useAuthStore.getState()
        if (accessToken) {
          request.headers.set('Authorization', `Bearer ${accessToken}`)
        }
      },
    ],
  },
})
