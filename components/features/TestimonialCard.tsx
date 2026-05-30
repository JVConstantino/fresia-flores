import { Card } from '@/components/ui/card'

interface TestimonialCardProps {
  id: number
  clientName: string
  text: string
  rating: number
  date?: Date
}

export function TestimonialCard({
  clientName,
  text,
  rating,
  date
}: TestimonialCardProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i < rating)

  return (
    <Card className="p-6 max-w-sm">
      <div className="flex gap-1 mb-3">
        {stars.map((filled, i) => (
          <span key={i}>{filled ? '⭐' : '☆'}</span>
        ))}
      </div>

      <p className="text-ink-700 text-sm leading-relaxed mb-4">"{text}"</p>

      <p className="font-semibold text-ink-800">{clientName}</p>
      {date && (
        <p className="text-xs text-ink-500">
          {new Date(date).toLocaleDateString('pt-BR')}
        </p>
      )}
    </Card>
  )
}
