import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameButton } from '../../components/game_ui/game_button'
import { GamePanel } from '../../components/game_ui/game_panel'
import { GameShell } from '../../components/game_ui/game_shell'
import { http } from '../../lib/http'
import { useAuthStore } from '../../stores/auth.store'
import { useUsersStore } from '../../stores/users.store'
import { menuContainerVariants, menuItemVariants, titleVariants } from './model/animation'

export function MenuPage() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const { user, loading, loadProfile, clearProfile } = useUsersStore()

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  async function handleLogout() {
    try {
      await http.post('auth/logout')
    } catch {
      // ignore
    }
    clearProfile()
    logout()
    navigate('/')
  }

  const displayName = user?.displayName
  const email = user?.email
  const avatarUrl = user?.avatarUrl

  return (
    <GameShell>
      <div className="flex min-h-dvh flex-col items-center justify-center p-4 md:p-6">
        <div className="flex w-full max-w-md flex-col items-center">
          <motion.div
            className="mb-8 text-center"
            variants={titleVariants}
            initial="hidden"
            animate="show"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-emerald-500/70">
              Night Session
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white md:text-5xl">
              Trader Simulator
            </h1>
          </motion.div>

          <motion.div
            className="mb-6 w-full"
            variants={menuItemVariants}
            initial="hidden"
            animate="show"
          >
            <GamePanel className="!p-5">
              {loading ? (
                <p className="text-center text-sm text-slate-400">Загрузка профиля...</p>
              ) : displayName ? (
                <div className="flex items-center gap-4">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-emerald-400/30"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-emerald-300">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{displayName}</p>
                    {email && (
                      <p className="truncate text-xs text-slate-400">{email}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-slate-400">
                  Не удалось загрузить профиль
                </p>
              )}
            </GamePanel>
          </motion.div>

          <motion.div
            className="flex w-full flex-col gap-4"
            variants={menuContainerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={menuItemVariants}>
              <GameButton fullWidth onClick={() => navigate('/slots')}>Играть</GameButton>
            </motion.div>

            <motion.div variants={menuItemVariants}>
              <GameButton fullWidth variant="muted" onClick={() => navigate('/settings')}>
                Настройки
              </GameButton>
            </motion.div>

            <motion.div variants={menuItemVariants}>
              <GameButton fullWidth variant="danger" onClick={() => void handleLogout()}>
                Выйти из аккаунта
              </GameButton>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </GameShell>
  )
}
