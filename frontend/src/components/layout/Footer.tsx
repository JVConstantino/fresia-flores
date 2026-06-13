import { Instagram, Facebook, MessageCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text'

const socialLinks = [
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: MessageCircle, label: 'WhatsApp', href: '#' },
]

const navLinks = ['Início', 'Loja', 'Sobre nós', 'Rastrear pedido']
const supportLinks = ['Contato', 'FAQ', 'Entregas e prazos', 'Política de troca']

export function Footer() {
  return (
    <footer className="bg-white border-t border-ink-200 pt-12 sm:pt-16 pb-8 mt-16 sm:mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1.4fr] gap-8 sm:gap-10 xl:gap-12 pb-10 sm:pb-14 border-b border-ink-200">
          {/* Coluna 1 — Marca */}
          <div>
            <img src="/logo-fresia.png" alt="Frésia" className="h-14 w-auto object-contain mb-3" />
            <p className="text-sm text-ink-500 leading-relaxed mb-5">
              Flores com alma, entregues com carinho.
            </p>
            <div className="flex gap-2">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-ink-200 flex items-center justify-center text-ink-500 hover:bg-ink-800 hover:text-white hover:border-ink-800 transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Coluna 2 — Navegação */}
          <div>
            <h5 className="text-[11px] font-semibold tracking-widest uppercase text-ink-800 mb-4">
              Navegação
            </h5>
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="block text-sm text-ink-500 hover:text-ink-800 py-1 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Coluna 3 — Atendimento */}
          <div>
            <h5 className="text-[11px] font-semibold tracking-widest uppercase text-ink-800 mb-4">
              Atendimento
            </h5>
            {supportLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="block text-sm text-ink-500 hover:text-ink-800 py-1 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Coluna 4 — Newsletter */}
          <div>
            <AnimatedShinyText className="text-[11px] font-semibold tracking-widest uppercase text-ink-800 mb-4 block">
              Newsletter
            </AnimatedShinyText>
            <p className="text-sm text-ink-500 leading-relaxed mb-4">
              Receba novidades e promoções exclusivas.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="seu@email.com"
                className="flex-1"
              />
              <Button className="bg-lilac-500 hover:bg-lilac-600 text-white whitespace-nowrap">
                Assinar
              </Button>
            </div>
          </div>
        </div>

        {/* Rodapé inferior */}
        <div className="pt-6 text-xs text-ink-500 text-center">
          © 2026 Frésia Flores · Todos os direitos reservados
        </div>
      </div>
    </footer>
  )
}
