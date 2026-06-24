import ky from 'ky';
import { API_URL } from '../config';
import { useAuthStore } from '../stores/auth.store';
import { runHttpUnauthorizedMiddleware } from './http-middleware';

export const http = ky.create({
  prefix: API_URL,
  credentials: 'include',
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
      ({ response }) => {
        if (response.status === 401) {
          runHttpUnauthorizedMiddleware()
        }
      },
    ],
  },
})
