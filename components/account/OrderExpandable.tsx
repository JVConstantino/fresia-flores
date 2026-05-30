'use client'

import { useState } from 'react'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface OrderItem {
  id?: number
  productId: number
  productName?: string
  variantId?: number | null
  variantName?: string | null
  qty: number
  price: number
}

export interface OrderExpandableProps {
  id: number
  status: string
  total: number
  createdAt: string
  items?: OrderItem[]
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
}

export function OrderExpandable({
  id,
  status,
  total,
  createdAt,
  items = []
}: OrderExpandableProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusLabel = STATUS_LABELS[status] || status
  const statusColor = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
  const date = new Date(createdAt).toLocaleDateString('pt-BR')
  const totalNum = Number(total) || 0

  return (
    <div className="border border-ink-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-ink-50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1 text-left">
          <div>
            <p className="font-semibold text-ink-800">Pedido #{id}</p>
            <p className="text-sm text-ink-500">{date}</p>
          </div>
          <div className={`px-3 py-1 rounded text-sm font-semibold ${statusColor}`}>
            {statusLabel}
          </div>
        </div>
        <div className="text-right mr-4">
          <p className="font-bold text-ink-800">R$ {totalNum.toFixed(2)}</p>
        </div>
        <ChevronDown
          size={20}
          className={`text-ink-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="bg-ink-50 px-4 py-4 border-t border-ink-200 space-y-3">
          {items.length > 0 && (
            <>
              <p className="text-sm font-semibold text-ink-700">Itens do pedido:</p>
              <div className="space-y-1.5">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-ink-700">
                      {item.productName || `Produto #${item.productId}`}
                      {item.variantName && ` - ${item.variantName}`}
                      <span className="text-ink-500 ml-1">x{item.qty}</span>
                    </span>
                    <span className="font-semibold text-ink-800">R$ {(Number(item.price) * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <Link
            to={`/pedido/${id}/detalhes`}
            className="flex items-center justify-center gap-2 mt-3 w-full py-2 bg-lilac-500 hover:bg-lilac-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Ver detalhes do pedido
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  )
}
