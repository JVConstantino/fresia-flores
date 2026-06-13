import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { api } from '@/lib/axios'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function SettingsPage() {
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
      setError('Erro ao carregar configurações.')
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
      alert('Configurações salvas com sucesso!')
    } catch (err) {
      setError('Erro ao salvar configurações.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings(prev => ({ ...prev, [name]: value }))
  }

  return (
    <AdminLayout
      title="Configurações da Loja"
      description="Gerencie as informações gerais da sua loja"
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

      <div className="bg-white rounded-lg p-6">
        <form id="settings-form" onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-800">Nome da Loja</label>
              <Input
                name="store_name"
                value={settings.store_name || ''}
                onChange={handleChange}
                placeholder="Ex: Frésia"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-800">Horário de Funcionamento</label>
              <Input
                name="store_hours"
                value={settings.store_hours || ''}
                onChange={handleChange}
                placeholder="Ex: Seg a Sex, 09h às 18h"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-800">WhatsApp</label>
              <Input
                name="store_whatsapp"
                value={settings.store_whatsapp || ''}
                onChange={handleChange}
                placeholder="Ex: 11999999999"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-800">Instagram</label>
              <Input
                name="store_instagram"
                value={settings.store_instagram || ''}
                onChange={handleChange}
                placeholder="Ex: @fresia.flores"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-800">Endereço</label>
              <Input
                name="store_address"
                value={settings.store_address || ''}
                onChange={handleChange}
                placeholder="Ex: Rua das Flores, 123"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-800">Cidade e Estado</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  name="store_city"
                  value={settings.store_city || ''}
                  onChange={handleChange}
                  placeholder="Cidade"
                />
                <Input
                  name="store_state"
                  value={settings.store_state || ''}
                  onChange={handleChange}
                  placeholder="Estado"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-800">Pedido Mínimo (R$)</label>
              <Input
                name="min_order_value"
                type="number"
                step="0.01"
                min="0"
                value={settings.min_order_value || '0'}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-800">Frete Grátis Acima de (R$)</label>
              <Input
                name="free_shipping_above"
                type="number"
                step="0.01"
                min="0"
                value={settings.free_shipping_above || '0'}
                onChange={handleChange}
                placeholder="0 para desativar"
              />
              <p className="text-xs text-ink-500">Valor em R$. Use 0 para desativar o frete grátis.</p>
            </div>
          </div>
        </form>
      </div>
        </>
      )}
    </AdminLayout>
  )
}
