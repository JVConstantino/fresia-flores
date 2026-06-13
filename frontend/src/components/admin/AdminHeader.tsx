import { ReactNode } from 'react'

interface AdminHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function AdminHeader({ title, description, actions }: AdminHeaderProps) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-ink-900 leading-tight">{title}</h1>
          {description && (
            <p className="text-sm text-ink-500 mt-1.5 flex items-center gap-1.5">
              {description}
              <span className="inline-flex items-center gap-1 text-leaf-600 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-leaf-500 animate-pulse" />
                Ao vivo
              </span>
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
