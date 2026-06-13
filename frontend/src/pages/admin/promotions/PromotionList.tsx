import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { adminPromotionService } from '@/services/adminPromotionService'
import { PromotionModal } from './PromotionForm'
import { toast } from 'sonner'

export function PromotionList() {
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [modal, setModal] = useState<{ open: boolean; promotionId: number | null }>({ open: false, promotionId: null })

  const loadPromotions = async () => {
    try {
      setLoading(true)
      const result = await adminPromotionService.getAll(1, 100)
      setPromotions(result.data || [])
    } catch (err: any) {
      toast.error('Erro ao carregar promoções')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPromotions()
  }, [])

  const handleDelete = async (items: any[]) => {
    try {
      for (const item of items) {
        await adminPromotionService.delete(item.id)
      }
      toast.success(`${items.length} promoção(ões) deletada(s) com sucesso`)
      loadPromotions()
    } catch (err: any) {
      toast.error('Erro ao deletar promoção(ões)')
    }
  }

  const statusBadge: Record<string, { label: string; className: string }> = {
    active: { label: 'Ativa', className: 'bg-leaf-50 text-leaf-600' },
    expired: { label: 'Expirada', className: 'bg-ink-100 text-ink-500' },
    inactive: { label: 'Inativa', className: 'bg-ink-100 text-ink-500' },
  }

  const filteredPromotions = status === 'all'
    ? promotions
    : promotions.filter(p => p.status === status)

  const columns = [
    { key: 'name', label: 'Nome', sortable: true },
    {
      key: 'discountValue',
      label: 'Desconto',
      sortable: true,
      render: (value: number, row: any) => `${value}${row.discountType === 'percentage' ? '%' : ' R$'}`
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => {
        const badge = statusBadge[value] || { label: value, className: 'bg-ink-100 text-ink-500' }
        return <span className={`text-xs px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
      }
    },
    {
      key: 'validFrom',
      label: 'Válida de',
      sortable: true,
      render: (value: any) => new Date(value).toLocaleDateString('pt-BR')
    },
    {
      key: 'validTo',
      label: 'Válida até',
      sortable: true,
      render: (value: any) => new Date(value).toLocaleDateString('pt-BR')
    }
  ]

  const filters = [
    {
      label: 'Status',
      element: (
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativa</SelectItem>
            <SelectItem value="expired">Expirada</SelectItem>
            <SelectItem value="inactive">Inativa</SelectItem>
          </SelectContent>
        </Select>
      )
    }
  ]

  return (
    <AdminLayout
      title="Promoções"
      description="Gerenciar promoções automáticas de produtos"
    >
      <DataTable
        data={filteredPromotions}
        columns={columns}
        loading={loading}
        searchPlaceholder="Buscar promoções..."
        filters={filters}
        onNewClick={() => setModal({ open: true, promotionId: null })}
        newLabel="Nova Promoção"
        onEdit={(p: any) => setModal({ open: true, promotionId: p.id })}
        onDelete={handleDelete}
      />

      <PromotionModal
        promotionId={modal.promotionId}
        open={modal.open}
        onClose={() => setModal({ open: false, promotionId: null })}
        onSaved={loadPromotions}
      />
    </AdminLayout>
  )
}
