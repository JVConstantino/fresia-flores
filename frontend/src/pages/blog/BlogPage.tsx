import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { postService, type PostListItem } from '@/services/postService'

function formatDate(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function BlogPage() {
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    postService.listPublic(30).then(p => setPosts(p)).finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-12">
          <h1 className="font-display italic text-3xl sm:text-5xl text-ink-800 mb-3">
            Blog <span className="text-lilac-500">Frésia</span>
          </h1>
          <p className="text-ink-500">Histórias, dicas e inspirações para o seu dia</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-ink-400">Carregando...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-ink-400">Nenhum post publicado ainda.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {posts.map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="group">
                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-lilac-100 to-petal-100">
                  {p.coverUrl ? (
                    <img src={p.coverUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🌸</div>
                  )}
                </div>
                <p className="text-xs text-lilac-500 uppercase tracking-widest mb-1">{formatDate(p.publishedAt)}</p>
                <h2 className="font-display text-2xl text-ink-800 group-hover:text-lilac-600 transition-colors mb-2">{p.title}</h2>
                {p.excerpt && <p className="text-sm text-ink-500 line-clamp-3">{p.excerpt}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
