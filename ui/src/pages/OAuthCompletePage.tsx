import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { OAUTH_MESSAGE_TYPE } from '../constants/oauth'
import { useAuthStore } from '../stores/auth.store'

export default function OAuthCompletePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setToken = useAuthStore((s) => s.setToken)

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const error = searchParams.get('error')

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: OAUTH_MESSAGE_TYPE, accessToken: accessToken ?? undefined, error: error ?? undefined },
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

    navigate(`/?error=${error ?? 'authentication_failed'}`, { replace: true })
  }, [searchParams, setToken, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center text-pastel-700">
      Вход...
    </div>
  )
}
