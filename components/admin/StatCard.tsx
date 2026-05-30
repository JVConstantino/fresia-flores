import { ArrowUp, ArrowDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: 'a' | 'b' | 'c' | 'd'
}

const ICON_COLORS = {
  a: 'bg-lilac-500',
  b: 'bg-forest-600',
  c: 'bg-petal-400',
  d: 'bg-leaf-500'
}

const TREND_COLORS = {
  up: 'bg-leaf-50 text-leaf-600',
  down: 'bg-petal-50 text-petal-600'
}

export function StatCard({ label, value, change, changeLabel, icon = 'a' }: StatCardProps) {
  const isPositive = change && change > 0
  
  return (
    <div className="bg-white border border-ink-200 rounded-lg p-5 flex flex-col gap-3">
      {/* Top: Icon + Menu */}
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center text-white text-lg ${ICON_COLORS[icon]}`}>
          ●
        </div>
        <button className="text-ink-500 hover:text-ink-900 text-lg leading-none">⋯</button>
      </div>

      {/* Label */}
      <div className="text-xs text-ink-500 font-medium">{label}</div>

      {/* Value in Display Font */}
      <div className="font-display text-3xl font-medium text-ink-900 leading-tight">
        {value}
      </div>

      {/* Trend Badge */}
      {change !== undefined && (
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold w-fit ${
          isPositive ? TREND_COLORS.up : TREND_COLORS.down
        }`}>
          {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          <span>{Math.abs(change)}%</span>
        </div>
      )}
      {changeLabel && <div className="text-xs text-ink-500">{changeLabel}</div>}
    </div>
  )
}
