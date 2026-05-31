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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-7 py-10 sm:py-14">
        {/* Cabeçalho editorial com keywords-alvo */}
        <header className="max-w-3xl mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-lilac-600 mb-3">Entrega no Rio de Janeiro</p>
          <h1 className="font-display text-3xl sm:text-4xl leading-tight text-ink-800 mb-4">
            Presentes permitidos em hospitais e maternidades — entrega no RJ
          </h1>
          <p className="text-ink-600 leading-relaxed mb-3">
            Hospitais não permitem flores naturais nos quartos. Por isso reunimos aqui as opções
            ideais para <strong>enviar presente para paciente internado no RJ</strong>: balões
            personalizados, pelúcias e chocolates. Tudo com{' '}
            <strong>entrega de presentes em hospitais RJ</strong> e maternidades.
          </p>
          <p className="text-ink-600 leading-relaxed">
            Não sabe <strong>o que levar de presente em maternidade no RJ</strong>? Nossos{' '}
            <strong>balões personalizados para hospital no Rio de Janeiro</strong> são perfeitos para
            celebrar um recém-nascido ou <strong>desejar melhoras</strong>.{' '}
            <Link to="/entrega-em-hospitais" className="text-lilac-600 underline hover:text-lilac-700">
              Saiba como funciona a entrega em hospitais
            </Link>
            .
          </p>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-ink-200 rounded-lg h-64 sm:h-80 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🎈</div>
            <h2 className="text-lg font-medium text-ink-800 mb-2">Em breve, novas opções</h2>
            <p className="text-sm text-ink-500 max-w-md">
              Estamos preparando balões, pelúcias e chocolates para entrega em hospitais e
              maternidades. Fale conosco para opções personalizadas.
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
