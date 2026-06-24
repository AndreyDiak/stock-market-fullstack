import { useState } from 'react'
import { GameButton } from '../../components/game_ui/game_button'
import { AuthInput } from './_auth_input'

interface RegisterFormProps {
  loading?: boolean
  onSubmit: (username: string, email: string, password: string) => void
}

export function RegisterForm({ loading, onSubmit }: RegisterFormProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(username.trim(), email.trim(), password)
      }}
    >
      <AuthInput
        label="Логин"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        autoComplete="username"
        minLength={3}
        maxLength={32}
        pattern="[a-zA-Z0-9_]+"
        title="Латиница, цифры и _"
        required
      />
      <AuthInput
        label="Почта"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
      />
      <AuthInput
        label="Пароль"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="new-password"
        minLength={8}
        required
      />
      <GameButton type="submit" fullWidth size="lg" disabled={loading}>
        {loading ? 'Регистрация...' : 'Создать аккаунт'}
      </GameButton>
    </form>
  )
}
