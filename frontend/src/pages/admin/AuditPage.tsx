import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { auditService, type AuditLog } from '@/services/auditService'
import { toast } from 'sonner'

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-leaf-100 text-leaf-600',
  update: 'bg-lilac-100 text-lilac-600',
  delete: 'bg-red-100 text-red-600',
  in: 'bg-leaf-100 text-leaf-600',
  out: 'bg-red-100 text-red-600',
  adjustment: 'bg-amber-100 text-amber-700',
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Criou',
  update: 'Editou',
  delete: 'Removeu',
  in: 'Entrada',
  out: 'Saida',
  adjustment: 'Ajuste',
}

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const result = await auditService.list(page, 20, entityFilter || undefined)
      setLogs(result.items)
      setTotal(result.total)
    } catch {
      toast.error('Erro ao carregar logs de auditoria')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, entityFilter])

  const totalPages = Math.ceil(total / 20)

  return (
    <AdminLayout title="Auditoria" description={`${total} ações registradas`}>
      <div className="p-6 space-y-6">
        <div className="flex gap-2">
          <select
            className="text-sm border border-ink-200 rounded-lg px-3 py-1.5 bg-white"
            value={entityFilter}
            onChange={e => { setEntityFilter(e.target.value); setPage(1) }}
          >
            <option value="">Todas as entidades</option>
             <option value="user">Usuários</option>
             <option value="order">Pedidos</option>
             <option value="supply">Estoque</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-ink-500">Carregando...</div>
        ) : (
          <>
            <div className="space-y-2">
              {logs.map(log => (
                <Card key={log.id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-ink-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className={ACTION_COLORS[log.action] || 'bg-ink-100'}>
                        {ACTION_LABELS[log.action] || log.action}
                      </Badge>
                      <span className="text-ink-700 font-medium">{log.entity}</span>
                      <span className="text-ink-400 text-xs">{log.entityId.slice(0, 8)}</span>
                    </div>
                    {log.diff && (
                      <div className="text-xs text-ink-500 mt-0.5 truncate max-w-xl">{log.diff}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-ink-400">{log.userId ? log.userId.slice(0, 8) : 'sistema'}</div>
                    <div className="text-[10px] text-ink-400">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </Card>
              ))}

              {logs.length === 0 && (
                <div className="text-center py-16 text-ink-500 text-sm">
                  Nenhum log de auditoria encontrado.
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Anterior
                </Button>
                <span className="text-sm text-ink-500 px-3 py-1">{page} de {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Próximo
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
