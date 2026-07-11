import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GameShell } from '../../components/game_ui/game_shell'
import { OAUTH_MESSAGE_TYPE } from '../../constants/oauth'
import { useAuthStore } from '../../stores/auth.store'

export function OAuthCompletePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setToken = useAuthStore((s) => s.setToken)

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const error = searchParams.get('error')

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        {
          type: OAUTH_MESSAGE_TYPE,
          accessToken: accessToken ?? undefined,
          error: error ?? undefined,
        },
        window.location.origin,
      )
      window.close()
      return
    }

    if (accessToken) {
      setToken(accessToken)
      navigate('/menu', { replace: true })
      return
    }

    if (error) {
      navigate(`/?error=${encodeURIComponent(error)}`, { replace: true })
      return
    }

    navigate('/?error=authentication_failed', { replace: true })
  }, [searchParams, setToken, navigate])

  return (
    <GameShell>
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-mono text-sm tracking-widest text-emerald-400/80">Вход...</p>
      </div>
    </GameShell>
  )
}
