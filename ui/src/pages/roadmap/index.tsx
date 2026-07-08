import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GameButton } from '../../components/game_ui/game_button'
import { GameShell } from '../../components/game_ui/game_shell'
import { sessionCardVariants } from '../../components/game_ui/session_animations'

interface Stage {
  title: string
  badge: string
  badgeColor: string
  content: React.ReactNode
}

function Arrow() {
  return (
    <svg width="32" height="24" viewBox="0 0 32 24" className="shrink-0 text-slate-600">
      <line x1="0" y1="12" x2="25" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <polygon points="22,5 32,12 22,19" fill="currentColor" />
    </svg>
  )
}

const bullet = (text: string) => (
  <li key={text} className="flex items-start gap-2 text-sm leading-relaxed text-slate-400">
    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/60" />
    {text}
  </li>
)

const stages: Stage[] = [
  {
    title: 'MVP',
    badge: 'Текущий этап',
    badgeColor: 'bg-emerald-500/15 text-emerald-400',
    content: (
      <p className="text-sm leading-relaxed text-slate-400">
        Базовая версия игры с основными механиками.
      </p>
    ),
  },
  {
    title: 'Релиз 1.0',
    badge: 'Запланировано',
    badgeColor: 'bg-amber-500/15 text-amber-400',
    content: (
      <ul className="space-y-1">
        {[
          'Система достижений',
          'Новая механика (казино)',
          'Новые звуковые эффекты',
          'Исправление ошибок',
        ].map(bullet)}
      </ul>
    ),
  },
  {
    title: 'TBD',
    badge: 'Позже',
    badgeColor: 'bg-slate-500/15 text-slate-400',
    content: (
      <p className="text-sm leading-relaxed text-slate-500">
        Следующие идеи и механики появятся позже.
      </p>
    ),
  },
]

const WIDTH = 'max-w-5xl'

const outerStyle: CSSProperties = {
  borderRadius: '1.35rem',
  background: 'linear-gradient(165deg, #3d4f63 0%, #1a2433 45%, #121a26 100%)',
}

export function RoadmapPage() {
  const navigate = useNavigate()

  return (
    <GameShell>
      <div className="flex min-h-dvh items-center justify-center p-4 md:p-6">
        <motion.div
          className={`w-full ${WIDTH}`}
          variants={sessionCardVariants}
          initial="hidden"
          animate="show"
        >
          <div className={`relative w-full shadow-[0_12px_40px_rgba(0,0,0,0.45)]`} style={outerStyle}>
            <div className="p-2.5">
              <div className="mb-2 flex items-center gap-1.5 px-1.5 pt-0.5">
                <span className="h-2 w-2 rounded-full bg-red-400/70 shadow-[0_0_6px_rgba(248,113,113,0.5)]" />
                <span className="h-2 w-2 rounded-full bg-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.4)]" />
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
                  ROADMAP
                </span>
              </div>

              <div className="relative rounded-xl border border-white/5 bg-gradient-to-b from-[#0c1824] via-[#0a1f1a] to-[#071510]">
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(77,196,141,0.12),transparent_55%)]" />
                  <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:16px_16px]" />
                </div>

                <div className="relative z-10 space-y-6 p-5 md:p-6">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="text-center"
                  >
                    <h2 className="text-xl font-bold tracking-wider text-emerald-50">
                      Дорожная карта
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Сейчас проект находится на этапе MVP
                    </p>
                  </motion.div>

                  <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
                    {stages.reduce<React.ReactNode[]>((acc, s, i) => {
                      if (i > 0) {
                        acc.push(
                          <div key={`arrow-${i}`} className="flex shrink-0 items-center px-2">
                            <Arrow />
                          </div>
                        )
                      }
                      acc.push(
                        <div
                          key={s.title}
                          className="flex min-w-44 flex-1 flex-col rounded-xl border border-white/5 bg-gradient-to-b from-[#0c1824] via-[#0a1f1a] to-[#071510] p-4"
                        >
                          <div className="mb-3 flex items-start justify-between gap-2">
                            <h3 className="text-base font-bold text-emerald-50">
                              {s.title}
                            </h3>
                            <span
                              className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.badgeColor}`}
                            >
                              {s.badge}
                            </span>
                          </div>
                          {s.content}
                        </div>
                      )
                      return acc
                    }, [])}
                  </div>
                </div>
              </div>

              <div className="mx-1 mt-2 h-1 rounded-full bg-black/40">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
              </div>
            </div>

            <div className="border-t border-white/10 px-2.5 pb-2.5 pt-3">
              <GameButton fullWidth variant="muted" onClick={() => navigate('/menu')}>
                Назад в меню
              </GameButton>
            </div>
          </div>
        </motion.div>
      </div>
    </GameShell>
  )
}
