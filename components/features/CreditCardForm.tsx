'use client'

import { useState } from 'react'
import Cards from 'react-credit-cards-2'
import 'react-credit-cards-2/dist/lib/styles-compiled.css'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface CreditCardFormProps {
  onTokenCreated: (token: string, paymentMethodId: string, cpf: string) => Promise<void>
  isLoading?: boolean
}

export function CreditCardForm({ onTokenCreated, isLoading = false }: CreditCardFormProps) {
  const [cardState, setCardState] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
    focus: 'number' as 'number' | 'name' | 'expiry' | 'cvc'
  })
  const [cpf, setCpf] = useState('')
  const [installments, setInstallments] = useState('1')
  const [processingToken, setProcessingToken] = useState(false)

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCardState(prev => ({ ...prev, [name]: value }))
  }

  const getCardBrand = () => {
    const number = cardState.number.replace(/\s/g, '')
    if (/^4/.test(number)) return 'visa'
    if (/^5[1-5]/.test(number)) return 'mastercard'
    if (/^3[47]/.test(number)) return 'amex'
    if (/^30[0-5]|^36|^38|^39/.test(number)) return 'diners'
    if (/^6011|^65/.test(number)) return 'discover'
    if (/^35\d{3}/.test(number)) return 'jcb'
    return 'unknown'
  }

  const mapBrandToPaymentMethod = (brand: string) => {
    const map: Record<string, string> = {
      visa: 'visa',
      mastercard: 'master',
      master: 'master',
      amex: 'amex',
      diners: 'diners',
      discover: 'discover',
      jcb: 'jcb',
      hipercard: 'hipercard',
      elo: 'elo'
    }
    return map[brand] || 'visa'
  }

  const tokenizeCard = async () => {
    if (!window.MercadoPago) {
      alert('SDK do Mercado Pago não carregado')
      return
    }

    setProcessingToken(true)
    try {
      const [month, year] = cardState.expiry.split('/')
      const cardNumber = cardState.number.replace(/\s/g, '')

      const token = await window.MercadoPago.createCardToken({
        cardNumber,
        cardholderName: cardState.name,
        cardExpirationMonth: month,
        cardExpirationYear: '20' + year,
        securityCode: cardState.cvc,
        identificationType: 'CPF',
        identificationNumber: cpf.replace(/\D/g, '')
      })

      const paymentMethodId = mapBrandToPaymentMethod(getCardBrand())
      await onTokenCreated(token.id, paymentMethodId, cpf)
    } catch (error: any) {
      alert('Erro ao tokenizar cartão: ' + error.message)
    } finally {
      setProcessingToken(false)
    }
  }

  const isValid = cardState.number.length >= 13 && cardState.name && cardState.expiry.length === 5 && cardState.cvc.length >= 3 && cpf.replace(/\D/g, '').length === 11

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-start">
      <div className="flex justify-center md:sticky md:top-24">
        <Cards
          number={cardState.number}
          expiry={cardState.expiry}
          cvc={cardState.cvc}
          name={cardState.name}
          focused={cardState.focus}
          placeholders={{ name: 'NOME DO TITULAR' }}
        />
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Numero do Cartao</label>
          <Input
            name="number"
            value={cardState.number}
            onChange={e => {
              const formatted = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim()
              handleCardChange({ ...e, target: { ...e.target, name: 'number', value: formatted } })
            }}
            onFocus={() => setCardState(p => ({ ...p, focus: 'number' }))}
            placeholder="0000 0000 0000 0000"
            maxLength={19}
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Titular do Cartao</label>
          <Input
            name="name"
            value={cardState.name}
            onChange={handleCardChange}
            onFocus={() => setCardState(p => ({ ...p, focus: 'name' }))}
            placeholder="MARIA SANTOS"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Validade</label>
            <Input
              name="expiry"
              value={cardState.expiry}
              onChange={e => {
                let value = e.target.value.replace(/\D/g, '')
                if (value.length >= 2) value = value.substring(0, 2) + '/' + value.substring(2, 4)
                handleCardChange({ ...e, target: { ...e.target, name: 'expiry', value } })
              }}
              onFocus={() => setCardState(p => ({ ...p, focus: 'expiry' }))}
              placeholder="MM/YY"
              maxLength={5}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">CVV</label>
            <Input
              name="cvc"
              value={cardState.cvc}
              onChange={e => {
                const value = e.target.value.replace(/\D/g, '').substring(0, 4)
                handleCardChange({ ...e, target: { ...e.target, name: 'cvc', value } })
              }}
              onFocus={() => setCardState(p => ({ ...p, focus: 'cvc' }))}
              placeholder="000"
              maxLength={4}
              type="password"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">CPF</label>
          <Input
            value={cpf}
            onChange={e => {
              let value = e.target.value.replace(/\D/g, '')
              if (value.length > 3) value = value.substring(0, 3) + '.' + value.substring(3)
              if (value.length > 7) value = value.substring(0, 7) + '.' + value.substring(7)
              if (value.length > 11) value = value.substring(0, 11) + '-' + value.substring(11, 13)
              setCpf(value)
            }}
            placeholder="000.000.000-00"
            maxLength={14}
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-ink-500 mb-1.5 block">Parcelamento</label>
          <select
            value={installments}
            onChange={e => setInstallments(e.target.value)}
            className="w-full border border-ink-200 rounded-md px-3 py-2 text-sm text-ink-800 bg-white focus:outline-none"
          >
            <option value="1">1x sem juros</option>
            <option value="2">2x sem juros</option>
            <option value="3">3x sem juros</option>
            <option value="6">6x com juros</option>
          </select>
        </div>
        <Button
          className="w-full bg-lilac-500 hover:bg-lilac-600 text-white rounded-pill mt-4"
          disabled={!isValid || processingToken || isLoading}
          onClick={tokenizeCard}
        >
          {processingToken ? 'Processando...' : 'Continuar'}
        </Button>
      </div>
    </div>
  )
}
