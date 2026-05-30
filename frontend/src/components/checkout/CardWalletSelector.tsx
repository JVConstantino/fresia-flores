import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { CreditCard, Plus, X } from 'lucide-react'
import { CardWallet } from '@/components/account/CardWallet'
import { CreditCardFormFlip } from '@/components/features/CreditCardFormFlip'

interface PaymentCard {
  id: number
  brand: string
  lastFour: string
  nickname?: string | null
  isDefault: boolean
  createdAt: string
}

interface CardWalletSelectorProps {
  selectedCardId: number | null
  onSelectCard: (cardId: number) => void
}

export function CardWalletSelector({ selectedCardId, onSelectCard }: CardWalletSelectorProps) {
  const [cards, setCards] = useState<PaymentCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [savingCard, setSavingCard] = useState(false)

  useEffect(() => {
    loadCards()
  }, [])

  async function loadCards() {
    try {
      const { data } = await api.get('/account/cards')
      setCards(data)

      // Auto-select default card if none selected
      if (!selectedCardId && data.length > 0) {
        const defaultCard = data.find((c: PaymentCard) => c.isDefault)
        if (defaultCard) {
          onSelectCard(defaultCard.id)
        }
      }
    } catch {
      toast.error('Erro ao carregar cartões')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveCard(data: {
    cardNumber: string
    cardholderName: string
    cardExpirationMonth: string
    cardExpirationYear: string
    securityCode: string
  }) {
    setSavingCard(true)
    try {
      // TODO: Call real MP API for tokenization
      const mockToken = `test_token_${data.cardNumber.slice(-4)}_${Date.now()}`
      const brand = 'visa'

      const { data: newCard } = await api.post('/account/cards', {
        mpToken: mockToken,
        brand,
        lastFour: data.cardNumber.slice(-4),
        nickname: '',
        isDefault: cards.length === 0
      })

      setCards([...cards, newCard])
      onSelectCard(newCard.id)
      setShowForm(false)
      toast.success('Cartão adicionado')
    } catch {
      toast.error('Erro ao salvar cartão')
    } finally {
      setSavingCard(false)
    }
  }

  async function handleDeleteCard(id: number) {
    if (!confirm('Tem certeza?')) return
    try {
      await api.delete(`/account/cards/${id}`)
      const updatedCards = cards.filter(c => c.id !== id)
      setCards(updatedCards)
      if (selectedCardId === id) {
        onSelectCard(updatedCards[0]?.id ?? null)
      }
      toast.success('Cartão removido')
    } catch {
      toast.error('Erro ao deletar cartão')
    }
  }

  if (loading) return <div className="text-center py-4">Carregando cartões...</div>

  return (
    <div className="space-y-4">
      {!showForm ? (
        <>
          {cards.length === 0 ? (
            <div className="text-center py-8 text-ink-400">
              <CreditCard className="mx-auto mb-2 opacity-50" size={32} />
              <p className="mb-4">Nenhum cartão cadastrado</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-lilac-500 hover:bg-lilac-600 text-white rounded-lg"
              >
                <Plus size={16} />
                Adicionar Cartão
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map(card => (
                  <div
                    key={card.id}
                    onClick={() => onSelectCard(card.id)}
                    className={`cursor-pointer transition-all transform ${
                      selectedCardId === card.id ? 'scale-105 ring-2 ring-lilac-500' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <CardWallet
                      {...card}
                      onDelete={handleDeleteCard}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="w-full mt-2 py-2 border border-lilac-500 text-lilac-600 rounded-lg hover:bg-lilac-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Usar Outro Cartão
              </button>
            </>
          )}
        </>
      ) : (
        <div className="p-4 bg-ink-50 rounded-lg space-y-3">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">Novo Cartão</h4>
            <button
              onClick={() => setShowForm(false)}
              className="text-ink-400 hover:text-ink-600"
            >
              <X size={20} />
            </button>
          </div>

          <CreditCardFormFlip
            onSubmit={handleSaveCard}
            isLoading={savingCard}
          />

          <button
            onClick={() => setShowForm(false)}
            className="w-full py-2 border border-ink-200 hover:bg-ink-50 text-ink-800 rounded-lg text-sm"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
