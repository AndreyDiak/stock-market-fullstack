interface YandexAuthButtonProps {
  disabled?: boolean
  loading?: boolean
  onClick: () => void
}

export function YandexAuthButton({ disabled, loading, onClick }: YandexAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#3a3a48] border-b-[#08080c] bg-gradient-to-b from-[#2e2e38] via-[#21212B] to-[#18181f] px-5 py-3.5 text-sm font-black tracking-wide text-white shadow-[0_6px_0_#08080c,0_10px_28px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-white/10 transition hover:from-[#363642] hover:via-[#2c2c36] hover:to-[#1e1e26] hover:shadow-[0_6px_0_#08080c,0_12px_32px_rgba(0,0,0,0.5)] active:translate-y-1 active:border-b-[#08080c] active:shadow-[0_2px_0_#08080c,0_4px_14px_rgba(0,0,0,0.35)] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:translate-y-0"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#ff6b4d] border-b-[#a82a0e] bg-gradient-to-b from-[#ff5c3d] to-[#d93612] text-sm font-bold leading-none text-white shadow-[0_3px_0_#a82a0e] ring-1 ring-inset ring-white/20">
        Я
      </span>
      <span>{loading ? 'Ожидание входа...' : 'Войти с Яндекс ID'}</span>
    </button>
  )
}
