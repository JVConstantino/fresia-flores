import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ChartBarProps {
  data: Array<{ name: string; value: number }>
}

interface ChartDonutProps {
  data: Array<{ label: string; value: number; color: string }>
}

export function ChartBar({ data }: ChartBarProps) {
  if (!data || data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-ink-500 text-sm">Sem dados</div>
  }

  const max = Math.max(...data.map(d => d.value))

  return (
    <div className="flex items-end gap-1.5 h-48 pt-2">
      {data.map((item, idx) => {
        const heightPct = max > 0 ? (item.value / max) * 100 : 0
        const isLast = idx === data.length - 1
        return (
          <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end group">
            <div className="relative w-full flex justify-center">
              {/* Tooltip on hover */}
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-ink-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {item.value}
              </span>
              <div
                className={`w-full rounded-t-md transition-all duration-500 ${isLast ? 'bg-lilac-500' : 'bg-ink-200 group-hover:bg-ink-300'}`}
                style={{ height: `${Math.max(heightPct, 4)}%`, maxHeight: '100%' }}
              />
            </div>
            <span className="text-[10px] text-ink-500 truncate w-full text-center">{item.name}</span>
          </div>
        )
      })}
    </div>
  )
}

export function ChartDonut({ data }: ChartDonutProps) {
  if (!data || data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-ink-500 text-sm">Sem dados</div>
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const pieData = data.map(d => ({ name: d.label, value: d.value, color: d.color }))

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="42%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          {/* Centro com total */}
          <text
            x="50%"
            y="40%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 22, fontWeight: 600, fill: '#1f1c26', fontFamily: 'Fraunces, serif' }}
          >
            {total}
          </text>
          <text
            x="50%"
            y="47%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 11, fill: '#6b6579' }}
          >
            Total
          </text>
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ fontSize: 12, color: '#6b6579' }}>{value}</span>}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(31, 28, 38, 0.08)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
