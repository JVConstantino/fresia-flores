import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  actions?: ReactNode
}

export function SectionCard({ title, description, icon, children, className, bodyClassName, actions }: SectionCardProps) {
  return (
    <div className={cn('bg-white rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-ink-50">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <span className="text-lilac-500 shrink-0">{icon}</span>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink-800 leading-tight">{title}</h3>
            {description && (
              <p className="text-xs text-ink-400 mt-0.5 truncate">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="shrink-0">{actions}</div>
        )}
      </div>

      {/* Body */}
      <div className={cn('p-4 space-y-4', bodyClassName)}>
        {children}
      </div>
    </div>
  )
}
