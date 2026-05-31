import { Layout } from '@/components/layout/Layout'
import { Link } from 'react-router-dom'
import { useSeo } from '@/hooks/useSeo'
import { HOSPITAL_GIFTS_PATH } from '@/lib/hospitalGifts'

export function HospitalDeliveryPage() {
  useSeo({
    title: 'Entrega em Hospitais · Frésia Flores',
    description:
      'Como funciona a entrega de presentes em hospitais e maternidades no Rio de Janeiro: regras de Vigilância Sanitária e opções permitidas.',
  })

  return (
    <Layout>
      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <p className="text-xs uppercase tracking-[0.2em] text-lilac-600 mb-3">Frésia Flores</p>
        <h1 className="font-display text-3xl sm:text-4xl leading-tight text-ink-800 mb-8">
          Entrega em Hospitais
        </h1>

        <div className="prose prose-ink max-w-none text-ink-600 leading-relaxed space-y-4">
          {/* TODO: inserir texto do cliente */}
          <p className="border border-dashed border-ink-300 bg-ink-50 p-4 text-sm text-ink-500">
            {/* TODO: inserir texto do cliente */}
            ⚠️ Texto institucional a ser fornecido pelo cliente. Este é um placeholder visível e deve
            ser substituído pelo conteúdo oficial sobre a entrega em hospitais.
          </p>
        </div>

        <div className="mt-10 border-t border-ink-200 pt-6">
          <p className="text-ink-600 mb-3">
            Veja as opções de presentes permitidas em hospitais e maternidades:
          </p>
          <Link
            to={HOSPITAL_GIFTS_PATH}
            className="inline-block bg-ink-800 hover:bg-lilac-500 text-white text-sm px-5 py-2.5 transition-colors"
          >
            Ver presentes permitidos →
          </Link>
        </div>
      </article>
    </Layout>
  )
}
