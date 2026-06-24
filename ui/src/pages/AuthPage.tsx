import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import GamePanel from '../components/game-ui/GamePanel'
import GameShell from '../components/game-ui/GameShell'
import { isOAuthMessage } from '../constants/oauth'
import { OAUTH_URL } from '../config'
import { useAuthStore } from '../stores/auth.store'

const yandexAuthUrl = `${OAUTH_URL}/auth/yandex`

const ERROR_MESSAGES: Record<string, string> = {
  authentication_failed: 'Не удалось войти. Попробуйте ещё раз.',
  access_denied: 'Вы отменили вход.',
  invalid_state: 'Сессия авторизации истекла. Попробуйте снова.',
  missing_code: 'Провайдер не вернул код авторизации.',
  invalid_scope:
    'В настройках приложения Яндекса не включены запрашиваемые права доступа.',
  popup_blocked:
    'Браузер заблокировал окно входа. Разрешите всплывающие окна для этого сайта.',
}

const POPUP_FEATURES = 'width=520,height=720,scrollbars=yes,resizable=yes'

export default function AuthPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const setToken = useAuthStore((s) => s.setToken)
  const [isWaiting, setIsWaiting] = useState(false)
  const inIframe = typeof window !== 'undefined' && window.self !== window.top

  const error = searchParams.get('error')
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? 'Произошла ошибка при авторизации.') : null

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (!isOAuthMessage(event.data)) return

      setIsWaiting(false)

      if (event.data.accessToken) {
        setToken(event.data.accessToken)
        navigate('/menu')
        return
      }

      if (event.data.error) {
        setSearchParams({ error: event.data.error }, { replace: true })
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate, setSearchParams, setToken])

  function startYandexAuth() {
    if (inIframe) {
      window.top!.location.href = yandexAuthUrl
      return
    }

    const popup = window.open(yandexAuthUrl, 'yandex-oauth', POPUP_FEATURES)
    if (!popup) {
      setSearchParams({ error: 'popup_blocked' }, { replace: true })
      return
    }

    setIsWaiting(true)
  }

  return (
    <GameShell>
      <div className="flex min-h-dvh items-center justify-center p-4 md:p-6">
        <GamePanel className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-emerald-500/70">
              Night Session
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">Stock Market</h1>
            <p className="mt-2 text-sm text-slate-400">Симулятор фондового рынка</p>
          </div>

          {errorMessage && (
            <p className="mb-4 rounded-2xl border border-red-400/20 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {errorMessage}
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  next.delete('error')
                  setSearchParams(next, { replace: true })
                }}
                className="ml-2 underline"
              >
                Закрыть
              </button>
            </p>
          )}

          {inIframe && (
            <p className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-950/30 px-4 py-3 text-xs text-amber-200">
              Встроенный браузер блокирует OAuth. Откройте{' '}
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-300 underline"
              >
                localhost:5173
              </a>{' '}
              в Chrome или Firefox.
            </p>
          )}

          <button
            type="button"
            onClick={startYandexAuth}
            disabled={isWaiting}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#21212B] px-5 py-3.5 text-[15px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:bg-[#2c2c36] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FC3F1D] text-sm font-bold leading-none text-white">
              Я
            </span>
            <span>{isWaiting ? 'Ожидание входа...' : 'Войти с Яндекс ID'}</span>
          </button>
        </GamePanel>
      </div>
    </GameShell>
  )
}
