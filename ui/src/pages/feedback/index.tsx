import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameButton } from '../../components/game_ui/game_button'
import { GameSelect } from '../../components/game_ui/game_select'
import { GameShell } from '../../components/game_ui/game_shell'
import {
  sessionCardVariants,
  sessionStaggerContainerVariants,
  sessionStaggerItemVariants,
} from '../../components/game_ui/session_animations'
import { SessionCard } from '../../components/game_ui/session_card'
import { http } from '../../lib/http'
import { useSavesStore } from '../../stores/saves.store'

type MessageType = 'error' | 'suggestion' | 'feedback' | 'other'

const MESSAGE_TYPE_OPTIONS: { value: MessageType; label: string }[] = [
  { value: 'error', label: 'Ошибка' },
  { value: 'suggestion', label: 'Предложение' },
  { value: 'feedback', label: 'Отзыв' },
  { value: 'other', label: 'Другое' },
]

export function FeedbackPage() {
  const navigate = useNavigate()
  const { slots, loadSlots } = useSavesStore()
  const [saveId, setSaveId] = useState('')
  const [messageType, setMessageType] = useState<MessageType>('feedback')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    void loadSlots()
  }, [loadSlots])

  const filledSlots = slots.filter((s) => s.filled)

  useEffect(() => {
    if (filledSlots.length === 1 && !saveId) {
      setSaveId(filledSlots[0].id!)
    }
  }, [filledSlots, saveId])

  const isValid = saveId && comment.trim().length > 0

  const handleSubmit = async () => {
    if (!isValid || submitting) return
    setSubmitting(true)
    try {
      await http.post('feedback', {
        json: {
          saveId,
          messageType,
          comment: comment.trim(),
          timestamp: new Date().toISOString(),
        },
      })
    } catch {
      // backend not yet available
    }
    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <GameShell>
      <div className="flex min-h-dvh items-center justify-center p-4 md:p-6">
        <motion.div
          className="w-full max-w-md"
          variants={sessionCardVariants}
          initial="hidden"
          animate="show"
        >
          <SessionCard badge="FEEDBACK">
            {submitted ? (
              <motion.div
                className="flex flex-col items-center py-8 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
                  <svg
                    className="h-8 w-8 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-emerald-50">
                  Спасибо!
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Ваше сообщение отправлено.
                </p>
                <div className="mt-8 w-full">
                  <GameButton fullWidth variant="muted" onClick={() => navigate('/menu')}>
                    Назад в меню
                  </GameButton>
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={sessionStaggerContainerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-5"
              >
                <motion.div variants={sessionStaggerItemVariants} className="text-center">
                  <h2 className="text-xl font-bold tracking-wider text-emerald-50">
                    Обратная связь
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Сообщите о проблеме или поделитесь идеей
                  </p>
                </motion.div>

                <motion.div variants={sessionStaggerItemVariants}>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    ID сейва
                  </label>
                  <GameSelect
                    value={saveId}
                    placeholder={filledSlots.length === 0 ? 'Нет сохранений' : 'Выберите сейв'}
                    options={filledSlots.map((s) => ({
                      value: s.id!,
                      label: s.name ?? s.characterName ?? `Сейв ${s.slot}`,
                    }))}
                    onChange={setSaveId}
                  />
                  {filledSlots.length === 0 && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      Создайте игру в главном меню, чтобы выбрать сейв
                    </p>
                  )}
                </motion.div>

                <motion.div variants={sessionStaggerItemVariants}>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Тип сообщения
                  </label>
                  <GameSelect
                    value={messageType}
                    options={MESSAGE_TYPE_OPTIONS}
                    onChange={setMessageType}
                  />
                </motion.div>

                <motion.div variants={sessionStaggerItemVariants}>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Комментарий
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="Опишите, что произошло, что вы ожидали увидеть и как это повторить, если это ошибка."
                    className="w-full resize-none rounded-xl border border-slate-700/40 bg-slate-800/60 px-3.5 py-2.5 text-sm leading-relaxed text-slate-200 outline-none ring-1 ring-transparent transition placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/30"
                  />
                </motion.div>

                <motion.div variants={sessionStaggerItemVariants} className="pt-1">
                  <GameButton
                    fullWidth
                    disabled={!isValid || submitting}
                    onClick={() => void handleSubmit()}
                  >
                    {submitting ? 'Отправка…' : 'Отправить'}
                  </GameButton>
                </motion.div>

                <motion.div
                  variants={sessionStaggerItemVariants}
                  className="border-t border-white/10 pt-5"
                >
                  <GameButton fullWidth variant="ghost" onClick={() => navigate('/menu')}>
                    Назад в меню
                  </GameButton>
                </motion.div>
              </motion.div>
            )}
          </SessionCard>
        </motion.div>
      </div>
    </GameShell>
  )
}
