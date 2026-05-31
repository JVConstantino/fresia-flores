import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Eye, ShoppingBag } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cartStore'
import { useWishlist } from '@/hooks/useWishlist'
import { toast } from 'sonner'

interface ProductCardProps {
  id: number
  name: string
  image?: string
  price: number
  originalPrice?: number
  discountPercent?: number
  slug: string
  category: string
  stock: number
  onQuickView?: (productId: number) => void
}

export function ProductCard({
  id,
  name,
  image,
  price,
  originalPrice,
  discountPercent,
  slug,
  category,
  stock,
  onQuickView
}: ProductCardProps) {
  const [showHover, setShowHover] = useState(false)
  const addItem = useCartStore(state => state.addItem)
  const { isFavorited, toggle, loading: wishlistLoading } = useWishlist(id)

  const handleAddToCart = () => {
    if (stock <= 0) {
      toast.error('Produto sem estoque')
      return
    }
    addItem({
      productId: id,
      productName: name,
      productSlug: slug,
      categoryName: category,
      variantId: null,
      variantName: null,
      price,
      productImages: image
    })
    toast.success('Adicionado ao carrinho')
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Imagem — proporção 3:4 */}
      <div
        className="relative w-full aspect-[3/4] bg-ink-100 overflow-hidden"
        onMouseEnter={() => setShowHover(true)}
        onMouseLeave={() => setShowHover(false)}
      >
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-400 text-sm">🌸</div>
        )}

        {/* Overlay de hover — botões na parte inferior da imagem */}
        <div className={`absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-200 ${showHover ? 'opacity-100' : 'opacity-0'}`}>
          <Link to={`/produto/${slug}`} className="w-full">
            <Button size="sm" className="w-full bg-white hover:bg-ink-50 text-ink-800 gap-1.5 text-xs h-8">
              <Eye size={13} /> Ver Produto
            </Button>
          </Link>
          {onQuickView && (
            <Button
              size="sm"
              onClick={() => onQuickView(id)}
              className="w-full bg-lilac-500 hover:bg-lilac-600 text-white gap-1.5 text-xs h-8"
            >
              <Eye size={13} /> Visualizar rápido
            </Button>
          )}
        </div>

        {/* Favoritar */}
        <button
          onClick={toggle}
          disabled={wishlistLoading}
          className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors z-10 shadow-sm"
          title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart
            size={16}
            className={`transition-colors ${isFavorited ? 'fill-petal-400 text-petal-400' : 'text-ink-500 hover:text-petal-400'}`}
          />
        </button>

        {/* Badge de desconto */}
        {discountPercent && (
          <div className="absolute top-2 right-2 bg-petal-400 text-white px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm">
            -{discountPercent}%
          </div>
        )}

        {/* Estoque baixo */}
        {stock > 0 && stock <= 5 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-medium">
            Últimas {stock}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-grow">
        <p className="text-[10px] text-ink-400 uppercase tracking-wider mb-0.5">{category}</p>
        <h3 className="text-xs sm:text-sm font-semibold text-ink-800 line-clamp-2 leading-snug mb-2">{name}</h3>

        <div className="mt-auto space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-bold text-lilac-500">R$ {price.toFixed(2)}</span>
            {originalPrice && originalPrice > price && (
              <span className="text-xs text-ink-400 line-through">R$ {originalPrice.toFixed(2)}</span>
            )}
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={stock <= 0}
            size="sm"
            className="w-full bg-ink-800 hover:bg-lilac-500 text-white gap-1.5 transition-colors h-8 sm:h-9 text-xs sm:text-sm"
          >
            <ShoppingBag size={14} />
            {stock > 0 ? 'Adicionar' : 'Sem estoque'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
