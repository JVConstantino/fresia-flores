import { useState, useEffect } from 'react'
import { Search, Users, ShieldOff, Shield } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminUserService, type AdminUser } from '@/services/adminUserService'
import { UserDrawer } from '@/components/admin/UserDrawer'
import { toast } from 'sonner'

function formatPrice(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | 'active' | 'suspended'>('')
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPhone, setCreatePhone] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createRole, setCreateRole] = useState<'buyer' | 'admin'>('buyer')
  const [creating, setCreating] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  function load() {
    setLoading(true)
    adminUserService
      .list({ search: search || undefined, status: status || undefined, page })
      .then(res => {
        setUsers(res.data)
        setTotal(res.pagination.total)
      })
      .catch(() => toast.error('Erro ao carregar usuários'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, status, page])

  async function handleCreateUser() {
    if (!createName || !createEmail || !createPassword) {
      toast.error('Preencha nome, email e senha')
      return
    }
    setCreating(true)
    try {
      await adminUserService.create({
        name: createName,
        email: createEmail,
        password: createPassword,
        phone: createPhone || undefined,
        role: createRole,
      })
      toast.success('Usuário criado com sucesso')
      setShowCreate(false)
      setCreateName('')
      setCreateEmail('')
      setCreatePhone('')
      setCreatePassword('')
      setCreateRole('buyer')
      load()
    } catch {
      toast.error('Erro ao criar usuário')
    } finally {
      setCreating(false)
    }
  }

  const totalPages = Math.ceil(total / 20)
  const allSelected = users.length > 0 && users.every((u) => selectedIds.includes(u.id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([])
      return
    }
    setSelectedIds(users.map((u) => u.id))
  }

  function toggleSelectUser(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleBulkSuspend(isSuspended: boolean) {
    if (selectedIds.length === 0) {
      toast.error('Selecione ao menos um usuário')
      return
    }
    setBulkLoading(true)
    try {
      await Promise.all(selectedIds.map((id) => adminUserService.suspend(id, isSuspended)))
      toast.success(`${selectedIds.length} usuário(s) ${isSuspended ? 'suspenso(s)' : 'reativado(s)'}`)
      setSelectedIds([])
      load()
    } catch {
      toast.error('Erro ao atualizar usuários em lote')
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <AdminLayout title="Usuários" description="Gerencie os usuários cadastrados">
      <div className="p-1 sm:p-2 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-lilac-500" />
            <h1 className="text-2xl font-semibold text-ink-800">Usuários</h1>
            <span className="text-sm text-ink-400 bg-ink-100 px-2 py-0.5 rounded-full">{total}</span>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-lilac-500 text-white rounded-lg text-sm font-semibold hover:bg-lilac-600"
          >
            Novo usuário
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 min-w-0">
          <div className="relative flex-1 sm:max-w-xs min-w-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar por nome ou email..."
              className="w-full pl-9 pr-3 py-2 border border-ink-200 rounded-lg text-sm"
            />
          </div>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value as any); setPage(1) }}
            className="px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white w-full sm:w-auto"
          >
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="suspended">Suspensos</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <p className="text-sm text-ink-500">{selectedIds.length} selecionado(s)</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleBulkSuspend(true)}
              disabled={bulkLoading || selectedIds.length === 0}
              className="px-3 py-1.5 border border-red-300 text-red-700 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
            >
              Suspender selecionados
            </button>
            <button
              onClick={() => handleBulkSuspend(false)}
              disabled={bulkLoading || selectedIds.length === 0}
              className="px-3 py-1.5 border border-green-300 text-green-700 rounded-lg text-sm hover:bg-green-50 disabled:opacity-50"
            >
              Reativar selecionados
            </button>
            <button
              onClick={() => setSelectedIds([])}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 border border-ink-200 text-ink-600 rounded-lg text-sm hover:bg-ink-50 disabled:opacity-50"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-ink-200 overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50">
                <th className="text-center px-3 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wider">Usuário</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wider hidden md:table-cell">Telefone</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wider hidden lg:table-cell">Cadastro</th>
                <th className="text-center px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wider hidden md:table-cell">Pedidos</th>
                <th className="text-right px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wider hidden lg:table-cell">Total gasto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-ink-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-ink-400">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className="hover:bg-ink-50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-lilac-100 text-lilac-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-ink-800">{user.name}</p>
                          <p className="text-xs text-ink-500">{user.email}</p>
                        </div>
                        {user.isAdmin && (
                          <span className="text-[10px] bg-lilac-100 text-lilac-700 px-1.5 py-0.5 rounded-full font-semibold">Admin</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600 hidden md:table-cell">{user.phone || '—'}</td>
                    <td className="px-4 py-3 text-ink-500 hidden lg:table-cell">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      {user.isSuspended ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                          <ShieldOff size={10} /> Suspenso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                          <Shield size={10} /> Ativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-700 hidden md:table-cell">{user.orderCount}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink-800 hidden lg:table-cell">{formatPrice(user.totalSpent)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-2">
            <p className="text-sm text-ink-500">
              Página {page} de {totalPages} — {total} usuários
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border border-ink-200 rounded-lg text-sm disabled:opacity-40 hover:bg-ink-50"
              >
                Anterior
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-ink-200 rounded-lg text-sm disabled:opacity-40 hover:bg-ink-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      <UserDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onUserUpdated={load}
      />

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-ink-200 p-5 space-y-3">
            <h3 className="text-lg font-semibold text-ink-800">Cadastrar usuário</h3>
            <input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Nome" className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm" />
            <input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm" />
            <input value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} placeholder="Telefone (opcional)" className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm" />
            <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="Senha" className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm" />
            <select value={createRole} onChange={(e) => setCreateRole(e.target.value as 'buyer' | 'admin')} className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white">
              <option value="buyer">Comprador</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2 pt-2">
              <button onClick={handleCreateUser} disabled={creating} className="flex-1 px-4 py-2 bg-lilac-500 text-white rounded-lg text-sm font-semibold hover:bg-lilac-600 disabled:bg-lilac-300">
                {creating ? 'Criando...' : 'Criar usuário'}
              </button>
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-ink-200 text-ink-700 rounded-lg text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
