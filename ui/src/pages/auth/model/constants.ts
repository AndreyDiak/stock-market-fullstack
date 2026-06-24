import { OAUTH_URL } from '../../../config'

export const YANDEX_AUTH_URL = `${OAUTH_URL}/auth/yandex`

export const ERROR_MESSAGES: Record<string, string> = {
  authentication_failed: 'Не удалось войти. Попробуйте ещё раз.',
  access_denied: 'Вы отменили вход.',
  invalid_state: 'Сессия авторизации истекла. Попробуйте снова.',
  missing_code: 'Провайдер не вернул код авторизации.',
  invalid_scope:
    'В настройках приложения Яндекса не включены запрашиваемые права доступа.',
  popup_blocked:
    'Браузер заблокировал окно входа. Разрешите всплывающие окна для этого сайта.',
}

export const POPUP_FEATURES = 'width=520,height=720,scrollbars=yes,resizable=yes'
