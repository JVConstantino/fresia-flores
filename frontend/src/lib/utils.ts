import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Rótulo amigável para o método de pagamento.
 * Cobre valores do checkout online (`card`, `pix`) e do PDV (`cash`, `pix_pdv`, `card_pdv`).
 */
export function paymentMethodLabel(method?: string | null): string {
  switch (method) {
    case 'cash':
      return 'Dinheiro'
    case 'pix':
    case 'pix_pdv':
      return 'PIX'
    case 'card':
    case 'card_pdv':
    case 'credit_card':
      return 'Cartão'
    default:
      return method ? 'Cartão' : '—'
  }
}
