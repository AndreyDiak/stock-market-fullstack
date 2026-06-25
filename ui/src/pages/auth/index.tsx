import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage, loginWithPassword, registerWithPassword } from '../../api/auth'
import { GameShell } from '../../components/game_ui/game_shell'
import { isOAuthMessage } from '../../constants/oauth'
import { useAuthStore } from '../../stores/auth.store'
import { AuthCard } from './_components/_auth_card'
import { AuthFormsPanel } from './_components/_auth_forms_panel'
import { AuthModeTabs } from './_components/_auth_mode_tabs'
import { YandexAuthButton } from './_components/_yandex_auth_button'
import { ERROR_MESSAGES, POPUP_FEATURES, YANDEX_AUTH_URL } from './_model/constants'
import type { AuthMode } from './_model/types'

export function AuthPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const setToken = useAuthStore((s) => s.setToken)
  const [mode, setMode] = useState<AuthMode>('login')
  const [tabDirection, setTabDirection] = useState(0)
  const [isWaitingOAuth, setIsWaitingOAuth] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const inIframe = typeof window !== 'undefined' && window.self !== window.top

  const oauthError = searchParams.get('error')
  const oauthErrorMessage = oauthError
    ? (ERROR_MESSAGES[oauthError] ?? 'Произошла ошибка при авторизации.')
    : null

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (!isOAuthMessage(event.data)) return

      setIsWaitingOAuth(false)

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
      window.top!.location.href = YANDEX_AUTH_URL
      return
    }

    const popup = window.open(YANDEX_AUTH_URL, 'yandex-oauth', POPUP_FEATURES)
    if (!popup) {
      setSearchParams({ error: 'popup_blocked' }, { replace: true })
      return
    }

    setIsWaitingOAuth(true)
  }

  async function handleLogin(login: string, password: string) {
    setFormError(null)
    setIsSubmitting(true)
    try {
      const { accessToken } = await loginWithPassword(login, password)
      setToken(accessToken)
      navigate('/menu')
    } catch (error) {
      setFormError(await getApiErrorMessage(error, 'Не удалось войти'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRegister(username: string, email: string, password: string) {
    setFormError(null)
    setIsSubmitting(true)
    try {
      const { accessToken } = await registerWithPassword(username, email, password)
      setToken(accessToken)
      navigate('/menu')
    } catch (error) {
      setFormError(await getApiErrorMessage(error, 'Не удалось зарегистрироваться'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeError = formError ?? oauthErrorMessage

  return (
    <GameShell>
      <div className="flex min-h-dvh items-center justify-center p-4 md:p-6">
        <AuthCard>
          <div className="mb-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-emerald-500/70">
              Night Session
            </p>
            <h1 className="mt-2 text-2xl font-bold text-emerald-50 md:text-3xl">Stock Market</h1>
            <p className="mt-1.5 text-sm text-slate-400">Симулятор фондового рынка</p>
          </div>

          <AuthModeTabs
            mode={mode}
            onChange={(next) => {
              if (next !== mode) {
                setTabDirection(next === 'register' ? 1 : -1)
              }
              setMode(next)
              setFormError(null)
            }}
          />

          {activeError && (
            <p className="mb-4 rounded-xl border border-red-400/20 bg-red-950/40 px-3.5 py-2.5 text-sm text-red-300">
              {activeError}
              {oauthErrorMessage && (
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
              )}
            </p>
          )}

          {inIframe && (
            <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-950/30 px-3.5 py-2.5 text-xs text-amber-200">
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

          <AuthFormsPanel
            mode={mode}
            direction={tabDirection}
            loading={isSubmitting}
            onLogin={handleLogin}
            onRegister={handleRegister}
          />

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              или
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <YandexAuthButton
            loading={isWaitingOAuth}
            disabled={isSubmitting}
            onClick={startYandexAuth}
          />
        </AuthCard>
      </div>
    </GameShell>
  )
}
