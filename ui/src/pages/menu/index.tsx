import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameButton } from '../../components/game_ui/game_button'
import { GameShell } from '../../components/game_ui/game_shell'
import { SessionCard } from '../../components/game_ui/session_card'
import { authHttp } from '../../lib/auth-http'
import { useAuthStore } from '../../stores/auth.store'
import { useUsersStore } from '../../stores/users.store'
import { ProfilePanel } from './_components/_profile_panel'
import { menuContainerVariants, menuItemVariants, titleVariants } from './_model/animation'

export function MenuPage() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const { user, loading, loadProfile, clearProfile } = useUsersStore()

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  async function handleLogout() {
    try {
      await authHttp.post('auth/logout')
    } catch {
      // ignore
    }
    clearProfile()
    logout()
    navigate('/')
  }

  return (
    <GameShell>
      <div className="flex min-h-dvh items-center justify-center p-4 md:p-6">
        <motion.div
          className="w-full max-w-md"
          variants={titleVariants}
          initial="hidden"
          animate="show"
        >
          <SessionCard badge="MENU">
            <div className="mb-6 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-emerald-500/70">
                Night Session
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-emerald-50 md:text-3xl">
                Stock Market
              </h1>
              <p className="mt-1.5 text-sm text-slate-400">Главное меню</p>
            </div>

            <ProfilePanel
              loading={loading}
              displayName={user?.displayName}
              email={user?.email ?? undefined}
              avatarUrl={user?.avatarUrl ?? undefined}
            />

            <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <motion.div
              className="flex flex-col gap-3"
              variants={menuContainerVariants}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={menuItemVariants}>
                <GameButton fullWidth size="lg" onClick={() => navigate('/slots')}>
                  Играть
                </GameButton>
              </motion.div>

              <motion.div variants={menuItemVariants}>
                <GameButton fullWidth size="lg" variant="muted" onClick={() => navigate('/settings')}>
                  Настройки
                </GameButton>
              </motion.div>

              <motion.div variants={menuItemVariants}>
                <GameButton fullWidth variant="ghost" onClick={() => void handleLogout()}>
                  Выйти из аккаунта
                </GameButton>
              </motion.div>
            </motion.div>
          </SessionCard>
        </motion.div>
      </div>
    </GameShell>
  )
}
