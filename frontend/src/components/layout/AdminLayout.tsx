import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/fretes', label: 'Cidades e Fretes' },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, setUser } = useAuthStore()

  const handleLogout = async () => {
    await authService.logout()
    setUser(null)
    window.location.href = '/'
  }

  return (
    <div className="flex h-screen bg-ink-50">
      <aside className="w-60 bg-ink-800 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-ink-700">
          <a href="/" className="font-display italic text-2xl text-lilac-500">Fresia</a>
          <p className="text-[10px] text-ink-500 mt-0.5">Painel Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="block px-3 py-2 rounded-lg text-sm text-ink-300 hover:bg-ink-700 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-ink-700">
          <p className="text-xs text-ink-400 mb-2 truncate">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-ink-400 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
