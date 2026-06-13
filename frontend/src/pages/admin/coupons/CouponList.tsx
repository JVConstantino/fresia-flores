import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { adminCouponService } from '@/services/adminCouponService'
import { CouponModal } from './CouponForm'
import { toast } from 'sonner'

export function CouponList() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [modal, setModal] = useState<{ open: boolean; couponId: number | null }>({ open: false, couponId: null })

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    try {
      setLoading(true)
      const result = await adminCouponService.getAll(1, 100)
      setCoupons(result.data || [])
    } catch (err: any) {
      toast.error('Erro ao carregar cupons')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (coupons: any[]) => {
    try {
      for (const coupon of coupons) {
        await adminCouponService.delete(coupon.id)
      }
      toast.success(`${coupons.length} cupom(ns) deletado(s)`)
      loadCoupons()
    } catch (err: any) {
      toast.error('Erro ao deletar cupons')
    }
  }

  const statusBadge: Record<string, { label: string; className: string }> = {
    active: { label: 'Ativo', className: 'bg-leaf-50 text-leaf-600' },
    expired: { label: 'Expirado', className: 'bg-ink-100 text-ink-500' },
    inactive: { label: 'Inativo', className: 'bg-ink-100 text-ink-500' },
    esgotado: { label: 'Esgotado', className: 'bg-petal-50 text-petal-600' },
  }

  const filteredCoupons = statusFilter && statusFilter !== 'all'
    ? coupons.filter(c => c.status === statusFilter)
    : coupons

  const columns = [
    {
      key: 'code',
      label: 'Código',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono font-semibold text-lilac-600 bg-lilac-50 px-2 py-0.5 rounded text-xs">
          {value}
        </span>
      )
    },
    {
      key: 'discountValue',
      label: 'Desconto',
      sortable: true,
      render: (value: number, row: any) => `${value}${row.discountType === 'percentage' ? '%' : ' R$'}`
    },
    {
      key: 'usedCount',
      label: 'Usos',
      sortable: true,
      render: (value: number, row: any) => row.maxUses ? `${value}/${row.maxUses}` : `${value}`
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
      label: 'Válido de',
      sortable: true,
      render: (value: any) => new Date(value).toLocaleDateString('pt-BR')
    },
    {
      key: 'validTo',
      label: 'Até',
      sortable: true,
      render: (value: any) => new Date(value).toLocaleDateString('pt-BR')
    }
  ]

  const filters = [
    {
      label: 'Status',
      element: (
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? null : v)}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="expired">Expirados</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="esgotado">Esgotados</SelectItem>
          </SelectContent>
        </Select>
      )
    }
  ]

  return (
    <AdminLayout
      title="Cupons"
      description="Gerenciar cupons de desconto"
    >
      <DataTable
        data={filteredCoupons}
        columns={columns}
        loading={loading}
        filters={filters}
        onNewClick={() => setModal({ open: true, couponId: null })}
        newLabel="Novo Cupom"
        onEdit={(c: any) => setModal({ open: true, couponId: c.id })}
        onDelete={handleDelete}
        searchPlaceholder="Buscar por código..."
      />

      <CouponModal
        couponId={modal.couponId}
        open={modal.open}
        onClose={() => setModal({ open: false, couponId: null })}
        onSaved={loadCoupons}
      />
    </AdminLayout>
  )
}
