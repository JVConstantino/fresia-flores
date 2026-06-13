import { ReactNode, useState } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { BlurFade } from '@/components/ui/blur-fade'
import { Menu, X } from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
  title: string
  description?: string
  actions?: ReactNode
}

export function AdminLayout({ children, title, description, actions }: AdminLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#eceaf2] overflow-x-hidden">
      <div className="md:hidden sticky top-0 z-30 bg-[#eceaf2] px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileSidebarOpen(true)} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-ink-700" aria-label="Abrir menu admin">
          <Menu size={18} />
        </button>
        <span className="text-sm font-semibold text-ink-800">Painel Admin</span>
        <div className="w-10" />
      </div>

      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/35" onClick={() => setMobileSidebarOpen(false)} aria-label="Fechar menu" />
          <div className="absolute left-0 top-0 h-full w-[88%] max-w-[320px] p-3">
            <div className="absolute right-5 top-5 z-10">
              <button onClick={() => setMobileSidebarOpen(false)} className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-ink-700" aria-label="Fechar menu admin">
                <X size={16} />
              </button>
            </div>
            <AdminSidebar className="h-full rounded-lg" onNavigate={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="grid gap-0 p-4 sm:p-5 md:p-6 md:grid-cols-[260px_minmax(0,1fr)]">
        <AdminSidebar className="hidden md:flex" />
        <main className="flex flex-col md:pl-5 min-w-0">
          <BlurFade delay={0.05} className="flex flex-col gap-4">
            <AdminHeader title={title} description={description} actions={actions} />
            {children}
          </BlurFade>
        </main>
      </div>
    </div>
  )
}
