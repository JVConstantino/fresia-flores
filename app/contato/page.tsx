'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('Preencha nome, e-mail e mensagem')
      return
    }
    setSending(true)
    try {
      await api.post('/newsletter', { email: form.email, name: form.name })
      setSent(true)
      toast.success('Mensagem enviada! Retornaremos em breve.')
    } catch {
      toast.error('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  const infos = [
    { icon: MapPin, label: 'Endereço', value: 'Rua das Flores, 123\nSão Paulo — SP' },
    { icon: Phone, label: 'Telefone', value: '(11) 99999-9999' },
    { icon: Mail, label: 'E-mail', value: 'contato@fresia.com.br' },
    { icon: Clock, label: 'Horário', value: 'Seg–Sáb: 08h às 20h\nDom: 09h às 16h' },
  ]

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-lilac-50 to-petal-50 py-16 px-6 text-center">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-lilac-500 bg-lilac-100 px-3 py-1 rounded-full mb-4">
          Fale conosco
        </span>
        <h1 className="font-display italic text-5xl text-ink-900 mb-4">Estamos aqui<br />para <em className="text-lilac-500">ajudar</em></h1>
        <p className="text-ink-500 max-w-lg mx-auto">
          Dúvidas sobre pedidos, entregas ou arranjos personalizados? Nossa equipe responde rapidamente.
        </p>
      </section>

      <section className="py-16 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12">
        {/* Informações */}
        <div className="space-y-8">
          <div>
            <h2 className="font-display italic text-2xl text-ink-800 mb-6">Informações de contato</h2>
            <div className="space-y-5">
              {infos.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-lilac-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-lilac-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-0.5">{label}</p>
                    <p className="text-sm text-ink-700 whitespace-pre-line">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle size={24} className="text-green-600" />
              <h3 className="font-semibold text-ink-800">WhatsApp</h3>
            </div>
            <p className="text-sm text-ink-500 mb-4">Resposta mais rápida pelo WhatsApp. Clique para iniciar uma conversa!</p>
            <a
              href="https://wa.me/5511999999999?text=Olá!%20Vim%20pelo%20site%20da%20Frésia%20e%20gostaria%20de%20mais%20informações."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <MessageCircle size={16} /> Chamar no WhatsApp
            </a>
          </div>

          {/* Mapa placeholder */}
          <div className="bg-gradient-to-br from-lilac-100 to-petal-100 rounded-2xl h-48 flex items-center justify-center">
            <div className="text-center">
              <MapPin size={32} className="text-lilac-400 mx-auto mb-2" />
              <p className="text-sm text-ink-500">Rua das Flores, 123 — São Paulo</p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-white border border-ink-200 rounded-2xl p-8">
          <h2 className="font-display italic text-2xl text-ink-800 mb-6">Envie sua mensagem</h2>

          {sent ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">💌</div>
              <h3 className="font-display text-2xl text-ink-800 mb-2">Mensagem enviada!</h3>
              <p className="text-ink-500 mb-6">Retornaremos em breve.</p>
              <Button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }} variant="outline">
                Enviar outra mensagem
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-1 block">Nome *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-1 block">E-mail *</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-1 block">Telefone</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-1 block">Assunto</label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="Assunto da mensagem"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700 mb-1 block">Mensagem *</label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Escreva sua mensagem..."
                  rows={5}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="w-full bg-lilac-500 hover:bg-lilac-600 text-white"
                size="lg"
              >
                {sending ? 'Enviando...' : 'Enviar Mensagem'}
              </Button>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
