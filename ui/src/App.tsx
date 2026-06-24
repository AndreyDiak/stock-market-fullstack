import { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { AuthPage } from './pages/auth'
import { OAuthCompletePage } from './pages/oauth_complete'
import { MenuPage } from './pages/menu'
import { SlotsPage } from './pages/slots'
import { NewGamePage } from './pages/new_game'
import { GameDashboardPage } from './pages/game_dashboard'
import { SettingsPage } from './pages/settings'
import { registerHttpUnauthorizedMiddleware } from './lib/http-middleware.ts'
import { useAuthStore } from './stores/auth.store.ts'
import { useUsersStore } from './stores/users.store.ts'

const PUBLIC_PATHS = new Set(['/', '/auth/complete'])

export function App() {
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
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/slots" element={<SlotsPage />} />
      <Route path="/new-game" element={<NewGamePage />} />
      <Route path="/game" element={<GameDashboardPage />} />
    </Routes>
  )
}
