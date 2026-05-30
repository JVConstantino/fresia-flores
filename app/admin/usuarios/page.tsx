'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Shield, User } from 'lucide-react'

interface UserData {
  id: number
  name: string
  email: string
  phone?: string
  isAdmin: boolean
  createdAt: string
  _count?: { orders: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data)
    } catch {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleAdmin(userId: number, currentIsAdmin: boolean) {
    try {
      await api.patch(`/admin/users/${userId}`, { isAdmin: !currentIsAdmin })
      setUsers(users.map(u => u.id === userId ? { ...u, isAdmin: !currentIsAdmin } : u))
      toast.success(currentIsAdmin ? 'Admin removido' : 'Admin promovido')
    } catch {
      toast.error('Erro ao atualizar usuário')
    }
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12 text-ink-500">Carregando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-ink-900">Usuários</h1>
        <div className="text-sm text-ink-500">{users.length} usuários</div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Buscar usuários..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Usuário</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Telefone</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Pedidos</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Tipo</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Cadastro</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider text-ink-500 px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-ink-100 hover:bg-ink-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lilac-200 to-petal-200 flex items-center justify-center text-sm font-medium text-ink-800">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-800">{user.name}</p>
                        <p className="text-xs text-ink-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-ink-600">{user.phone || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-ink-600">{user._count?.orders || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      user.isAdmin ? 'bg-lilac-100 text-lilac-700' : 'bg-ink-100 text-ink-700'
                    }`}>
                      {user.isAdmin ? <Shield size={10} /> : <User size={10} />}
                      {user.isAdmin ? 'Admin' : 'Cliente'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-ink-500">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                        title={user.isAdmin ? 'Remover admin' : 'Tornar admin'}
                      >
                        <Shield size={14} className={user.isAdmin ? 'text-lilac-500' : 'text-ink-400'} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
