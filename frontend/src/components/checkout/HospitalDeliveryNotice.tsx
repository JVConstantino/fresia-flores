import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { HOSPITAL_GIFTS_PATH } from '@/lib/hospitalGifts'

/**
 * Aviso exibido no card de endereço quando o endereço aparenta ser de hospital.
 * Paleta amber/copper (sem vermelho agressivo), bordas retas.
 */
export function HospitalDeliveryNotice() {
  return (
    <div className="mt-3 flex gap-3 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
      <p className="leading-relaxed">
        <span className="font-semibold">Entrega em Hospitais:</span> Devido às normas da
        Anvisa/Vigilância Sanitária do RJ, hospitais não permitem a entrada de flores naturais nos
        quartos. Conheça nossas{' '}
        <Link to={HOSPITAL_GIFTS_PATH} className="font-semibold underline hover:text-amber-700">
          opções permitidas para hospitais
        </Link>{' '}
        ou agende a entrega para a residência pós-alta.
      </p>
    </div>
  )
}
