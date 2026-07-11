import { useEffect } from 'react'
import { CoinIcon } from '../../shared/icons'

const PARTICLE_COUNT = 4

interface BalanceCoinFxProps {
  delta: number
  onComplete: () => void
}

export function BalanceCoinFx({ delta, onComplete }: BalanceCoinFxProps) {
  const income = delta > 0

  useEffect(() => {
    const timer = window.setTimeout(onComplete, 720)
    return () => window.clearTimeout(timer)
  }, [delta, onComplete])

  if (delta === 0) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-visible"
    >
      {Array.from({ length: PARTICLE_COUNT }, (_, index) => {
        const offsetX = (index - (PARTICLE_COUNT - 1) / 2) * 12

        return (
          <span
            key={index}
            className={`absolute left-1/2 top-1/2 balance-coin-fx ${
              income ? 'balance-coin-fx--in' : 'balance-coin-fx--out'
            }`}
            style={{
              marginLeft: offsetX,
              animationDelay: `${index * 65}ms`,
            }}
          >
            <CoinIcon className="h-4 w-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
          </span>
        )
      })}
    </div>
  )
}
