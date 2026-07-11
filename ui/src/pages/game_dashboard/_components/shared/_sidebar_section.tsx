import type { ReactNode } from 'react'
import type { GameDashboardThemeTokens } from './_game_dashboard_theme'

interface SidebarSectionProps {
  title: string
  subtitle?: string
  action?: ReactNode
  footer?: ReactNode
  theme: GameDashboardThemeTokens
  children: ReactNode
  className?: string
  fill?: boolean
  scrollable?: boolean
}

export function SidebarSection({
  title,
  subtitle,
  action,
  footer,
  theme,
  children,
  className = '',
  fill = false,
  scrollable = false,
}: SidebarSectionProps) {
  const content = scrollable ? (
    <div className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-0.5 ${theme.scrollArea}`}>{children}</div>
  ) : (
    children
  )

  return (
    <section
      className={`${theme.sidebarSection} ${fill ? 'flex min-h-0 flex-1 flex-col' : ''} ${className}`}
    >
      <div className={`flex items-start justify-between gap-2 ${scrollable ? 'mb-2.5 shrink-0' : 'mb-2.5'}`}>
        <div className="min-w-0">
          <h3 className={theme.sidebarSectionTitle}>{title}</h3>
          {subtitle ? (
            <p className={`mt-0.5 text-[11px] leading-snug ${theme.secondaryText}`}>{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {content}
      {footer ? <div className="mt-2 shrink-0">{footer}</div> : null}
    </section>
  )
}
