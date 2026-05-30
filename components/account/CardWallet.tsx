'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

export interface CardWalletProps {
  id: number
  brand: string
  lastFour: string
  nickname?: string | null
  isDefault: boolean
  onDelete?: (id: number) => void
}

const BRAND_COLORS: Record<string, string> = {
  visa: 'from-blue-700 to-blue-500',
  mastercard: 'from-red-700 to-orange-500',
  elo: 'from-yellow-600 to-yellow-400',
  hipercard: 'from-red-800 to-red-600',
  amex: 'from-green-700 to-green-500'
}

const BRAND_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  elo: 'Elo',
  hipercard: 'Hipercard',
  amex: 'American Express'
}

export function CardWallet({ id, brand, lastFour, nickname, isDefault, onDelete }: CardWalletProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const colorClass = BRAND_COLORS[brand.toLowerCase()] || 'from-gray-700 to-gray-500'
  const brandLabel = BRAND_LABELS[brand.toLowerCase()] || brand

  return (
    <div
      className={`relative w-full h-48 cursor-pointer transition-transform duration-500 [perspective:1000px]`}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* Frente do cartão */}
        <div
          className={`absolute w-full h-full bg-gradient-to-br ${colorClass} rounded-xl p-6 text-white shadow-lg [backface-visibility:hidden] flex flex-col justify-between`}
        >
          <div>
            {isDefault && (
              <div className="mb-2 inline-block px-2 py-1 bg-white/20 text-white text-xs font-semibold rounded">
                Padrão
              </div>
            )}
            <p className="text-sm opacity-80">Número do cartão</p>
            <p className="text-2xl font-mono tracking-widest mt-1">•••• •••• •••• {lastFour}</p>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs opacity-80">Nome do titular</p>
              <p className="font-semibold text-sm">{nickname || brandLabel}</p>
            </div>
            <div className="text-lg font-bold">{brandLabel}</div>
          </div>
        </div>

        {/* Verso do cartão */}
        <div
          className={`absolute w-full h-full bg-gradient-to-br ${colorClass} rounded-xl p-6 text-white shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-center items-center`}
        >
          <p className="text-xs opacity-80 mb-2">CVV</p>
          <p className="text-3xl font-mono tracking-widest">•••</p>
          <p className="text-xs opacity-80 mt-4">Últimos 4 dígitos</p>
          <p className="text-2xl font-mono tracking-widest">{lastFour}</p>
        </div>
      </div>

      {/* Botão deletar (overlay) */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(id)
          }}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg z-10 transition-colors"
          title="Deletar cartão"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}
