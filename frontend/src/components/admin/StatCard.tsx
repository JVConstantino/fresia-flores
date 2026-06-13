import { ArrowUp, ArrowDown, type LucideIcon } from 'lucide-react'
import { NumberTicker } from '@/components/ui/number-ticker'

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  iconColor?: 'lilac' | 'forest' | 'petal' | 'leaf'
}

const ICON_BG: Record<string, string> = {
  lilac: 'bg-lilac-100 text-lilac-600',
  forest: 'bg-blue-50 text-blue-600',
  petal: 'bg-petal-100 text-petal-500',
  leaf: 'bg-leaf-50 text-leaf-600',
}

export function StatCard({ label, value, change, changeLabel, icon: Icon, iconColor = 'lilac' }: StatCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNumeric = typeof value === 'number'

  return (
    <div className="bg-white rounded-lg p-5 flex flex-col gap-3 transition-colors hover:bg-ink-50/60">
      <div className="flex items-start justify-between">
        {Icon ? (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ICON_BG[iconColor]}`}>
            <Icon size={18} />
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ICON_BG[iconColor]}`} />
        )}
        {change !== undefined && (
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            isPositive ? 'bg-leaf-50 text-leaf-600' : 'bg-petal-50 text-petal-600'
          }`}>
            {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      <div className="text-xs text-ink-500 font-medium">{label}</div>

      <div className="font-display text-3xl font-medium text-ink-900 leading-tight tabular-nums">
        {isNumeric ? (
          <NumberTicker value={value as number} className="font-display text-3xl font-medium text-ink-900" />
        ) : (
          value
        )}
      </div>

      {changeLabel && <div className="text-xs text-ink-400">{changeLabel}</div>}
    </div>
  )
}
