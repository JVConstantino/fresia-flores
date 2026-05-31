import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { postService, type Post } from '@/services/postService'

function formatDate(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    window.scrollTo(0, 0)
    setLoading(true)
    postService.getBySlug(slug)
      .then(setPost)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <Layout>
      <article className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 mb-8">
          <ArrowLeft size={14} /> Todos os posts
        </Link>

        {loading ? (
          <div className="text-center py-16 text-ink-400">Carregando...</div>
        ) : notFound || !post ? (
          <div className="text-center py-16">
            <p className="text-ink-400 mb-4">Post não encontrado</p>
            <Link to="/blog" className="text-lilac-500 hover:underline">Voltar ao blog</Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-lilac-500 uppercase tracking-widest mb-3">{formatDate(post.publishedAt)}</p>
            <h1 className="font-display italic text-5xl text-ink-800 mb-6 leading-tight">{post.title}</h1>
            {post.excerpt && <p className="text-lg text-ink-600 mb-8 leading-relaxed">{post.excerpt}</p>}
            {post.coverUrl && (
              <img src={post.coverUrl} alt={post.title} className="w-full aspect-[16/9] object-cover rounded-2xl mb-10" />
            )}
            <div
              className="prose prose-lg max-w-none text-ink-700 [&_h1]:font-display [&_h2]:font-display [&_h2]:text-ink-800 [&_a]:text-lilac-600 [&_blockquote]:border-l-4 [&_blockquote]:border-lilac-300 [&_blockquote]:italic [&_blockquote]:text-ink-600"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          </>
        )}
      </article>
    </Layout>
  )
}
