import { useParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-7 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-leaf-500/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-leaf-500 text-3xl">✓</span>
        </div>
        <h1 className="font-display italic text-3xl text-ink-800 mb-2">
          Pedido #{id} confirmado!
        </h1>
        <p className="text-ink-500 text-sm mb-8">
          Em breve entraremos em contato para confirmar a entrega.
        </p>
        <a
          href="/loja"
          className="inline-block bg-ink-800 hover:bg-lilac-500 text-white text-sm font-medium px-6 py-3 rounded-pill transition-colors"
        >
          Continuar comprando
        </a>
      </div>
    </Layout>
  )
}
