import { Card } from '@/components/ui/card'
import { Link } from 'react-router-dom'

interface CategoryCardProps {
  id: number
  name: string
  icon?: string
  image?: string
  productCount: number
}

export function CategoryCard({
  id,
  name,
  icon,
  image,
  productCount
}: CategoryCardProps) {
  return (
    <Link to={`/loja?category=${id}`}>
      <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full">
        <div className="w-full h-40 bg-lilac-100 flex items-center justify-center text-4xl">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span>{icon || '🌸'}</span>
          )}
        </div>

        <div className="p-4 text-center">
          <h3 className="font-semibold text-ink-800">{name}</h3>
          <p className="text-sm text-ink-500 mt-1">
            {productCount} {productCount === 1 ? 'produto' : 'produtos'}
          </p>
        </div>
      </Card>
    </Link>
  )
}
