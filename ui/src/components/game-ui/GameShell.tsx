import type { ReactNode } from 'react'
import NewGameAtmosphere from '../NewGameAtmosphere'

interface GameShellProps {
  children: ReactNode
  className?: string
  fixedHeight?: boolean
}

export default function GameShell({
  children,
  className = '',
  fixedHeight = false,
}: GameShellProps) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-[#061018] via-[#0a1628] to-[#0c2c1f] text-slate-100 ${
        fixedHeight ? 'h-dvh' : 'min-h-dvh'
      } ${className}`}
    >
      <NewGameAtmosphere />
      <div className={`relative z-10 ${fixedHeight ? 'h-full' : 'min-h-dvh'}`}>
        {children}
      </div>
    </div>
  )
}
