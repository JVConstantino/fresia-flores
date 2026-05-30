import { api } from '@/lib/axios'

export interface Post {
  id: number
  title: string
  slug: string
  excerpt?: string | null
  body: string
  coverUrl?: string | null
  isPublished: boolean
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface PostListItem {
  id: number
  title: string
  slug: string
  excerpt?: string | null
  coverUrl?: string | null
  publishedAt?: string | null
}

export const postService = {
  async listPublic(limit = 20): Promise<PostListItem[]> {
    const { data } = await api.get<PostListItem[]>('/posts', { params: { limit } })
    return data
  },
  async getBySlug(slug: string): Promise<Post> {
    const { data } = await api.get<Post>(`/posts/${slug}`)
    return data
  },
}

export const adminPostService = {
  async list(page = 1, pageSize = 20) {
    const { data } = await api.get('/admin/posts', { params: { page, pageSize } })
    return data as { items: Post[]; total: number; totalPages: number }
  },
  async get(id: number): Promise<Post> {
    const { data } = await api.get<Post>(`/admin/posts/${id}`)
    return data
  },
  async create(body: Partial<Post>): Promise<Post> {
    const { data } = await api.post<Post>('/admin/posts', body)
    return data
  },
  async update(id: number, body: Partial<Post>): Promise<Post> {
    const { data } = await api.patch<Post>(`/admin/posts/${id}`, body)
    return data
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/posts/${id}`)
  },
}
