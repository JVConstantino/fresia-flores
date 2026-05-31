import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { adminTestimonialService, type Testimonial } from '@/services/adminTestimonialService'
import { toast } from 'sonner'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? 'fill-lilac-500 text-lilac-500' : 'text-ink-200'}
        />
      ))}
    </div>
  )
}

export function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    adminTestimonialService.getAll()
      .then(setTestimonials)
      .catch(() => toast.error('Erro ao carregar depoimentos'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (items: Testimonial[]) => {
    try {
      for (const item of items) {
        await adminTestimonialService.delete(item.id)
      }
      setTestimonials(prev => prev.filter(t => !items.some(item => item.id === t.id)))
      toast.success(`${items.length} depoimento(s) excluído(s)`)
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const filtered = testimonials.filter(t => {
    if (filter === 'active') return t.isActive
    if (filter === 'inactive') return !t.isActive
    return true
  })

  const columns = [
    { key: 'clientName' as const, label: 'Cliente', sortable: true },
    {
      key: 'rating' as const,
      label: 'Avaliação',
      sortable: true,
      render: (value: number) => <StarRating rating={value} />
    },
    {
      key: 'text' as const,
      label: 'Depoimento',
      render: (value: string) => (
        <div className="line-clamp-2 text-sm text-ink-600">{value}</div>
      )
    },
    {
      key: 'createdAt' as const,
      label: 'Data',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    },
    {
      key: 'isActive' as const,
      label: 'Status',
      render: (value: boolean) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          value ? 'bg-leaf-50 text-leaf-600' : 'bg-ink-100 text-ink-500'
        }`}>
          {value ? 'Ativo' : 'Inativo'}
        </span>
      )
    }
  ]

  const filters = [
    {
      label: 'Status',
      element: (
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      )
    }
  ]

  return (
    <AdminLayout
      title="Depoimentos"
      description={`${testimonials.filter(t => t.isActive).length} ativos · ${testimonials.filter(t => !t.isActive).length} inativos`}
    >
      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        searchPlaceholder="Buscar depoimentos..."
        filters={filters}
        onDelete={handleDelete}
      />
    </AdminLayout>
  )
}
