import { useState } from 'react'
import { Search, User, ShoppingBag, Menu, X } from 'lucide-react'
import { useCartStore, selectCount } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { CartSheet } from '@/components/features/CartSheet'
import { SearchBar } from '@/components/features/SearchBar'
import { MegaMenu } from './MegaMenu'

export function Header() {
  const { openCart } = useCartStore()
  const count = useCartStore(selectCount)
  const { user, isLoading, setUser } = useAuthStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      <header className="sticky top-0 z-40 bg-ink-50/85 backdrop-blur-md border-b border-ink-200">
        <div className="flex items-center gap-3 max-w-7xl mx-auto px-4 sm:px-6 lg:px-7 py-3 sm:py-4">
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="md:hidden w-10 h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Logo */}
          <a href="/" className="flex items-center flex-shrink-0">
            <img src="/logo-fresia.png" alt="Frésia" className="h-9 sm:h-10 w-auto object-contain" />
          </a>

          {/* Nav — oculta quando search aberto em telas menores */}
          <nav className={`hidden md:flex gap-6 justify-center flex-1 transition-all duration-300 ${searchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <a href="/" className="text-sm text-ink-500 hover:text-ink-800 transition-colors py-1 whitespace-nowrap">Início</a>
            <a href="/loja" className="text-sm text-ink-500 hover:text-ink-800 transition-colors py-1 whitespace-nowrap">Loja</a>
            <MegaMenu />
            <a href="/presentes-para-hospitais-maternidades" className="text-sm text-ink-500 hover:text-ink-800 transition-colors py-1 whitespace-nowrap">Hospitais e Maternidades</a>
            <a href="/blog" className="text-sm text-ink-500 hover:text-ink-800 transition-colors py-1 whitespace-nowrap">Blog</a>
            <a href="/sobre" className="text-sm text-ink-500 hover:text-ink-800 transition-colors py-1 whitespace-nowrap">Sobre nós</a>
            <a href="/contato" className="text-sm text-ink-500 hover:text-ink-800 transition-colors py-1 whitespace-nowrap">Contato</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            {/* SearchBar inline */}
            <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />

            {/* Botão lupa */}
            {!searchOpen && (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800"
              >
                <Search size={18} />
              </button>
            )}

            {/* Conta */}
            {!isLoading && user ? (
              <div className="relative group">
                <button className="w-10 h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800">
                  <User size={18} />
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white border border-ink-200 rounded-lg shadow-lg py-1 min-w-[160px] opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-50">
                  <a href="/conta" className="block px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800">
                    Minha conta
                  </a>
                  <button
                    onClick={async () => { await authService.logout(); setUser(null) }}
                    className="block w-full text-left px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-800"
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : !isLoading ? (
              <a href="/login" className="w-10 h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800">
                <User size={18} />
              </a>
            ) : (
              <div className="w-10 h-10" />
            )}

            {/* Carrinho */}
            <button
              onClick={openCart}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800 relative"
            >
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-petal-400 text-white text-[10px] font-bold flex items-center justify-center border-2 border-ink-50">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

      </header>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/35" onClick={closeMobileMenu} aria-label="Fechar menu" />
          <aside className="absolute left-0 top-0 h-full w-[86%] max-w-[320px] bg-white border-r border-ink-200 shadow-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-ink-200">
              <img src="/logo-fresia.png" alt="Frésia" className="h-8 w-auto object-contain" />
              <button onClick={closeMobileMenu} className="w-9 h-9 rounded-full hover:bg-ink-100 flex items-center justify-center text-ink-600" aria-label="Fechar menu">
                <X size={18} />
              </button>
            </div>
            <nav className="mt-4 space-y-1">
              <a href="/" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-sm text-ink-700 hover:bg-ink-50">Início</a>
              <a href="/loja" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-sm text-ink-700 hover:bg-ink-50">Loja</a>
              <a href="/presentes-para-hospitais-maternidades" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-sm text-ink-700 hover:bg-ink-50">Hospitais e Maternidades</a>
              <a href="/blog" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-sm text-ink-700 hover:bg-ink-50">Blog</a>
              <a href="/sobre" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-sm text-ink-700 hover:bg-ink-50">Sobre nós</a>
              <a href="/contato" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-sm text-ink-700 hover:bg-ink-50">Contato</a>
              <a href="/loja?ordenar=mais-buscados" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-sm text-lilac-700 bg-lilac-50 hover:bg-lilac-100">Mais buscados</a>
            </nav>
          </aside>
        </div>
      )}

      <CartSheet />
    </>
  )
}
