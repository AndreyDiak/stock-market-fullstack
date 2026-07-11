import { useNavigate } from 'react-router-dom'
import { GameButton } from '../../../../components/game_ui/game_button'
import { GameModal } from '../../../../components/game_ui/floating'
import { MoneyValue } from '../../../../components/money/money_value'
import { useGameStore } from '../../../../stores/game.store'

export function GameOverModal() {
  const navigate = useNavigate()
  const showGameOver = useGameStore((state) => state.showGameOver)
  const dismissGameOver = useGameStore((state) => state.dismissGameOver)
  const balance = useGameStore((state) => state.balance)
  const turn = useGameStore((state) => state.turn)
  const characterProfile = useGameStore((state) => state.characterProfile)
  const portfolio = useGameStore((state) => state.portfolio)
  const inventoryItems = useGameStore((state) => state.inventoryItems)
  const bankPaidProperties = useGameStore((state) => state.bankPaidProperties)

  const portfolioValue = portfolio.reduce((sum, row) => sum + row.qty * row.price, 0)
  const realEstateCount = inventoryItems.length + bankPaidProperties.length

  function handleExit() {
    dismissGameOver()
    navigate('/slots', { replace: true })
  }

  return (
    <GameModal
      open={showGameOver}
      onClose={handleExit}
      labelledBy="game-over-title"
      overlayClassName="bg-black/80 backdrop-blur-sm"
      panelClassName="pointer-events-auto relative w-full max-w-md rounded-[28px] border border-red-500/30 bg-gradient-to-b from-slate-800 to-slate-900 p-6 shadow-2xl outline-none"
    >
      <h2
        id="game-over-title"
        className="mb-1 text-center text-2xl font-bold text-red-400"
      >
        Банкротство
      </h2>
      <p className="mb-6 text-center text-sm text-slate-400">
        Ваш баланс стал отрицательным. Игра окончена.
      </p>

      <div className="mb-6 space-y-3 rounded-xl bg-black/30 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Финальный баланс</span>
          <MoneyValue amount={balance} size="sm" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Сыграно ходов</span>
          <span className="font-mono text-sm font-semibold text-slate-100">{turn}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Профессия</span>
          <span className="text-sm font-semibold text-slate-100">
            {characterProfile.profession} (ур. {characterProfile.professionLevel})
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Репутация</span>
          <span className="font-mono text-sm font-semibold text-slate-100">
            {characterProfile.reputation.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Стоимость портфеля</span>
          <MoneyValue amount={portfolioValue} size="sm" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Объектов недвижимости</span>
          <span className="font-mono text-sm font-semibold text-slate-100">
            {realEstateCount}
          </span>
        </div>
      </div>

      <GameButton fullWidth onClick={handleExit}>
        Выйти в главное меню
      </GameButton>
    </GameModal>
  )
}
