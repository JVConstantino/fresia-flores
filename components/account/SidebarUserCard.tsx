'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { LogOut, Upload } from 'lucide-react'

interface Stats {
  orderCount: number
  totalSpent: number
  addressCount: number
  cardCount: number
}

interface SidebarUserCardProps {
  stats: Stats
  onLogout: () => void
}

export function SidebarUserCard({ stats, onLogout }: SidebarUserCardProps) {
  const { user, setUserAvatar } = useAuthStore()
  const [uploading, setUploading] = useState(false)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const { data } = await api.post('/account/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUserAvatar(data.avatarUrl)
      toast.success('Avatar atualizado com sucesso')
    } catch (err) {
      toast.error('Erro ao fazer upload do avatar')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const memberSinceDate = user
    ? new Date(user.createdAt || new Date()).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : 'Novo cliente'

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-b from-lilac-100 to-transparent">
      {/* Avatar */}
      <div className="relative mb-4">
        <div className="w-32 h-32 rounded-full bg-lilac-500 flex items-center justify-center text-white overflow-hidden">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-4xl font-bold">{getInitials(user?.name || '')}</div>
          )}
        </div>
        <label className="absolute bottom-0 right-0 bg-petal-400 rounded-full p-2 cursor-pointer hover:bg-petal-300 transition-colors">
          <Upload size={16} className="text-white" />
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center">
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* User Info */}
      <h2 className="text-xl font-bold text-ink-800">{user?.name}</h2>
      <p className="text-sm text-ink-500 mb-2">{user?.email}</p>
      <p className="text-xs text-ink-400 mb-6">Cliente desde {memberSinceDate}</p>

      {/* Stats */}
      <div className="w-full space-y-3 mb-6 pb-6 border-b border-ink-200">
        <div className="flex justify-between text-sm">
          <span className="text-ink-600">Pedidos</span>
          <span className="font-bold text-lilac-600">{stats.orderCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-600">Total gasto</span>
          <span className="font-bold text-lilac-600">R$ {stats.totalSpent.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-600">Endereços</span>
          <span className="font-bold text-lilac-600">{stats.addressCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-600">Cartões</span>
          <span className="font-bold text-lilac-600">{stats.cardCount}</span>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-ink-100 hover:bg-ink-200 text-ink-800 rounded-lg transition-colors"
      >
        <LogOut size={16} />
        Sair
      </button>
    </div>
  )
}
