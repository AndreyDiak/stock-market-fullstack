export const API_URL = import.meta.env.VITE_API_URL ?? '/api'

/** Backend URL for auth endpoints — in dev proxied by Vite, in prod set VITE_AUTH_URL */
export const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? '/api'
