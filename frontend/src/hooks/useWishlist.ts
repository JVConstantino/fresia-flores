import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { useState } from 'react'

export function useWishlist(productId: number) {
  const isFavorited = useWishlistStore((state) => state.isFavorited(productId))
  const { toggleFavorite } = useWishlistStore()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    try {
      setLoading(true)

      if (user) {
        if (isFavorited) {
          await api.delete(`/account/wishlist/${productId}`)
        } else {
          await api.post(`/account/wishlist/${productId}`)
        }
      }

      toggleFavorite(productId)
      toast.success(isFavorited ? 'Removido dos favoritos' : 'Adicionado aos favoritos')
    } catch (err: any) {
      toast.error('Erro ao atualizar favorito')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return { isFavorited, toggle, loading }
}
