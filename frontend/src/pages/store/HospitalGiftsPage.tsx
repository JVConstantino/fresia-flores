import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProductCard } from '@/components/features/ProductCard'
import { QuickViewDialog } from '@/components/features/QuickViewDialog'
import { productService, type Product } from '@/services/productService'
import { categoryService } from '@/services/categoryService'
import { selectHospitalCategories } from '@/lib/hospitalGifts'
import { useSeo } from '@/hooks/useSeo'
import { useLoaderEffect } from '@/hooks/useLoaderEffect'

function firstImage(images: Product['images']): string | undefined {
  try {
    if (typeof images === 'string') return JSON.parse(images)[0]
    return (images as any)?.[0]
  } catch {
    return undefined
  }
}

export function HospitalGiftsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  useSeo({
    title: 'Presentes para Hospitais e Maternidades no RJ · Frésia Flores',
    description:
      'Entregamos balões personalizados, pelúcias e chocolates em hospitais e maternidades no Rio de Janeiro. Presente para paciente internado, desejar melhoras ou recém-nascido.',
  })
  useLoaderEffect(loading, 'Carregando presentes...')

  useEffect(() => {
    setLoading(true)
    categoryService
      .findAll()
      .then(cats => {
        const allowed = selectHospitalCategories(cats)
        const ids = allowed.map(c => c.id)
        if (ids.length === 0) return [] as Product[]
        return productService.findAll(ids)
      })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const categoriesPlaceholder = [
    { name: 'Balões Personalizados', icon: '🎈', slug: 'baloes', desc: 'Balões metalizados e personalizados com mensagens especiais de melhoras ou comemoração.' },
    { name: 'Pelúcias Delicadas', icon: '🧸', slug: 'pelucias', desc: 'Ursos e pelúcias hipoalergênicas extremamente macias e seguras.' },
    { name: 'Chocolates Finos', icon: '🍫', slug: 'chocolates', desc: 'Bombons artesanais e chocolates premium ideais para presentear e adoçar o dia.' }
  ]

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-lilac-100/50 via-petal-50/30 to-white py-12 sm:py-16 border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-7">
          <header className="max-w-3xl">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-lilac-600 bg-lilac-100 px-3 py-1 rounded-full mb-4">
              Serviço Especial RJ
            </span>
            <h1 className="font-display italic text-4xl sm:text-5xl leading-tight text-ink-800 mb-6">
              Presentes para Hospitais <br className="hidden sm:inline" />& Maternidades
            </h1>
            <p className="text-sm sm:text-base text-ink-600 leading-relaxed mb-4">
              Hospitais não permitem flores naturais nos quartos para preservar a saúde dos pacientes. 
              Pensando nisso, a Frésia preparou uma seleção curada de presentes permitidos:{' '}
              <strong>balões personalizados, pelúcias e chocolates premium</strong>.
            </p>
            <p className="text-sm sm:text-base text-ink-600 leading-relaxed">
              Ideal para celebrar a chegada de um recém-nascido, desejar melhoras ou demonstrar carinho.{' '}
              <Link to="/entrega-em-hospitais" className="text-lilac-600 font-semibold underline hover:text-lilac-700">
                Veja nossas regras de entrega em hospitais no RJ
              </Link>
              .
            </p>
          </header>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-7 py-10 sm:py-16">
        {/* Curated Categories Cards */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-6">Categorias Permitidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {categoriesPlaceholder.map(cat => (
              <div 
                key={cat.slug} 
                className="bg-white border border-ink-200 rounded-xl p-5 hover:border-lilac-300 hover:shadow-md transition-all group cursor-pointer"
                onClick={() => {
                  window.location.href = `/loja?categoria=${cat.slug}`
                }}
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform w-fit">{cat.icon}</div>
                <h3 className="font-display italic text-lg text-ink-800 mb-2">{cat.name}</h3>
                <p className="text-xs text-ink-500 leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section title */}
        <div className="flex items-center justify-between border-b border-ink-200 pb-4 mb-8">
          <h2 className="font-display italic text-2xl sm:text-3xl text-ink-800">
            Nossos Presentes <span className="text-lilac-500">Disponíveis</span>
          </h2>
          <span className="text-xs text-ink-500">{products.length} {products.length === 1 ? 'produto' : 'produtos'}</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-ink-200 rounded-lg h-64 sm:h-80 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-ink-50 rounded-2xl border border-dashed border-ink-200">
            <div className="text-5xl mb-4">🎈</div>
            <h2 className="text-lg font-medium text-ink-800 mb-2">Em breve, novas opções</h2>
            <p className="text-sm text-ink-500 max-w-md px-4">
              Estamos preparando balões, pelúcias e chocolates para entrega em hospitais e
              maternidades. Entre em contato conosco para encomendas sob medida.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                image={firstImage(product.images)}
                price={Number(product.price)}
                category={product.category?.name || ''}
                stock={product.stock}
                onQuickView={() => setQuickViewProduct(product)}
              />
            ))}
          </div>
        )}
      </div>

      <QuickViewDialog
        product={quickViewProduct}
        open={quickViewProduct !== null}
        onClose={() => setQuickViewProduct(null)}
      />
    </Layout>
  )
}

