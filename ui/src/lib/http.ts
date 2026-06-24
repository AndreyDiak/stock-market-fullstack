import ky from 'ky';
import { API_URL } from '../config';
import { useAuthStore } from '../stores/auth.store';

export const http = ky.create({
  prefix: API_URL,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      (state) => {
        const token = useAuthStore.getState().accessToken
        if (token) {
          state.request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      (state) => {
        if (state.response.status === 401) {
          useAuthStore.getState().logout()
        }
      },
    ],
  },
})
