import { useState } from 'react'
import { GameButton } from '../../../components/game_ui/game_button'
import { AuthInput } from './_auth_input'

interface LoginFormProps {
  loading?: boolean
  onSubmit: (login: string, password: string) => void
}

export function LoginForm({ loading, onSubmit }: LoginFormProps) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(login.trim(), password)
      }}
    >
      <AuthInput
        label="Логин или email"
        value={login}
        onChange={(event) => setLogin(event.target.value)}
        autoComplete="username"
        required
      />
      <AuthInput
        label="Пароль"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        required
      />
      <GameButton type="submit" fullWidth size="lg" disabled={loading}>
        {loading ? 'Вход...' : 'Войти'}
      </GameButton>
    </form>
  )
}
