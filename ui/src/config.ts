export const API_URL = import.meta.env.VITE_API_URL ?? '/api'

/** OAuth всегда через бэкенд напрямую, не через Vite proxy */
export const OAUTH_URL = import.meta.env.VITE_OAUTH_URL ?? 'http://localhost:3000'
