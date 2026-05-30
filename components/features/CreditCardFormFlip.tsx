'use client'

import { useState } from 'react'
import { cardMasks } from '@/lib/cardMasks'

interface CreditCardFormFlipProps {
  onSubmit: (data: {
    cardNumber: string
    cardholderName: string
    cardExpirationMonth: string
    cardExpirationYear: string
    securityCode: string
  }) => Promise<void>
  isLoading?: boolean
}

const BRAND_COLORS: Record<string, string> = {
  visa: 'from-blue-700 to-blue-500',
  mastercard: 'from-red-700 to-orange-500',
  elo: 'from-yellow-600 to-yellow-400',
  hipercard: 'from-red-800 to-red-600',
  amex: 'from-green-700 to-green-500'
}

export function CreditCardFormFlip({ onSubmit, isLoading = false }: CreditCardFormFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const detectedBrand = cardMasks.detectBrand(cardNumber)
  const colorClass = BRAND_COLORS[detectedBrand] || 'from-gray-700 to-gray-500'

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = cardMasks.formatCardNumber(e.target.value)
    setCardNumber(formatted)
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = cardMasks.formatExpiry(e.target.value)
    setExpiry(formatted)
  }

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = cardMasks.formatCVV(e.target.value)
    setCvv(formatted)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    const cleaned = cardMasks.extractCardNumber(cardNumber)
    if (cleaned.length < 13 || cleaned.length > 19) {
      newErrors.cardNumber = 'Número de cartão inválido'
    }

    if (!cardholderName.trim()) {
      newErrors.cardholderName = 'Nome do titular é obrigatório'
    }

    const { month, year } = cardMasks.extractExpiry(expiry)
    if (!cardMasks.isValidExpiry(month, year)) {
      newErrors.expiry = 'Data de vencimento inválida ou expirada'
    }

    if (cvv.length < 3 || cvv.length > 4) {
      newErrors.cvv = 'CVV deve ter 3 ou 4 dígitos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const { month, year } = cardMasks.extractExpiry(expiry)

    try {
      await onSubmit({
        cardNumber: cardMasks.extractCardNumber(cardNumber),
        cardholderName,
        cardExpirationMonth: month,
        cardExpirationYear: year,
        securityCode: cvv
      })
    } catch (err) {
      console.error('Form submission error:', err)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 3D Flip Card Preview */}
      <div
        className="mb-6 h-48 cursor-pointer transition-transform duration-500 [perspective:1000px]"
        onMouseEnter={() => setIsFlipped(true)}
        onMouseLeave={() => setIsFlipped(false)}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* Frente */}
          <div
            className={`absolute w-full h-full bg-gradient-to-br ${colorClass} rounded-xl p-6 text-white shadow-lg [backface-visibility:hidden] flex flex-col justify-between`}
          >
            <div>
              <p className="text-sm opacity-80 mb-4">Número do cartão</p>
              <p className="text-xl font-mono tracking-widest break-all">
                {cardNumber || '•••• •••• •••• ••••'}
              </p>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs opacity-80">Nome do titular</p>
                <p className="font-semibold">{cardholderName || 'SEU NOME'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">Válido até</p>
                <p className="font-mono">{expiry || 'MM/YY'}</p>
              </div>
            </div>
          </div>

          {/* Verso */}
          <div
            className={`absolute w-full h-full bg-gradient-to-br ${colorClass} rounded-xl p-6 text-white shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-center items-center gap-4`}
          >
            <div className="w-full h-12 bg-black/30 rounded"></div>
            <div className="text-center">
              <p className="text-xs opacity-80 mb-2">CVV</p>
              <p className="text-2xl font-mono tracking-widest">{cvv || '•••'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Number */}
        <div>
          <label className="block text-sm font-semibold mb-1">Número do cartão</label>
          <input
            type="text"
            value={cardNumber}
            onChange={handleCardNumberChange}
            placeholder="0000 0000 0000 0000"
            maxLength={23}
            className={`w-full px-3 py-2 border rounded-lg font-mono ${
              errors.cardNumber ? 'border-red-500' : 'border-ink-200'
            }`}
          />
          {errors.cardNumber && <p className="text-red-600 text-xs mt-1">{errors.cardNumber}</p>}
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="block text-sm font-semibold mb-1">Nome do titular</label>
          <input
            type="text"
            value={cardholderName}
            onChange={e => setCardholderName(e.target.value)}
            placeholder="JOÃO SILVA"
            className={`w-full px-3 py-2 border rounded-lg uppercase ${
              errors.cardholderName ? 'border-red-500' : 'border-ink-200'
            }`}
          />
          {errors.cardholderName && (
            <p className="text-red-600 text-xs mt-1">{errors.cardholderName}</p>
          )}
        </div>

        {/* Expiry and CVV Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Válido até (MM/YY)</label>
            <input
              type="text"
              value={expiry}
              onChange={handleExpiryChange}
              placeholder="12/25"
              maxLength={5}
              className={`w-full px-3 py-2 border rounded-lg font-mono ${
                errors.expiry ? 'border-red-500' : 'border-ink-200'
              }`}
              onFocus={() => setIsFlipped(false)}
            />
            {errors.expiry && <p className="text-red-600 text-xs mt-1">{errors.expiry}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">CVV</label>
            <input
              type="text"
              value={cvv}
              onChange={handleCVVChange}
              placeholder="123"
              maxLength={4}
              className={`w-full px-3 py-2 border rounded-lg font-mono ${
                errors.cvv ? 'border-red-500' : 'border-ink-200'
              }`}
              onFocus={() => setIsFlipped(true)}
            />
            {errors.cvv && <p className="text-red-600 text-xs mt-1">{errors.cvv}</p>}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-lilac-500 hover:bg-lilac-600 disabled:bg-lilac-300 text-white rounded-lg font-semibold transition-colors"
        >
          {isLoading ? 'Processando...' : 'Adicionar Cartão'}
        </button>
      </form>

      {/* PENDING INTEGRATION NOTE */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <p className="font-semibold">⚠️ Integração Real Pendente</p>
        <p>Este formulário está pronto para integração com Mercado Pago. Os dados do cartão serão tokenizados via MP SDK antes do envio.</p>
      </div>
    </div>
  )
}
