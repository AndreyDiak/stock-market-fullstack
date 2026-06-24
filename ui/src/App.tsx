import { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage.tsx'
import OAuthCompletePage from './pages/OAuthCompletePage.tsx'
import MenuPage from './pages/MenuPage.tsx'
import SlotsPage from './pages/SlotsPage.tsx'
import NewGamePage from './pages/NewGamePage.tsx'
import { registerHttpUnauthorizedMiddleware } from './lib/http-middleware.ts'
import { useAuthStore } from './stores/auth.store.ts'
import { useUsersStore } from './stores/users.store.ts'

const PUBLIC_PATHS = new Set(['/', '/auth/complete'])

export default function App() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const clearProfile = useUsersStore((s) => s.clearProfile)

  useEffect(() => {
    registerHttpUnauthorizedMiddleware(() => {
      logout()
      clearProfile()

      if (!PUBLIC_PATHS.has(window.location.pathname)) {
        navigate('/', { replace: true })
      }
    })

    return () => registerHttpUnauthorizedMiddleware(null)
  }, [navigate, logout, clearProfile])

  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/auth/complete" element={<OAuthCompletePage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/slots" element={<SlotsPage />} />
      <Route path="/new-game" element={<NewGamePage />} />
    </Routes>
  )
}
