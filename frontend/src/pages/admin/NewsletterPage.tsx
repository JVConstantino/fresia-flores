import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { adminNewsletterService, type NewsletterSubscriber } from '@/services/adminNewsletterService'
import { toast } from 'sonner'

export function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminNewsletterService.getAll()
      .then(setSubscribers)
      .catch(() => toast.error('Erro ao carregar inscrições'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (items: NewsletterSubscriber[]) => {
    try {
      for (const item of items) {
        await adminNewsletterService.delete(item.id)
      }
      setSubscribers(prev => prev.filter(s => !items.some(item => item.id === s.id)))
      toast.success(`${items.length} inscrição(ões) removida(s)`)
    } catch {
      toast.error('Erro ao remover')
    }
  }

  return (
    <AdminLayout title="Newsletter" description={`${subscribers.length} inscritos ativos`}>
      <DataTable
        data={subscribers}
        loading={loading}
        searchPlaceholder="Buscar email..."
        onDelete={handleDelete}
        columns={[
          { key: 'id', label: 'ID', sortable: true },
          { key: 'email', label: 'Email', sortable: true },
          {
            key: 'createdAt',
            label: 'Data',
            sortable: true,
            render: (val: string) =>
              new Date(val).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric'
              })
          },
          {
            key: 'active',
            label: 'Status',
            render: (val: boolean) => (
              <span className={`text-xs px-2 py-0.5 rounded-full ${val ? 'bg-leaf-50 text-leaf-600' : 'bg-ink-100 text-ink-500'}`}>
                {val ? 'Ativo' : 'Inativo'}
              </span>
            )
          }
        ]}
      />
    </AdminLayout>
  )
}
