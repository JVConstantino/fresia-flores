import { api } from '@/lib/axios'

export interface Media {
  id: number
  url: string
  filename: string
  mimeType: string
  size: number
  alt?: string | null
  createdAt: string
}

export const mediaService = {
  async list(params?: { page?: number; pageSize?: number; search?: string }) {
    const { data } = await api.get('/admin/media', { params })
    return data as { items: Media[]; total: number; page: number; pageSize: number; totalPages: number }
  },
  async upload(file: File): Promise<Media> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post<Media>('/admin/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/media/${id}`)
  },
  async sync(): Promise<{ added: number; total: number }> {
    const { data } = await api.post('/admin/media/sync')
    return data
  },
}
