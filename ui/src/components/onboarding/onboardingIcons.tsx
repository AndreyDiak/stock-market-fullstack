import type { SVGProps } from 'react'
import {
  BriefcaseIcon,
  ClockIcon,
  GraduationCapIcon,
  NewsIcon,
  BookOpenIcon,
  ShieldInsiderIcon,
  StarIcon,
} from '../../shared/icons'
import type { ReactElement } from 'react'

type IconComponent = (props: SVGProps<SVGSVGElement>) => ReactElement

function GamepadIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="7" cy="12" r="1.5" />
      <circle cx="17" cy="12" r="1.5" />
      <rect x="14.5" y="9.5" width="1" height="5" rx="0.5" />
      <rect x="12" y="11" width="5" height="1" rx="0.5" />
    </svg>
  )
}

function GridIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function ZapIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path strokeLinecap="round" d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  )
}

function LayersIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}

function TrendingUpIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function ActivityIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function HomeIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function HandshakeIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M16.5 8.5L12 12l-4.5-3.5" />
      <path d="M12 12v10" />
      <path d="M20 16c0 2.5-3.5 5-8 5s-8-2.5-8-5" />
      <path d="M4 9c0-2.5 3.5-5 8-5s8 2.5 8 5" />
    </svg>
  )
}

function WalletIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h6a3 3 0 010 6H2" />
      <circle cx="18" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

export const ONBOARDING_ICONS: Record<string, IconComponent> = {
  gamepad: GamepadIcon,
  briefcase: BriefcaseIcon,
  layers: LayersIcon,
  'trending-up': TrendingUpIcon,
  star: StarIcon,
  calendar: ClockIcon,
  grid: GridIcon,
  'graduation-cap': GraduationCapIcon,
  activity: ActivityIcon,
  home: HomeIcon,
  handshake: HandshakeIcon,
  newspaper: NewsIcon,
  shield: ShieldInsiderIcon,
  zap: ZapIcon,
  'book-open': BookOpenIcon,
  wallet: WalletIcon,
}
