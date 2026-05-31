import { useState, useEffect, useRef } from 'react'
import { ProductCard } from '@/components/features/ProductCard'
import { QuickViewDialog } from '@/components/features/QuickViewDialog'
import { TestimonialCard } from '@/components/features/TestimonialCard'
import { NewsletterSection } from '@/components/features/NewsletterSection'
import { Link } from 'react-router-dom'
import { homeService } from '@/services/homeService'
import { productService, type Product } from '@/services/productService'
import { categoryService } from '@/services/categoryService'
import { postService, type PostListItem } from '@/services/postService'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, MapPin, Phone, Mail, Clock } from 'lucide-react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

function parseFirstImage(images: any): string | null {
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images
    return Array.isArray(parsed) ? parsed[0] ?? null : null
  } catch { return null }
}

interface Category {
  id: number
  name: string
  slug: string
  image?: string
  _count?: { products: number }
}

interface Promotion {
  id: number
  name: string
  products: Product[]
  discountValue: number
  discountType: string
}

interface Testimonial {
  id: number
  clientName: string
  text: string
  rating: number
  createdAt: Date
}

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [_promotions, setPromotions] = useState<Promotion[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [promoProducts, setPromoProducts] = useState<Product[]>([])
  const [blogPosts, setBlogPosts] = useState<PostListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [carouselSlide, setCarouselSlide] = useState(0)
  const [carouselPaused, setCarouselPaused] = useState(false)
  const carouselTimer = useRef<ReturnType<typeof setInterval>>()
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [catsData, promoData, testimData, trendData, featData, allProds, postsData] = await Promise.all([
          categoryService.findAll(),
          homeService.getPromotions(),
          homeService.getTestimonials(),
          homeService.getTrendingProducts(8),
          productService.findAll(undefined, 'newest', 8, undefined, undefined, undefined, true),
          productService.findAll(undefined, 'newest', 40),
          postService.listPublic(6).catch(() => []),
        ])
        setBlogPosts(postsData)

        setCategories(catsData)
        setPromotions(promoData)
        setTestimonials(testimData)
        setTrendingProducts(trendData)
        setFeaturedProducts(featData)
        // Produtos com salePrice definido
        const withPromo = allProds.filter((p: any) => p.salePrice != null).slice(0, 8)
        setPromoProducts(withPromo)
      } catch (err) {
        console.error('Erro ao carregar dados da home:', err)
        toast.error('Erro ao carregar página')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Mapa
  useEffect(() => {
    if (!mapRef.current) return
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [-42.5313, -22.2824],
      zoom: 14,
    })
    new maplibregl.Marker({ color: '#9b83e6' })
      .setLngLat([-42.5313, -22.2824])
      .addTo(map)
    return () => map.remove()
  }, [isLoading])

  useEffect(() => {
    if (featuredProducts.length <= 1 || carouselPaused) return
    carouselTimer.current = setInterval(() => {
      setCarouselSlide(s => (s + 1) % featuredProducts.length)
    }, 4000)
    return () => clearInterval(carouselTimer.current)
  }, [featuredProducts.length, carouselPaused])

  const carouselPrev = () => {
    setCarouselSlide(s => (s - 1 + featuredProducts.length) % featuredProducts.length)
    clearInterval(carouselTimer.current)
  }
  const carouselNext = () => {
    setCarouselSlide(s => (s + 1) % featuredProducts.length)
    clearInterval(carouselTimer.current)
  }

  if (isLoading) {
    return <div className="p-8 text-center text-ink-500">Carregando...</div>
  }

  return (
    <>
      {/* Hero Section */}
      <section className="py-4 sm:py-6 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2" style={{ minHeight: 'auto' }}>
          {/* Copy Side */}
          <div
            className="rounded-2xl p-5 sm:p-8 xl:p-12 flex flex-col justify-center"
            style={{
              minHeight: 'min(440px, 72vh)',
              background: 'linear-gradient(160deg, #f5f0fb 0%, #fef9f5 60%, #fff0e8 100%)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Decorative Circle */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '220px',
                height: '220px',
                background: 'radial-gradient(circle, rgba(245, 169, 140, 0.2) 0%, transparent 70%)',
                borderRadius: '50%'
              }}
            />

            <div className="relative z-10 flex flex-col gap-6">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-ink-200 rounded-full w-fit">
                <span className="w-1.5 h-1.5 bg-leaf-500 rounded-full" style={{ animation: 'pulse 2s infinite' }} />
                <span className="text-xs text-ink-700 font-medium">Floricultura Boutique Premium</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-display font-semibold leading-tight text-ink-900">
                Flores <em className="italic text-lilac-600 font-normal">frescas</em> para seus momentos
              </h1>

              {/* Description */}
              <p className="text-sm text-ink-600 max-w-96 leading-relaxed">
                Cada arranjo é cuidadosamente preparado com flores de qualidade premium, selecionadas diariamente para garantir a frescura e beleza em cada entrega.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/loja">
                  <button className="px-5 py-3 bg-lilac-500 hover:bg-lilac-600 text-white rounded-xl font-medium text-sm transition-colors">
                    Explorar Loja
                  </button>
                </Link>
                <Link to="/sobre">
                  <button className="px-5 py-3 bg-white hover:bg-ink-50 text-ink-800 border border-ink-200 rounded-xl font-medium text-sm transition-colors">
                    Saiba Mais
                  </button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 border-t border-ink-400/10">
                <div>
                  <div className="font-display text-2xl font-medium text-ink-900">2.400+</div>
                  <div className="text-xs text-ink-500 mt-0.5">Clientes Felizes</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-medium text-ink-900">98%</div>
                  <div className="text-xs text-ink-500 mt-0.5">Satisfação</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-medium text-ink-900">4.8★</div>
                  <div className="text-xs text-ink-500 mt-0.5">Avaliação</div>
                </div>
              </div>
            </div>
          </div>

          {/* Carrossel de Produtos em Destaque */}
          <div
            className="rounded-2xl overflow-hidden relative bg-ink-100 aspect-[4/5] sm:aspect-[5/4] lg:aspect-auto"
            style={{ minHeight: '280px' }}
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
          >
            {featuredProducts.length > 0 ? (
              <>
                {featuredProducts.map((p, i) => {
                  const img = parseFirstImage(p.images)
                  return (
                    <div
                      key={p.id}
                      className={`absolute inset-0 transition-opacity duration-700 ${i === carouselSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    >
                      {img ? (
                        <img src={img} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-lilac-100 to-petal-100 flex items-center justify-center text-6xl">🌸</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <p className="text-xs uppercase tracking-widest text-white/70 mb-1">{p.category?.name}</p>
                        <p className="font-display italic text-2xl leading-tight mb-1">{p.name}</p>
                        <p className="text-white/80 text-sm mb-4">R$ {Number(p.price).toFixed(2)}</p>
                        <Link
                          to={`/produto/${p.slug}`}
                          className="inline-block px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white text-sm rounded-lg transition-colors"
                        >
                          Ver produto →
                        </Link>
                      </div>
                    </div>
                  )
                })}

                {/* Setas */}
                {featuredProducts.length > 1 && (
                  <>
                    <button onClick={carouselPrev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur flex items-center justify-center text-white transition-colors">
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={carouselNext} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur flex items-center justify-center text-white transition-colors">
                      <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-3 right-6 z-20 flex gap-1.5">
                      {featuredProducts.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCarouselSlide(i)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${i === carouselSlide ? 'bg-white w-4' : 'bg-white/40 w-1.5'}`}
                        />
                      ))}
                    </div>
                    <div className="absolute top-4 right-4 z-20 bg-white/20 backdrop-blur text-white text-xs px-2 py-1 rounded-full">
                      ⭐ Destaques
                    </div>
                  </>
                )}
              </>
            ) : (
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1599599810694-b5ac4dd03e4b?w=600&q=80)' }}
              />
            )}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <section className="mt-7 py-5 border-t border-b border-ink-200 overflow-hidden">
        <style>{`
          @keyframes marquee { to { transform: translateX(-50%); } }
          .marquee-track { display: inline-flex; gap: 60px; animation: marquee 40s linear infinite; white-space: nowrap; }
        `}</style>
        <div className="marquee-track font-display italic text-2xl text-ink-400">
          <span>Rosas Clássicas</span>
          <span style={{ color: '#f5a98c' }}>✿</span>
          <span>Peônias Luxo</span>
          <span style={{ color: '#f5a98c' }}>✿</span>
          <span>Tulipas Coloridas</span>
          <span style={{ color: '#f5a98c' }}>✿</span>
          <span>Orquídeas Raras</span>
          <span style={{ color: '#f5a98c' }}>✿</span>
          <span>Rosas Clássicas</span>
          <span style={{ color: '#f5a98c' }}>✿</span>
          <span>Peônias Luxo</span>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-14 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-8 mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-5xl font-display font-semibold text-ink-900">
              Categorias de <em className="italic text-lilac-600 font-normal">Flores</em>
            </h2>
            <p className="text-sm text-ink-500 max-w-80 sm:text-right">
              Explore nossa seleção cuidada de flores para cada ocasião e preferência
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 lg:hidden snap-x snap-mandatory">
            {categories.slice(0, 6).map((cat) => (
              <Link key={cat.id} to={`/loja?cat=${cat.slug}`} className="snap-start flex-shrink-0 w-44 h-52 rounded-lg overflow-hidden relative bg-ink-100">
                {(cat as any).imageUrl ? (
                  <img src={(cat as any).imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-lilac-100 to-petal-100 flex items-center justify-center text-4xl">🌸</div>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-end p-4">
                  <div>
                    <h3 className="text-white font-display text-lg font-semibold">{cat.name}</h3>
                    <p className="text-white/80 text-xs">{cat._count?.products || 0} produtos</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Asymmetric Grid */}
          <div className="gap-4 hidden lg:grid" style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gridTemplateRows: '280px 280px', gridTemplateAreas: '"a b c d" "a e f f"' }}>
            {categories.slice(0, 6).map((cat, idx) => {
              const area = ['a', 'b', 'c', 'd', 'e', 'f'][idx]
              return (
                <Link
                  key={cat.id}
                  to={`/loja?cat=${cat.slug}`}
                  className="rounded-lg overflow-hidden relative cursor-pointer hover:translate-y-[-4px] transition-transform bg-ink-100"
                  style={{ gridArea: area }}
                >
                  {(cat as any).imageUrl ? (
                    <img src={(cat as any).imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-lilac-100 to-petal-100 flex items-center justify-center text-4xl">🌸</div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-end p-6">
                    <div>
                      <h3 className="text-white font-display text-2xl font-semibold">{cat.name}</h3>
                      <p className="text-white/80 text-sm">{cat._count?.products || 0} produtos</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Flores em Promoção (produtos com salePrice) */}
      {promoProducts.length > 0 && (
        <section className="py-14 sm:py-24 px-4 sm:px-6 bg-lilac-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-8 mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-5xl font-display font-semibold text-ink-900">
                Flores em <em className="italic text-lilac-600 font-normal">Promoção</em>
              </h2>
              <div className="text-right">
                <p className="text-sm text-ink-500 mb-2">Aproveite nossas ofertas especiais e limitadas</p>
                {promoProducts.length === 8 && (
                  <Link to="/loja" className="text-sm font-semibold text-lilac-600 hover:text-lilac-700 underline underline-offset-2">
                    Ver todas as promoções →
                  </Link>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              {promoProducts.map((product: any) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  image={parseFirstImage(product.images) ?? undefined}
                  price={Number(product.salePrice)}
                  originalPrice={Number(product.price)}
                  discountPercent={Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100)}
                  category={product.category?.name || 'Flores'}
                  stock={product.stock}
                  onQuickView={() => setQuickViewProduct(product)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Products */}
      <section className="py-14 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-5xl font-display font-semibold text-ink-900 mb-8 sm:mb-12">
          Mais <em className="italic text-lilac-600 font-normal">Vendidos</em>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
          {trendingProducts.slice(0, 8).map(product => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              slug={product.slug}
              image={product.images?.[0]}
              price={product.price}
              category={product.category?.name || 'Flores'}
              stock={product.stock}
              onQuickView={() => setQuickViewProduct(product)}
            />
          ))}
        </div>

        <div className="text-center">
          <Link to="/loja">
            <button className="px-8 py-4 bg-lilac-500 hover:bg-lilac-600 text-white rounded-xl font-medium transition-colors">
              Ver Catálogo Completo
            </button>
          </Link>
        </div>
      </section>

      {/* Blog */}
      {blogPosts.length > 0 && (
        <section className="py-14 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-8 mb-8 sm:mb-10">
            <h2 className="text-3xl sm:text-5xl font-display font-semibold text-ink-900">
              Do nosso <em className="italic text-lilac-600 font-normal">blog</em>
            </h2>
            <Link to="/blog" className="text-sm font-semibold text-lilac-600 hover:text-lilac-700 underline underline-offset-2">
              Ver todos os posts →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {blogPosts.map(p => (
              <Link
                key={p.id}
                to={`/blog/${p.slug}`}
                className="group"
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-lilac-100 to-petal-100">
                  {p.coverUrl ? (
                    <img src={p.coverUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🌸</div>
                  )}
                </div>
                {p.publishedAt && (
                  <p className="text-xs text-lilac-500 uppercase tracking-widest mb-1">
                    {new Date(p.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </p>
                )}
                <h3 className="font-display text-xl text-ink-800 group-hover:text-lilac-600 transition-colors line-clamp-2 mb-1">{p.title}</h3>
                {p.excerpt && <p className="text-sm text-ink-500 line-clamp-2">{p.excerpt}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <NewsletterSection />

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-24 px-6 bg-ink-50 max-w-7xl mx-auto rounded-2xl">
          <h2 className="text-5xl font-display font-semibold text-ink-900 mb-12 text-center">
            O que Clientes <em className="italic text-lilac-600 font-normal">Dizem</em>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.slice(0, 3).map(testimonial => (
              <TestimonialCard
                key={testimonial.id}
                id={testimonial.id}
                clientName={testimonial.clientName}
                text={testimonial.text}
                rating={testimonial.rating}
                date={testimonial.createdAt}
              />
            ))}
          </div>
        </section>
      )}

      {/* Contato + Mapa */}
      <section className="py-14 sm:py-20 bg-white border-t border-ink-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-7 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start">
          <div>
            <h2 className="font-display italic text-4xl text-ink-800 mb-2">
              Nos <span className="text-lilac-500">encontre</span>
            </h2>
            <p className="text-sm text-ink-500 mb-8">Venha nos visitar ou entre em contato</p>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-lilac-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-ink-800">Endereço</p>
                  <p className="text-sm text-ink-500">Rua das Flores, 123 — Centro</p>
                  <p className="text-sm text-ink-500">Nova Friburgo / RJ — CEP 28610-000</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-lilac-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-ink-800">Telefone</p>
                  <p className="text-sm text-ink-500">(22) 9 9999-9999</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-lilac-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-ink-800">E-mail</p>
                  <p className="text-sm text-ink-500">contato@fresia.com.br</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-lilac-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-ink-800">Horário de funcionamento</p>
                  <p className="text-sm text-ink-500">Segunda a Sábado: 8h às 18h</p>
                  <p className="text-sm text-ink-500">Domingo: 9h às 13h</p>
                </div>
              </div>
            </div>
          </div>
          <div ref={mapRef} className="h-80 rounded-2xl overflow-hidden border border-ink-200 shadow-sm" />
        </div>
      </section>

      <QuickViewDialog
        product={quickViewProduct}
        open={quickViewProduct !== null}
        onClose={() => setQuickViewProduct(null)}
      />

      <style>{`
        @keyframes pulse {
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  )
}
