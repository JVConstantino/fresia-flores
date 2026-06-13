import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle, Copy } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { adminWebhookService, type Webhook, type WebhookLog } from '@/services/adminWebhookService'
import { toast } from 'sonner'

const EVENT_OPTIONS = [
  { value: 'order.created', label: 'Pedido criado' },
  { value: 'order.updated', label: 'Pedido atualizado' },
  { value: 'order.paid', label: 'Pagamento confirmado' },
  { value: 'product.low_stock', label: 'Estoque baixo' },
  { value: 'newsletter.subscribed', label: 'Newsletter — nova inscrição' },
  { value: 'testimonial.created', label: 'Novo depoimento' },
]

export function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Webhook | null>(null)
  const [logsOpen, setLogsOpen] = useState(false)
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const [form, setForm] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
    isActive: true,
  })

  const load = async () => {
    try {
      setLoading(true)
      const data = await adminWebhookService.getAll()
      setWebhooks(data)
    } catch {
      toast.error('Erro ao carregar webhooks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', url: '', events: [], secret: '', isActive: true })
    setDialogOpen(true)
  }

  const openEdit = (wh: Webhook) => {
    setEditing(wh)
    let events: string[] = []
    try { events = JSON.parse(wh.events) } catch {}
    setForm({
      name: wh.name,
      url: wh.url,
      events,
      secret: wh.secret ?? '',
      isActive: wh.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.url.trim() || form.events.length === 0) {
      toast.error('Preencha nome, URL e selecione pelo menos um evento')
      return
    }
    try {
      if (editing) {
        await adminWebhookService.update(editing.id, {
          ...form,
          secret: form.secret.trim() || null,
        })
        toast.success('Webhook atualizado')
      } else {
        await adminWebhookService.create({
          ...form,
          secret: form.secret.trim() || undefined,
        })
        toast.success('Webhook criado')
      }
      setDialogOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar webhook')
    }
  }

  const handleDelete = async (items: Webhook[]) => {
    try {
      for (const item of items) {
        await adminWebhookService.delete(item.id)
      }
      setWebhooks(prev => prev.filter(w => !items.some(item => item.id === w.id)))
      toast.success(`${items.length} webhook(s) excluído(s)`)
    } catch {
      toast.error('Erro ao excluir webhook(s)')
    }
  }


  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copiada')
  }

  const openLogs = async (wh: Webhook) => {
    setSelectedWebhook(wh)
    setLogsOpen(true)
    try {
      const data = await adminWebhookService.getLogs(wh.id)
      setLogs(data)
    } catch {
      toast.error('Erro ao carregar logs')
    }
  }

  const handleTest = async (wh: Webhook) => {
    try {
      await adminWebhookService.test(wh.id)
      toast.success('Evento de teste enviado')
    } catch {
      toast.error('Erro ao enviar teste')
    }
  }

  const handleToggle = async (wh: Webhook) => {
    try {
      await adminWebhookService.update(wh.id, { isActive: !wh.isActive })
      setWebhooks(prev => prev.map(w => w.id === wh.id ? { ...w, isActive: !w.isActive } : w))
      toast.success(wh.isActive ? 'Webhook desativado' : 'Webhook ativado')
    } catch {
      toast.error('Erro ao atualizar')
    }
  }

  const filteredWebhooks = statusFilter === 'all'
    ? webhooks
    : statusFilter === 'active'
      ? webhooks.filter(w => w.isActive)
      : webhooks.filter(w => !w.isActive)

  const columns = [
    { key: 'name' as const, label: 'Nome', sortable: true },
    {
      key: 'url' as const,
      label: 'URL',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <code className="text-xs text-ink-500 bg-ink-50 px-2 py-0.5 rounded truncate max-w-[300px]">
            {value}
          </code>
          <button onClick={() => copyUrl(value)} className="text-ink-400 hover:text-lilac-600" title="Copiar">
            <Copy size={12} />
          </button>
        </div>
      )
    },
    {
      key: 'events' as const,
      label: 'Eventos',
      render: (value: string) => {
        let events: string[] = []
        try { events = JSON.parse(value) } catch {}
        return (
          <div className="flex flex-wrap gap-1">
            {events.slice(0, 2).map(e => {
              const opt = EVENT_OPTIONS.find(o => o.value === e)
              return (
                <span key={e} className="text-[10px] px-2 py-0.5 bg-lilac-50 text-lilac-600 rounded-full">
                  {opt?.label ?? e}
                </span>
              )
            })}
            {events.length > 2 && (
              <span className="text-[10px] px-2 py-0.5 text-ink-500">+{events.length - 2}</span>
            )}
          </div>
        )
      }
    },
    {
      key: 'isActive' as const,
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'} className="text-[10px]">
          {value ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    }
  ]

  const filters = [
    {
      label: 'Status',
      element: (
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
      title="Webhooks"
      description={`${webhooks.filter(w => w.isActive).length} ativos · ${webhooks.length} total`}
    >
      <div className="space-y-4">
        <div className="text-sm text-ink-500">
          Conecte eventos da loja ao <strong>n8n</strong> ou outras ferramentas.
        </div>

        <DataTable
          data={filteredWebhooks}
          columns={columns}
          loading={loading}
          searchPlaceholder="Buscar webhooks..."
          filters={filters}
          onNewClick={openNew}
          newLabel="Novo Webhook"
          onEdit={openEdit}
          onDelete={handleDelete}
        />

        {/* Extra actions row for test and logs */}
        {filteredWebhooks.length > 0 && (
          <div className="space-y-2">
            {filteredWebhooks.map(wh => (
              <div key={wh.id} className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest(wh)}
                  className="text-xs"
                >
                  Testar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openLogs(wh)}
                  className="text-xs"
                >
                  Logs
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggle(wh)}
                  className="text-xs"
                >
                  {wh.isActive ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Webhook' : 'Novo Webhook'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-ink-700">Nome</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: n8n — Pedidos" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700">URL</label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://n8n.seudominio.com/webhook/..." />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700">Eventos</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                {EVENT_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-ink-200 text-lilac-600 focus:ring-lilac-500"
                      checked={form.events.includes(opt.value)}
                      onChange={e => {
                        const checked = e.target.checked
                        setForm(f => ({
                          ...f,
                          events: checked
                            ? [...f.events, opt.value]
                            : f.events.filter(v => v !== opt.value)
                        }))
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700">Secret (opcional — para assinatura HMAC)</label>
              <Input value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} placeholder="Chave secreta para validar no n8n" type="password" />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                className="rounded border-ink-200 text-lilac-600 focus:ring-lilac-500 w-4 h-4"
                checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              />
              <label className="cursor-pointer text-sm text-ink-700" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                Webhook ativo
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editing ? 'Salvar' : 'Criar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Logs */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Logs — {selectedWebhook?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {logs.length === 0 && (
              <div className="text-center text-sm text-ink-500 py-8">Nenhum log encontrado.</div>
            )}
            {logs.map(log => (
              <div key={log.id} className="border border-ink-200 rounded-lg p-3 text-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {log.success ? <CheckCircle size={14} className="text-leaf-500" /> : <XCircle size={14} className="text-red-400" />}
                    <span className="font-medium text-ink-700">{log.event}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <Clock size={12} />
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                    {log.statusCode && (
                      <Badge variant="outline" className="text-[10px]">HTTP {log.statusCode}</Badge>
                    )}
                  </div>
                </div>
                {log.response && (
                  <div className="text-xs text-ink-500 bg-ink-50 rounded p-2 break-all">
                    {log.response}
                  </div>
                )}
                {!log.success && !log.statusCode && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500">
                    <AlertCircle size={12} />
                    Falha na conexão
                  </div>
                )}
              </div>
            ))}
            {logs.length > 0 && selectedWebhook && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!confirm('Limpar todos os logs deste webhook?')) return
                    try {
                      await adminWebhookService.clearLogs(selectedWebhook.id)
                      setLogs([])
                      toast.success('Logs limpos')
                    } catch {
                      toast.error('Erro ao limpar logs')
                    }
                  }}
                >
                  Limpar logs
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
