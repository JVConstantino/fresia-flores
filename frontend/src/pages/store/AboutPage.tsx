import { Layout } from '@/components/layout/Layout'
import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-lilac-50 via-white to-petal-50 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-lilac-500 bg-lilac-100 px-3 py-1 rounded-full mb-6">
            Nossa história
          </span>
          <h1 className="font-display italic text-5xl text-ink-900 mb-6 leading-tight">
            Nascemos do amor<br />pelas <em className="text-lilac-500">flores</em>
          </h1>
          <p className="text-ink-500 text-lg leading-relaxed max-w-2xl mx-auto">
            A Frésia nasceu do desejo de transformar momentos simples em memórias inesquecíveis — com flores frescas, arranjos únicos e uma entrega que chega com carinho.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-lilac-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-40" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-petal-100 rounded-full translate-y-1/2 -translate-x-1/2 opacity-40" />
      </section>

      {/* Valores */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-8">
          {[
            { icon: '🌸', title: 'Frescor garantido', desc: 'Selecionamos flores diariamente para garantir que cada entrega chegue com a máxima qualidade e durabilidade.' },
            { icon: '💜', title: 'Feito com amor', desc: 'Cada arranjo é montado à mão por nossa equipe, com atenção a cada detalhe — do caule à fita final.' },
            { icon: '🚚', title: 'Entrega no mesmo dia', desc: 'Pedidos até as 14h são entregues no mesmo dia. Porque momentos especiais não esperam.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white border border-ink-200 rounded-2xl p-8 text-center hover:shadow-md transition-shadow duration-300">
              <div className="text-5xl mb-4">{icon}</div>
              <h3 className="font-display italic text-xl text-ink-800 mb-3">{title}</h3>
              <p className="text-ink-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* História */}
      <section className="py-16 px-6 bg-ink-50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-petal-500 mb-4 block">Desde 2020</span>
            <h2 className="font-display italic text-4xl text-ink-900 mb-6">Uma floricultura boutique no coração da cidade</h2>
            <p className="text-ink-500 leading-relaxed mb-4">
              Começamos em um pequeno ateliê com uma ideia simples: oferecer flores de qualidade superior com o cuidado de uma boutique. Hoje, atendemos centenas de famílias e empresas que confiam na Frésia para os seus momentos mais especiais.
            </p>
            <p className="text-ink-500 leading-relaxed mb-8">
              Trabalhamos com fornecedores locais e regionais, priorizando a sazonalidade e a sustentabilidade. Acreditamos que flores bonitas começam com uma produção responsável.
            </p>
            <Link to="/loja" className="inline-block px-6 py-3 bg-lilac-500 hover:bg-lilac-600 text-white rounded-xl font-medium text-sm transition-colors">
              Explorar nossa loja
            </Link>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-lilac-100 to-petal-100 rounded-2xl aspect-square flex items-center justify-center text-6xl">🌹</div>
              <div className="bg-gradient-to-br from-petal-100 to-lilac-100 rounded-2xl aspect-square flex items-center justify-center text-6xl mt-8">🌷</div>
            </div>
            <div className="bg-gradient-to-br from-lilac-50 to-petal-50 border border-lilac-200 rounded-2xl p-6 text-center">
              <div className="font-display text-3xl text-lilac-500 italic mb-1">2.400+</div>
              <div className="text-sm text-ink-500">clientes satisfeitos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipe */}
      <section className="py-16 px-6 max-w-6xl mx-auto text-center">
        <h2 className="font-display italic text-4xl text-ink-800 mb-3">Nossa equipe</h2>
        <p className="text-ink-500 mb-12 max-w-xl mx-auto">Apaixonados por flores e dedicados a transformar cada pedido em uma experiência única.</p>
        <div className="grid grid-cols-3 gap-8">
          {[
            { name: 'Ana Beatriz', role: 'Fundadora & Florista Chefe', emoji: '👩‍🌾' },
            { name: 'Carla Menezes', role: 'Designer de Arranjos', emoji: '👩‍🎨' },
            { name: 'Juliana Costa', role: 'Atendimento & Entregas', emoji: '👩‍💼' },
          ].map(({ name, role, emoji }) => (
            <div key={name} className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-lilac-200 to-petal-200 flex items-center justify-center text-4xl mx-auto mb-4">
                {emoji}
              </div>
              <h4 className="font-semibold text-ink-800">{name}</h4>
              <p className="text-sm text-ink-500 mt-0.5">{role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gradient-to-r from-lilac-500 to-petal-400 text-white text-center">
        <h2 className="font-display italic text-4xl mb-4">Tem alguma dúvida?</h2>
        <p className="text-white/80 mb-8 max-w-md mx-auto">Entre em contato com a nossa equipe — adoramos conversar sobre flores!</p>
        <Link to="/contato" className="inline-block px-8 py-3 bg-white text-lilac-600 font-semibold rounded-xl hover:bg-ink-50 transition-colors">
          Falar conosco
        </Link>
      </section>
    </Layout>
  )
}
