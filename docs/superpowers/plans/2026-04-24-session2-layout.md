# Sessão 2 — Componentes shadcn Base + Layout Header/Footer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instalar os 6 componentes shadcn base, criar o Header sticky com offcanvas de carrinho, o Footer 4 colunas e o Layout wrapper — deixando `localhost:5173` com a estrutura visual real da loja.

**Architecture:** Zustand gerencia o estado do carrinho (isOpen/count). O Header importa o Sheet do shadcn para o offcanvas. Layout.tsx envolve todas as páginas com Header + main + Footer. Todos os ícones são lucide-react outline.

**Tech Stack:** React 18, Tailwind CSS com tokens Frésia, shadcn/ui, Zustand, lucide-react, TypeScript.

---

## Mapa de Arquivos

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `frontend/src/store/cartStore.ts` | Estado do carrinho: isOpen, count, open/close |
| Instalar | `frontend/src/components/ui/button.tsx` | shadcn Button |
| Instalar | `frontend/src/components/ui/card.tsx` | shadcn Card |
| Instalar | `frontend/src/components/ui/input.tsx` | shadcn Input |
| Instalar | `frontend/src/components/ui/badge.tsx` | shadcn Badge |
| Instalar | `frontend/src/components/ui/dialog.tsx` | shadcn Dialog |
| Instalar | `frontend/src/components/ui/sheet.tsx` | shadcn Sheet (offcanvas) |
| Criar | `frontend/src/components/layout/Header.tsx` | Header sticky + cart offcanvas |
| Criar | `frontend/src/components/layout/Footer.tsx` | Footer 4 colunas |
| Criar | `frontend/src/components/layout/Layout.tsx` | Wrapper Header + main + Footer |
| Modificar | `frontend/src/App.tsx` | Usar Layout + placeholder |

---

## Task 1: Instalar Zustand e Criar cartStore

**Files:**
- Create: `fresia-claude-setup/fresia/frontend/src/store/cartStore.ts`

- [ ] **Step 1: Instalar Zustand**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npm install zustand
```

Esperado: `zustand` adicionado ao `node_modules` sem erros.

- [ ] **Step 2: Criar `frontend/src/store/cartStore.ts`**

```typescript
import { create } from 'zustand'

interface CartStore {
  isOpen: boolean
  count: number
  openCart: () => void
  closeCart: () => void
}

export const useCartStore = create<CartStore>((set) => ({
  isOpen: false,
  count: 0,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
}))
```

Salvar em: `fresia-claude-setup/fresia/frontend/src/store/cartStore.ts`

- [ ] **Step 3: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: sem erros de TypeScript.

- [ ] **Step 4: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/store/cartStore.ts frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): zustand cart store"
```

---

## Task 2: Instalar Componentes shadcn

**Files:**
- Create: `fresia-claude-setup/fresia/frontend/src/components/ui/button.tsx`
- Create: `fresia-claude-setup/fresia/frontend/src/components/ui/card.tsx`
- Create: `fresia-claude-setup/fresia/frontend/src/components/ui/input.tsx`
- Create: `fresia-claude-setup/fresia/frontend/src/components/ui/badge.tsx`
- Create: `fresia-claude-setup/fresia/frontend/src/components/ui/dialog.tsx`
- Create: `fresia-claude-setup/fresia/frontend/src/components/ui/sheet.tsx`

> Executar tudo dentro de `fresia-claude-setup/fresia/frontend/`

- [ ] **Step 1: Instalar Button**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx shadcn@latest add button --yes
```

Esperado: `src/components/ui/button.tsx` criado.

- [ ] **Step 2: Instalar Card**

```bash
npx shadcn@latest add card --yes
```

Esperado: `src/components/ui/card.tsx` criado.

- [ ] **Step 3: Instalar Input**

```bash
npx shadcn@latest add input --yes
```

Esperado: `src/components/ui/input.tsx` criado.

- [ ] **Step 4: Instalar Badge**

```bash
npx shadcn@latest add badge --yes
```

Esperado: `src/components/ui/badge.tsx` criado.

- [ ] **Step 5: Instalar Dialog**

```bash
npx shadcn@latest add dialog --yes
```

Esperado: `src/components/ui/dialog.tsx` criado (pode instalar dependências como `@radix-ui/react-dialog`).

- [ ] **Step 6: Instalar Sheet**

```bash
npx shadcn@latest add sheet --yes
```

Esperado: `src/components/ui/sheet.tsx` criado.

- [ ] **Step 7: Verificar todos os arquivos gerados**

```bash
ls src/components/ui/
```

Esperado: `button.tsx card.tsx input.tsx badge.tsx dialog.tsx sheet.tsx` (e possivelmente `label.tsx` como dependência).

- [ ] **Step 8: Verificar tipagem**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 9: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/components/ui/ frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): instalar componentes shadcn base (button, card, input, badge, dialog, sheet)"
```

---

## Task 3: Criar Header

**Files:**
- Create: `fresia-claude-setup/fresia/frontend/src/components/layout/Header.tsx`

- [ ] **Step 1: Criar `frontend/src/components/layout/Header.tsx`**

```tsx
import { Search, User, ShoppingBag, ChevronDown } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const navLinks = [
  { label: 'Início', href: '/' },
  { label: 'Loja', href: '/loja' },
  { label: 'Categorias', href: '#', hasDropdown: true },
  { label: 'Sobre nós', href: '/sobre' },
  { label: 'Contato', href: '/contato' },
]

export function Header() {
  const { isOpen, count, openCart, closeCart } = useCartStore()

  return (
    <>
      <header className="sticky top-0 z-40 bg-ink-50/85 backdrop-blur-md border-b border-ink-200">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-10 max-w-7xl mx-auto px-7 py-4">
          {/* Logo */}
          <a
            href="/"
            className="relative flex items-center font-display italic text-2xl text-lilac-500"
          >
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-petal-400" />
            Frésia
          </a>

          {/* Nav */}
          <nav className="flex gap-8 justify-center">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800 transition-colors py-1"
              >
                {link.label}
                {link.hasDropdown && <ChevronDown size={14} />}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button className="w-10 h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800">
              <Search size={18} />
            </button>
            <button className="w-10 h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800">
              <User size={18} />
            </button>
            <button
              onClick={openCart}
              className="w-10 h-10 rounded-full hover:bg-ink-100 transition-colors flex items-center justify-center text-ink-600 hover:text-ink-800 relative"
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

      {/* Cart Offcanvas */}
      <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
        <SheetContent side="right" className="w-80 sm:w-96">
          <SheetHeader>
            <SheetTitle>Carrinho</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-48 text-ink-500 text-sm">
            Seu carrinho está vazio.
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
```

Salvar em: `fresia-claude-setup/fresia/frontend/src/components/layout/Header.tsx`

- [ ] **Step 2: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/components/layout/Header.tsx
git commit -m "feat(frontend): header sticky com offcanvas carrinho"
```

---

## Task 4: Criar Footer

**Files:**
- Create: `fresia-claude-setup/fresia/frontend/src/components/layout/Footer.tsx`

- [ ] **Step 1: Criar `frontend/src/components/layout/Footer.tsx`**

```tsx
import { Instagram, Facebook, MessageCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const socialLinks = [
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: MessageCircle, label: 'WhatsApp', href: '#' },
]

const navLinks = ['Início', 'Loja', 'Sobre nós', 'Rastrear pedido']
const supportLinks = ['Contato', 'FAQ', 'Entregas e prazos', 'Política de troca']

export function Footer() {
  return (
    <footer className="bg-white border-t border-ink-200 pt-16 pb-8 mt-24">
      <div className="max-w-7xl mx-auto px-7">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1.4fr] gap-12 pb-14 border-b border-ink-200">
          {/* Coluna 1 — Marca */}
          <div>
            <div className="font-display italic text-[40px] text-lilac-500 leading-none mb-3">
              Frésia
            </div>
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
            <h5 className="text-[11px] font-semibold tracking-widest uppercase text-ink-800 mb-4">
              Newsletter
            </h5>
            <p className="text-sm text-ink-500 leading-relaxed mb-4">
              Receba novidades e promoções exclusivas.
            </p>
            <div className="flex gap-2">
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
```

Salvar em: `fresia-claude-setup/fresia/frontend/src/components/layout/Footer.tsx`

- [ ] **Step 2: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/components/layout/Footer.tsx
git commit -m "feat(frontend): footer 4 colunas com newsletter"
```

---

## Task 5: Criar Layout e Atualizar App

**Files:**
- Create: `fresia-claude-setup/fresia/frontend/src/components/layout/Layout.tsx`
- Modify: `fresia-claude-setup/fresia/frontend/src/App.tsx`

- [ ] **Step 1: Criar `frontend/src/components/layout/Layout.tsx`**

```tsx
import { Header } from './Header'
import { Footer } from './Footer'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
```

Salvar em: `fresia-claude-setup/fresia/frontend/src/components/layout/Layout.tsx`

- [ ] **Step 2: Atualizar `frontend/src/App.tsx`**

```tsx
import { Layout } from '@/components/layout/Layout'

export default function App() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-7 py-24 text-center">
        <h1 className="font-display italic text-5xl text-lilac-500 mb-3">
          Frésia Flores
        </h1>
        <p className="text-ink-500">Em breve: o catálogo completo.</p>
      </div>
    </Layout>
  )
}
```

Salvar em: `fresia-claude-setup/fresia/frontend/src/App.tsx`

- [ ] **Step 3: Verificar tipagem**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia/frontend"
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add frontend/src/components/layout/Layout.tsx frontend/src/App.tsx
git commit -m "feat(frontend): layout wrapper com header e footer"
```

---

## Task 6: Verificação Visual e2e

- [ ] **Step 1: Confirmar frontend rodando**

Abrir `http://localhost:5173` no browser.

Verificar:
- Header visível no topo com logo "Frésia", nav com 5 links, 3 ícones outline à direita
- Conteúdo central: título "Frésia Flores" em lilac + texto abaixo
- Footer visível ao final com 4 colunas

- [ ] **Step 2: Testar offcanvas do carrinho**

Clicar no ícone `ShoppingBag` no header.

Esperado: Sheet desliza da direita com título "Carrinho" e mensagem "Seu carrinho está vazio."

Clicar fora ou no X para fechar.

Esperado: Sheet fecha.

- [ ] **Step 3: Verificar sem erros no console**

Abrir DevTools → Console.

Esperado: zero erros em vermelho.

- [ ] **Step 4: Commit final**

```bash
cd "c:/Users/Constantino/Documents/PROGRAMACAO/FRESIA/PLANO-NOVO/fresia-claude-setup/fresia"
git add -A
git commit -m "chore: verificacao e2e session 2 concluida"
```

---

## Self-Review

- [x] **Spec coverage:** Zustand store (Task 1), 6 shadcn components (Task 2), Header com offcanvas (Task 3), Footer 4 colunas (Task 4), Layout + App (Task 5), verificação visual (Task 6)
- [x] **Sem placeholders:** todos os steps têm código completo
- [x] **Consistência de tipos:** `useCartStore()` retorna `{ isOpen, count, openCart, closeCart }` — usado corretamente no Header. `LayoutProps.children: React.ReactNode` consistente entre Layout e uso no App
- [x] **Imports:** `@/store/cartStore` definido na Task 1 antes de ser importado na Task 3. `@/components/ui/sheet` gerado na Task 2 antes de ser importado na Task 3
- [x] **Cores:** `bg-lilac-500`, `text-lilac-500`, `bg-petal-400`, `text-ink-*`, `bg-ink-100`, `border-ink-200` — todas definidas no `tailwind.config.ts` da Sessão 1
