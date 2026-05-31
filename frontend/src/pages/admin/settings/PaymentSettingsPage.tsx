import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { api } from '@/lib/axios'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function PaymentSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings')
      setSettings(res.data)
    } catch (err) {
      setError('Erro ao carregar configurações de pagamento.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      await api.put('/admin/settings', settings)
      alert('Configurações de pagamento salvas com sucesso!')
    } catch (err) {
      setError('Erro ao salvar configurações.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setSettings(prev => ({ ...prev, [name]: checked ? 'true' : 'false' }))
    } else {
      setSettings(prev => ({ ...prev, [name]: value }))
    }
  }

  return (
    <AdminLayout
      title="Meios de Pagamento"
      description="Configure as integrações com Mercado Pago e opções disponíveis no checkout"
      actions={
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2 bg-lilac-500 hover:bg-lilac-600"
        >
          <Save size={16} />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      }
    >
      {isLoading ? (
        <div className="p-8 text-center text-ink-500">Carregando...</div>
      ) : (
        <>
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-4">{error}</div>}

      <div className="bg-white border border-ink-200 rounded-xl p-6 space-y-8">
        {/* Integração Mercado Pago */}
        <section>
          <h3 className="text-lg font-display text-ink-800 mb-4">Credenciais Mercado Pago</h3>
          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-800">Public Key (Frontend)</label>
              <Input
                name="mp_public_key"
                value={settings.mp_public_key || ''}
                onChange={handleChange}
                placeholder="TEST-00000000-0000-0000-0000-000000000000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-800">Access Token (Backend)</label>
              <Input
                name="mp_access_token"
                type="password"
                value={settings.mp_access_token || ''}
                onChange={handleChange}
                placeholder="APP_USR-0000000000000000-000000-00000000000000000000000000000000"
              />
            </div>
          </div>
        </section>

        <hr className="border-ink-200" />

        {/* Métodos de Pagamento */}
        <section>
          <h3 className="text-lg font-display text-ink-800 mb-4">Métodos Aceitos</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 border border-ink-200 rounded-lg cursor-pointer hover:bg-ink-50 transition-colors">
              <input
                type="checkbox"
                name="payment_pix_enabled"
                checked={settings.payment_pix_enabled === 'true'}
                onChange={handleChange}
                className="w-5 h-5 rounded border-ink-300 text-lilac-500 focus:ring-lilac-500"
              />
              <div>
                <p className="font-semibold text-ink-800">PIX</p>
                <p className="text-sm text-ink-500">Aceitar pagamentos instantâneos via QR Code ou copia-e-cola.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-ink-200 rounded-lg cursor-pointer hover:bg-ink-50 transition-colors">
              <input
                type="checkbox"
                name="payment_card_enabled"
                checked={settings.payment_card_enabled === 'true'}
                onChange={handleChange}
                className="w-5 h-5 rounded border-ink-300 text-lilac-500 focus:ring-lilac-500"
              />
              <div>
                <p className="font-semibold text-ink-800">Cartão de Crédito</p>
                <p className="text-sm text-ink-500">Aceitar pagamentos por cartão via Mercado Pago.</p>
              </div>
            </label>
          </div>
        </section>

        <hr className="border-ink-200" />

        {/* Configurações de Parcelamento */}
        <section>
          <h3 className="text-lg font-display text-ink-800 mb-4">Parcelamento (Cartão)</h3>
          <div className="space-y-2 max-w-sm">
            <label className="text-sm font-semibold text-ink-800">Máximo de Parcelas</label>
            <select
              name="payment_max_installments"
              value={settings.payment_max_installments || '1'}
              onChange={handleChange}
              className="w-full border border-ink-200 rounded-md px-3 py-2 text-sm text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-lilac-500"
            >
              <option value="1">À vista (1x)</option>
              <option value="2">Até 2x</option>
              <option value="3">Até 3x</option>
              <option value="4">Até 4x</option>
              <option value="5">Até 5x</option>
              <option value="6">Até 6x</option>
              <option value="10">Até 10x</option>
              <option value="12">Até 12x</option>
            </select>
          </div>
        </section>
      </div>
        </>
      )}
    </AdminLayout>
  )
}
