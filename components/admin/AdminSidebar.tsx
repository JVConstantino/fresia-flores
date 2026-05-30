'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, ChevronRight, Home, Package, Truck, ShoppingBag, Tag, Lightbulb, Ticket, Mail, MessageSquare, Webhook, Users, Boxes, ClipboardList, Layout, Image as ImageIcon, FileText, ScrollText, Monitor, BarChart3 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const NAV_STRUCTURE = [
  {
    group: 'Geral',
    items: [
      { label: 'Dashboard', path: '/admin', icon: Home },
      { label: 'PDV', path: '/admin/pdv', icon: Monitor },
      { label: 'Analises', path: '/admin/analises', icon: BarChart3 },
      { label: 'Pedidos', path: '/admin/pedidos', icon: Package },
      { label: 'Fretes', path: '/admin/fretes', icon: Truck },
    ]
  },
  {
    group: 'Catálogo',
    items: [
      { label: 'Produtos', path: '/admin/produtos', icon: ShoppingBag },
      { label: 'Categorias', path: '/admin/categorias', icon: Tag },
      { label: 'Galeria', path: '/admin/midias', icon: ImageIcon },
    ]
  },
  {
    group: 'Marketing',
    items: [
      { label: 'Promoções', path: '/admin/promocoes', icon: Lightbulb },
      { label: 'Cupons', path: '/admin/cupons', icon: Ticket },
      { label: 'Blog', path: '/admin/blog', icon: FileText },
      { label: 'Newsletter', path: '/admin/newsletter', icon: Mail },
      { label: 'Depoimentos', path: '/admin/depoimentos', icon: MessageSquare },
      { label: 'Conteúdo', path: '/admin/conteudo', icon: Layout },
    ]
  },
  {
    group: 'Gestão',
    items: [
      { label: 'Usuários', path: '/admin/usuarios', icon: Users },
      { label: 'Estoque', path: '/admin/estoque', icon: Boxes },
      { label: 'Suprimentos', path: '/admin/suprimentos', icon: ScrollText },
      { label: 'Auditoria', path: '/admin/auditoria', icon: ClipboardList },
    ]
  },
  {
    group: 'Configurações',
    items: [
      { label: 'Loja', path: '/admin/configuracoes', icon: Home },
      { label: 'Pagamentos', path: '/admin/pagamentos', icon: ShoppingBag },
      { label: 'Webhooks', path: '/admin/webhooks', icon: Webhook },
    ]
  }
]

interface AdminSidebarProps {
  className?: string
  onNavigate?: () => void
}

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthStore()
  const navRef = useRef<HTMLElement | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const saved = sessionStorage.getItem('admin-sidebar-scroll')
    if (saved) nav.scrollTop = Number(saved)

    const onScroll = () => {
      sessionStorage.setItem('admin-sidebar-scroll', String(nav.scrollTop))
    }

    nav.addEventListener('scroll', onScroll)
    return () => nav.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (path: string) => {
    if (path === '/admin') return pathname === '/admin'
    return pathname.startsWith(path)
  }

  const filteredNav = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return NAV_STRUCTURE

    return NAV_STRUCTURE
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.label.toLowerCase().includes(term)),
      }))
      .filter((section) => section.items.length > 0)
  }, [query])

  return (
    <aside className={cn('sticky top-4 h-[calc(100vh-32px)] bg-white border border-ink-200 rounded-lg p-5 flex flex-col gap-3', className)}>
      {/* Logo */}
      <div className="flex items-center justify-between pb-5 border-b border-ink-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-lilac-500 rounded-md flex items-center justify-center text-white text-sm font-bold">F</div>
          <span className="text-sm font-semibold text-ink-900">Frésia</span>
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-7 h-7 rounded-md bg-ink-100 text-ink-600 hover:bg-ink-200 flex items-center justify-center"
          title="Voltar à loja"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 bg-ink-50 border border-ink-200 rounded-md">
        <Search size={14} className="text-ink-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar seção..."
          className="bg-transparent text-xs text-ink-700 outline-none flex-1 placeholder-ink-500"
        />
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="flex-1 overflow-y-auto space-y-5">
        {filteredNav.map((section, idx) => (
          <div key={idx}>
            <div className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider px-3 py-1 mb-1">
              {section.group}
            </div>
            <ul className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => { router.push(item.path); onNavigate?.() }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
                        isActive(item.path)
                          ? 'bg-lilac-500 text-white'
                          : 'text-ink-700 hover:bg-ink-50'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
        {filteredNav.length === 0 && (
          <div className="px-3 py-6 text-xs text-ink-500">Nenhuma opção encontrada.</div>
        )}
      </nav>

      {/* User Card */}
      <div className="pt-3 border-t border-ink-200">
        <div className="flex items-center gap-3 px-3 py-2 bg-ink-50 rounded-md">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lilac-400 to-petal-400" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-ink-900">{user?.name || 'Admin'}</div>
            <div className="text-[11px] text-ink-500">Gerenciador</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
