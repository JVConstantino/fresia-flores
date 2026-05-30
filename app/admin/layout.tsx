'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { 
  LayoutDashboard, Package, ShoppingCart, Tag, Users, 
  BarChart3, FileText, Webhook, Settings, LogOut,
  FolderOpen, Percent, ClipboardList
} from 'lucide-react'

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/categorias', label: 'Categorias', icon: FolderOpen },
  { href: '/admin/usuarios', label: 'Usuários', icon: Users },
  { href: '/admin/estoque', label: 'Estoque', icon: BarChart3 },
  { href: '/admin/auditoria', label: 'Auditoria', icon: ClipboardList },
  { href: '/admin/cupons', label: 'Cupons', icon: Tag },
  { href: '/admin/promocoes', label: 'Promoções', icon: Percent },
  { href: '/admin/webhooks', label: 'Webhooks', icon: Webhook },
  { href: '/admin/conteudo', label: 'Conteúdo', icon: FileText },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/admin')
      return
    }
    if (!user.isAdmin) {
      router.push('/')
      return
    }
  }, [user])

  if (!user?.isAdmin) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-ink-200 flex flex-col">
        <div className="p-6 border-b border-ink-200">
          <Link href="/admin" className="font-display italic text-2xl text-lilac-500">
            Frésia Admin
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-600 hover:bg-lilac-50 hover:text-lilac-700 transition-colors"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-ink-200">
          <button
            onClick={() => { logout(); router.push('/') }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
