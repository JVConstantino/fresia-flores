interface ChartBarProps {
  data: Array<{ name: string; value: number }>
}

interface ChartDonutProps {
  data: Array<{ label: string; value: number; color: string }>
}

export function ChartBar({ data }: ChartBarProps) {
  if (!data || data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-ink-500">Sem dados</div>
  }

  const max = Math.max(...data.map(d => d.value))
  
  return (
    <div className="flex items-end gap-2 h-56 border-b border-ink-200 pb-6">
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center gap-2 flex-1">
          <div
            className={`w-full rounded-t-md transition-all ${
              idx === data.length - 1 ? 'bg-lilac-500' : 'bg-ink-100'
            }`}
            style={{ height: `${(item.value / max) * 100}%` }}
          />
          <span className="text-xs text-ink-500">{item.name}</span>
        </div>
      ))}
    </div>
  )
}

export function ChartDonut({ data }: ChartDonutProps) {
  if (!data || data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-ink-500">Sem dados</div>
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = 62
  const circ = 2 * Math.PI * radius

  let cumulativeDash = 0
  const segments = data.map(item => {
    const percentage = item.value / total
    const dashLength = percentage * circ
    const offset = -cumulativeDash
    cumulativeDash += dashLength
    return { ...item, dashLength, offset, dashArray: `${dashLength} ${circ - dashLength}` }
  })

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Donut */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg
          width={200}
          height={200}
          viewBox="0 0 200 200"
          className="transform -rotate-90"
        >
          {segments.map((seg, idx) => (
            <circle
              key={idx}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="20"
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.offset}
            />
          ))}
        </svg>
        
        {/* Center */}
        <div className="absolute text-center">
          <div className="font-display text-2xl font-medium text-ink-900">{total}</div>
          <div className="text-xs text-ink-500">Total</div>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
              <span className="text-ink-700">{item.label}</span>
            </div>
            <span className="font-medium text-ink-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
