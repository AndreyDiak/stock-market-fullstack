import { Routes, Route } from 'react-router-dom'
import AuthPage from './pages/AuthPage.tsx'
import OAuthCompletePage from './pages/OAuthCompletePage.tsx'
import MenuPage from './pages/MenuPage.tsx'
import SlotsPage from './pages/SlotsPage.tsx'
import NewGamePage from './pages/NewGamePage.tsx'

export default function App() {
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
