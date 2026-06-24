import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import bg from "../assets/backgrounds/auth.png";
import { isOAuthMessage } from "../constants/oauth";
import { OAUTH_URL } from "../config";
import { useAuthStore } from "../stores/auth.store";

const yandexAuthUrl = `${OAUTH_URL}/auth/yandex`;

const ERROR_MESSAGES: Record<string, string> = {
  authentication_failed: "Не удалось войти. Попробуйте ещё раз.",
  access_denied: "Вы отменили вход.",
  invalid_state: "Сессия авторизации истекла. Попробуйте снова.",
  missing_code: "Провайдер не вернул код авторизации.",
  invalid_scope: "В настройках приложения Яндекса не включены запрашиваемые права доступа.",
};

const POPUP_FEATURES = "width=520,height=720,scrollbars=yes,resizable=yes";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const setToken = useAuthStore((s) => s.setToken);
  const [isWaiting, setIsWaiting] = useState(false);
  const inIframe = typeof window !== "undefined" && window.self !== window.top;

  const error = searchParams.get("error");
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "Произошла ошибка при авторизации.") : null;

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (!isOAuthMessage(event.data)) return;

      setIsWaiting(false);

      if (event.data.accessToken) {
        setToken(event.data.accessToken);
        navigate("/menu");
        return;
      }

      if (event.data.error) {
        setSearchParams({ error: event.data.error }, { replace: true });
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [navigate, setSearchParams, setToken]);

  function startYandexAuth() {
    if (inIframe) {
      window.top!.location.href = yandexAuthUrl;
      return;
    }

    const popup = window.open(yandexAuthUrl, "yandex-oauth", POPUP_FEATURES);
    if (!popup) {
      setSearchParams({ error: "popup_blocked" }, { replace: true });
      return;
    }

    setIsWaiting(true);
  }

  const popupBlockedMessage =
    error === "popup_blocked"
      ? "Браузер заблокировал окно входа. Разрешите всплывающие окна для этого сайта."
      : errorMessage;

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-pastel-700">Stock Market</h1>
          <p className="mt-2 text-sm text-pastel-400">
            Симулятор фондового рынка
          </p>
        </div>

        {popupBlockedMessage && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {popupBlockedMessage}
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete("error");
                setSearchParams(next, { replace: true });
              }}
              className="ml-2 underline"
            >
              Закрыть
            </button>
          </p>
        )}

        {inIframe && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Встроенный браузер блокирует OAuth. Откройте{" "}
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              localhost:5173
            </a>{" "}
            в Chrome или Firefox.
          </p>
        )}

        <button
          type="button"
          onClick={startYandexAuth}
          disabled={isWaiting}
          className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#21212B] px-5 py-3.5 text-[15px] font-medium text-white shadow-md transition hover:bg-[#2c2c36] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FC3F1D] text-sm font-bold leading-none text-white">
            Я
          </span>
          <span>{isWaiting ? "Ожидание входа..." : "Войти с Яндекс ID"}</span>
        </button>
      </div>
    </div>
  );
}
