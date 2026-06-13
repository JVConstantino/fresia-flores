import { useState, useEffect } from 'react'
import { Mail, Key, Eye, EyeOff, Send, CheckCircle, AlertCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/axios'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { SectionCard } from '@/components/admin/SectionCard'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface SystemTemplate {
  key: string
  label: string
  description: string
  vars: string[]
}

const TEMPLATES: SystemTemplate[] = [
  { key: 'welcome',            label: 'Boas-vindas',           description: 'Enviado ao criar uma conta',            vars: ['nome'] },
  { key: 'password_reset',     label: 'Redefinição de senha',  description: 'Link para criar nova senha',            vars: ['nome'] },
  { key: 'order_confirmation', label: 'Pedido confirmado',     description: 'Confirmação após compra',               vars: ['nome', 'pedido', 'total', 'entrega', 'itens'] },
  { key: 'order_status',       label: 'Atualização de status', description: 'Quando o status do pedido muda',        vars: ['nome', 'pedido', 'status'] },
  { key: 'order_delivered',    label: 'Pedido entregue',       description: 'Ao marcar pedido como entregue',        vars: ['nome', 'pedido'] },
  { key: 'review_request',     label: 'Pedir avaliação',       description: 'Solicitação de avaliação pós-entrega',  vars: ['nome', 'pedido'] },
]

interface CustomTemplate {
  id: string
  name: string
  subject: string
  heading: string
  body: string
}

function parseCustoms(raw: string | undefined): CustomTemplate[] {
  try {
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/* ── Modal de edição (sistema e personalizado) ─────────────────────────── */

interface TemplateModalState {
  open: boolean
  system?: SystemTemplate
  custom?: CustomTemplate | null // null = novo personalizado
}

interface TemplateModalProps {
  state: TemplateModalState
  settings: Record<string, string>
  onClose: () => void
  onSaved: () => void
  testTo: string
  hasApiKey: boolean
}

function TemplateModal({ state, settings, onClose, onSaved, testTo, hasApiKey }: TemplateModalProps) {
  const isSystem = Boolean(state.system)
  const isNewCustom = !isSystem && !state.custom

  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [heading, setHeading] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (!state.open) return
    if (state.system) {
      setName(state.system.label)
      setSubject(settings[`email_subject_${state.system.key}`] ?? '')
      setHeading(settings[`email_heading_${state.system.key}`] ?? '')
      setBody(settings[`email_body_${state.system.key}`] ?? '')
    } else if (state.custom) {
      setName(state.custom.name)
      setSubject(state.custom.subject)
      setHeading(state.custom.heading)
      setBody(state.custom.body)
    } else {
      setName('')
      setSubject('')
      setHeading('')
      setBody('Olá, <strong>{{nome}}</strong>!<br><br>')
    }
  }, [state])

  const vars = state.system?.vars ?? ['nome', 'pedido', 'status', 'total']

  async function handleSave() {
    if (!isSystem && !name.trim()) { toast.error('Dê um nome ao modelo'); return }
    if (!subject.trim() || !body.trim()) { toast.error('Assunto e corpo são obrigatórios'); return }
    setSaving(true)
    try {
      if (isSystem && state.system) {
        await api.put('/admin/settings', {
          [`email_subject_${state.system.key}`]: subject,
          [`email_heading_${state.system.key}`]: heading,
          [`email_body_${state.system.key}`]: body,
        })
      } else {
        const customs = parseCustoms(settings.email_custom_templates)
        const updated: CustomTemplate = {
          id: state.custom?.id ?? `tpl_${Date.now()}`,
          name, subject, heading, body,
        }
        const next = state.custom
          ? customs.map(t => t.id === state.custom!.id ? updated : t)
          : [...customs, updated]
        await api.put('/admin/settings', { email_custom_templates: JSON.stringify(next) })
      }
      toast.success('Modelo salvo')
      onSaved()
      onClose()
    } catch {
      toast.error('Erro ao salvar modelo')
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    if (!testTo) { toast.error('Informe o e-mail de teste na tela anterior'); return }
    if (!hasApiKey) { toast.error('Configure a API Key antes de testar'); return }
    if (isNewCustom) { toast.error('Salve o modelo antes de testar'); return }
    setTesting(true)
    try {
      const key = isSystem ? state.system!.key : `custom:${state.custom!.id}`
      await api.post('/admin/email/test', { template: key, to: testTo })
      toast.success(`Teste enviado para ${testTo}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao enviar teste')
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={state.open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isSystem ? `Editar modelo — ${state.system!.label}` : isNewCustom ? 'Novo modelo' : `Editar modelo — ${state.custom!.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {!isSystem && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-ink-700">Nome do modelo *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Aviso de promoção" />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-ink-700">Assunto do e-mail *</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Assunto…" />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-ink-700">Título (dentro do e-mail)</label>
            <Input value={heading} onChange={e => setHeading(e.target.value)} placeholder="Título exibido no corpo do e-mail" />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-ink-700">Corpo do e-mail *</label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={9}
              className="font-mono text-xs leading-relaxed"
              placeholder="Conteúdo em HTML simples…"
            />
            <p className="text-xs text-ink-400">
              Aceita HTML simples (<code>&lt;strong&gt;</code>, <code>&lt;br&gt;</code>…). Variáveis disponíveis:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {vars.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setBody(b => `${b}{{${v}}}`)}
                  className="text-[11px] font-mono bg-lilac-50 text-lilac-700 px-2 py-0.5 rounded-full hover:bg-lilac-100 transition-colors"
                  title="Clique para inserir no corpo"
                >
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-lilac-500 hover:bg-lilac-600 text-white">
            {saving ? 'Salvando…' : 'Salvar modelo'}
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing || isNewCustom} className="gap-1.5">
            <Send size={13} /> {testing ? 'Enviando…' : 'Enviar teste'}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Página ────────────────────────────────────────────────────────────── */

export function EmailSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [testTo, setTestTo] = useState('')
  const [testingTemplate, setTestingTemplate] = useState<string | null>(null)
  const [modal, setModal] = useState<TemplateModalState>({ open: false })

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    try {
      const res = await api.get('/admin/settings')
      setSettings(res.data)
    } catch {
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  function set(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  async function saveConfig() {
    setSaving(true)
    try {
      await api.put('/admin/settings', {
        resend_api_key: settings.resend_api_key ?? '',
        resend_from_email: settings.resend_from_email ?? '',
        resend_from_name: settings.resend_from_name ?? '',
      })
      toast.success('Configurações salvas')
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  async function sendTest(templateKey: string) {
    if (!testTo) { toast.error('Informe o e-mail de destino acima'); return }
    if (!settings.resend_api_key) { toast.error('Configure a API Key antes de testar'); return }
    setTestingTemplate(templateKey)
    try {
      await api.post('/admin/email/test', { template: templateKey, to: testTo })
      toast.success(`E-mail de teste enviado para ${testTo}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao enviar teste')
    } finally {
      setTestingTemplate(null)
    }
  }

  async function deleteCustom(tpl: CustomTemplate) {
    if (!confirm(`Excluir o modelo "${tpl.name}"?`)) return
    try {
      const next = parseCustoms(settings.email_custom_templates).filter(t => t.id !== tpl.id)
      await api.put('/admin/settings', { email_custom_templates: JSON.stringify(next) })
      toast.success('Modelo excluído')
      loadSettings()
    } catch {
      toast.error('Erro ao excluir modelo')
    }
  }

  const hasApiKey = !!settings.resend_api_key
  const customs = parseCustoms(settings.email_custom_templates)

  if (loading) return (
    <AdminLayout title="Configurações de E-mail" description="Resend — templates e credenciais">
      <div className="text-ink-500 text-sm py-8 text-center">Carregando…</div>
    </AdminLayout>
  )

  return (
    <AdminLayout
      title="Configurações de E-mail"
      description="Gerencie os e-mails transacionais da loja via Resend"
    >
      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="bg-ink-100">
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="templates">Modelos</TabsTrigger>
        </TabsList>

        {/* ── Tab: Configuração ─────────────────────────────────────── */}
        <TabsContent value="config" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Credenciais Resend" icon={<Key size={15} />}
              description="Obtenha sua API Key em resend.com">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-ink-700">Resend API Key</label>
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={settings.resend_api_key ?? ''}
                    onChange={e => set('resend_api_key', e.target.value)}
                    placeholder="re_••••••••••••••••"
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-xs text-ink-400">
                  Nunca compartilhe esta chave. Ela fica armazenada somente no banco de dados da loja.
                </p>
              </div>
            </SectionCard>

            <SectionCard title="Remetente" icon={<Mail size={15} />}
              description="Nome e endereço que aparecerão nos e-mails enviados">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-ink-700">Nome do remetente</label>
                <Input
                  value={settings.resend_from_name ?? ''}
                  onChange={e => set('resend_from_name', e.target.value)}
                  placeholder="Frésia Flores"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-ink-700">E-mail do remetente</label>
                <Input
                  type="email"
                  value={settings.resend_from_email ?? ''}
                  onChange={e => set('resend_from_email', e.target.value)}
                  placeholder="contato@fresiaflores.com.br"
                />
                <p className="text-xs text-ink-400">
                  O domínio precisa estar verificado no painel do Resend para que os e-mails sejam entregues.
                </p>
              </div>
            </SectionCard>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={saveConfig} disabled={saving} className="bg-lilac-500 hover:bg-lilac-600 text-white">
              {saving ? 'Salvando…' : 'Salvar configurações'}
            </Button>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${hasApiKey ? 'text-leaf-600' : 'text-ink-400'}`}>
              {hasApiKey
                ? <><CheckCircle size={13} /> API Key configurada</>
                : <><AlertCircle size={13} /> API Key não configurada</>}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Modelos ──────────────────────────────────────────── */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 max-w-sm space-y-1">
              <label className="block text-sm font-medium text-ink-700">E-mail para teste</label>
              <Input
                type="email"
                value={testTo}
                onChange={e => setTestTo(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <Button
              onClick={() => setModal({ open: true, custom: null })}
              className="bg-lilac-500 hover:bg-lilac-600 text-white gap-2 sm:ml-auto"
            >
              <Plus size={14} /> Novo modelo
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {TEMPLATES.map(t => (
              <SectionCard
                key={t.key}
                title={t.label}
                description={t.description}
                icon={<Mail size={14} />}
                actions={
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-7"
                      onClick={() => setModal({ open: true, system: t })}
                    >
                      <Pencil size={12} /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-7"
                      disabled={testingTemplate === t.key || !hasApiKey}
                      onClick={() => sendTest(t.key)}
                    >
                      <Send size={12} />
                      {testingTemplate === t.key ? 'Enviando…' : 'Testar'}
                    </Button>
                  </div>
                }
              >
                <p className="text-sm text-ink-600 truncate">
                  <span className="text-xs font-semibold text-ink-400 uppercase tracking-wide mr-2">Assunto</span>
                  {settings[`email_subject_${t.key}`] || '—'}
                </p>
              </SectionCard>
            ))}

            {customs.map(t => (
              <SectionCard
                key={t.id}
                title={t.name}
                description="Modelo personalizado"
                icon={<Mail size={14} />}
                actions={
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-7"
                      onClick={() => setModal({ open: true, custom: t })}
                    >
                      <Pencil size={12} /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-7"
                      disabled={testingTemplate === `custom:${t.id}` || !hasApiKey}
                      onClick={() => sendTest(`custom:${t.id}`)}
                    >
                      <Send size={12} />
                      {testingTemplate === `custom:${t.id}` ? 'Enviando…' : 'Testar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 text-petal-500 hover:text-petal-600"
                      onClick={() => deleteCustom(t)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                }
              >
                <p className="text-sm text-ink-600 truncate">
                  <span className="text-xs font-semibold text-ink-400 uppercase tracking-wide mr-2">Assunto</span>
                  {t.subject || '—'}
                </p>
              </SectionCard>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <TemplateModal
        state={modal}
        settings={settings}
        onClose={() => setModal({ open: false })}
        onSaved={loadSettings}
        testTo={testTo}
        hasApiKey={hasApiKey}
      />
    </AdminLayout>
  )
}
