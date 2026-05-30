'use client'

import { Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useCartStore, selectCount, selectTotal, type CartItem } from '@/store/cartStore'

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

function CartItemRow({ item }: { item: CartItem }) {
  const { removeItem, updateQty } = useCartStore()
  const img = item.productImages

  return (
    <div className="flex gap-3 py-4 border-b border-ink-100 last:border-0">
      <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-lilac-100 to-petal-100">
        {img ? (
          <img src={img} alt={item.productName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">🌸</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-lilac-500 mb-0.5">
          {item.categoryName}
        </div>
        <div className="text-sm font-medium text-ink-800 truncate">{item.productName}</div>
        <div className="text-xs text-ink-500 mb-2">{item.variantName ?? 'Único'}</div>

        <div className="flex items-center justify-between">
          <div className="font-display italic text-base text-ink-800">
            {formatPrice(item.price)}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateQty(item.productId, item.variantId, item.qty - 1)}
              className="w-6 h-6 rounded-full border border-ink-200 flex items-center justify-center hover:bg-ink-50 transition-colors"
            >
              <Minus size={10} />
            </button>
            <span className="text-sm font-medium text-ink-800 w-5 text-center">{item.qty}</span>
            <button
              onClick={() => updateQty(item.productId, item.variantId, item.qty + 1)}
              className="w-6 h-6 rounded-full border border-ink-200 flex items-center justify-center hover:bg-ink-50 transition-colors"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>

        <button
          onClick={() => removeItem(item.productId, item.variantId)}
          className="text-[10px] text-ink-500 hover:text-red-400 transition-colors mt-1"
        >
          Remover
        </button>
      </div>
    </div>
  )
}

export function CartSheet() {
  const { items, isOpen, closeCart } = useCartStore()
  const count = useCartStore(selectCount)
  const total = useCartStore(selectTotal)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-96 bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-ink-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-semibold text-ink-800">Carrinho</h2>
                {count > 0 && (
                  <p className="text-xs text-ink-500">{count} {count === 1 ? 'item' : 'itens'}</p>
                )}
              </div>
              <button
                onClick={closeCart}
                className="w-8 h-8 rounded-full hover:bg-ink-100 flex items-center justify-center transition-colors text-ink-500"
              >
                <X size={16} />
              </button>
            </div>

            {/* Conteúdo */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-5">
                <ShoppingBag size={40} className="text-ink-200" />
                <p className="text-sm font-medium text-ink-800">Seu carrinho está vazio</p>
                <p className="text-xs text-ink-500">Adicione produtos para continuar</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 rounded-pill"
                  onClick={() => { closeCart(); window.location.href = '/loja' }}
                >
                  Ver loja
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5">
                  {items.map(item => (
                    <CartItemRow key={`${item.productId}-${item.variantId}`} item={item} />
                  ))}
                </div>

                <div className="px-5 py-4 border-t border-ink-200 shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-ink-500">Subtotal</span>
                    <span className="font-display italic text-xl text-ink-800">{formatPrice(total)}</span>
                  </div>
                  <Button
                    className="w-full bg-ink-800 hover:bg-lilac-500 text-white rounded-pill transition-colors"
                    onClick={() => { window.location.href = '/carrinho' }}
                  >
                    Ir para o carrinho
                  </Button>
                  <button
                    className="w-full text-xs text-ink-500 hover:text-ink-800 transition-colors mt-3"
                    onClick={closeCart}
                  >
                    Continuar comprando
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
