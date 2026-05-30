import { ReactNode } from 'react'

interface AdminHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function AdminHeader({ title, description, actions }: AdminHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Title Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-ink-900">{title}</h1>
        {description && (
          <p className="text-sm text-ink-500 mt-1">
            {description}
            <span className="text-leaf-600 ml-1">● Ao vivo</span>
          </p>
        )}
      </div>

      {/* Top Actions */}
      <div className="flex items-center justify-start sm:justify-end gap-2 sm:gap-4 overflow-x-auto">
        {actions && (
          <div className="flex items-center gap-2 min-w-max">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
