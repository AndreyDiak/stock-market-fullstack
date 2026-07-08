import ky from 'ky'
import { AUTH_URL } from '../config'

/** Cookie-based auth — same origin as Yandex OAuth callback (:3000 in dev) */
export const authHttp = ky.create({
  prefix: AUTH_URL,
  credentials: 'include',
})
