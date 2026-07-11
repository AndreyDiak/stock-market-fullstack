import type { HTMLAttributes, ReactNode } from 'react'

interface DashboardCardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  className?: string
  as?: 'section' | 'article' | 'div'
}

export function DashboardCard({
  children,
  className = '',
  as: Tag = 'section',
  ...props
}: DashboardCardProps) {
  return (
    <Tag
      className={`rounded-2xl border border-[var(--border-subtle,rgba(255,255,255,0.06))] bg-[var(--surface-card,rgba(30,41,59,0.42))] p-4 shadow-[var(--shadow-card,0_8px_24px_rgba(0,0,0,0.28))] md:p-5 ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.08) 100%)',
      }}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function DashboardCardHeader({
  title,
  icon,
  action,
}: {
  title: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold text-[var(--text-primary,#f8fafc)]">{title}</h3>
      </div>
      {action}
    </div>
  )
}
