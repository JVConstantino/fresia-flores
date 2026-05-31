# Design: Sessão 2 — Componentes shadcn Base + Layout Header/Footer

**Data:** 2026-04-24
**Status:** Aprovado

---

## Objetivo

Instalar os componentes shadcn base, criar o Header e Footer da loja, e montar o Layout wrapper — deixando `localhost:5173` com a estrutura visual real da aplicação.

---

## Decisões

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Ícones | lucide-react outline/flat, sem cor | Consistência visual, já instalado |
| Carrinho | Offcanvas (Sheet shadcn) deslizando da direita | UX melhor que página separada |
| Header layout | 3 colunas: Logo \| Nav \| Actions | Opção A aprovada, fiel ao protótipo |
| Responsividade | Sem mobile nessa sessão | Implementar em sessão futura |
| Categorias no nav | Placeholder com chevron, dropdown real na Sessão 3 | Dados de categoria virão da API |

---

## Componentes shadcn a Instalar

| Componente | Comando | Usado em |
|-----------|---------|---------|
| Button | `npx shadcn@latest add button` | CTAs, forms, header actions |
| Card | `npx shadcn@latest add card` | Produto, pedido, admin |
| Input | `npx shadcn@latest add input` | Busca, forms, newsletter |
| Badge | `npx shadcn@latest add badge` | Status pedido, categorias |
| Dialog | `npx shadcn@latest add dialog` | Confirmações, modais |
| Sheet | `npx shadcn@latest add sheet` | Offcanvas do carrinho |

Todos gerados em `frontend/src/components/ui/` — **nunca modificar esses arquivos**.

---

## Arquivos a Criar/Modificar

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `frontend/src/store/cartStore.ts` | Estado do carrinho (Zustand) — isOpen, count |
| Criar | `frontend/src/components/layout/Header.tsx` | Header sticky com nav e offcanvas |
| Criar | `frontend/src/components/layout/Footer.tsx` | Footer 4 colunas |
| Criar | `frontend/src/components/layout/Layout.tsx` | Wrapper Header + main + Footer |
| Modificar | `frontend/src/App.tsx` | Usar Layout + conteúdo placeholder |
| Instalar | `frontend/src/components/ui/*` | 6 componentes shadcn via CLI |

---

## Header (`Header.tsx`)

### Estrutura

```
<header sticky frosted-glass>
  <div grid-3-cols>
    <Logo />           ← "Frésia" Fraunces italic lilac-500, dot petal-400 acima
    <Nav />            ← Início | Loja | Categorias ▾ | Sobre nós | Contato
    <Actions />        ← Search + Account + Cart (ícones outline lucide)
  </div>
</header>
```

### Estilo

- `sticky top-0 z-40 bg-ink-50/85 backdrop-blur-md border-b border-ink-200`
- Grid: `grid grid-cols-[auto_1fr_auto] items-center gap-10 max-w-7xl mx-auto px-7 py-4`

### Nav

- Links: `text-ink-500 hover:text-ink-800 text-sm transition-colors`
- Link ativo: `text-ink-800 font-medium` + dot petal-400 centralizado abaixo
- Categorias: `flex items-center gap-1` com `ChevronDown` (lucide, 14px) — sem dropdown nessa sessão

### Actions

- Botões circulares `w-10 h-10 rounded-full hover:bg-ink-100 transition-colors`
- Ícones lucide: `Search`, `User`, `ShoppingBag` — tamanho 18px, cor ink-600
- Badge do carrinho: `absolute top-1 right-1 w-4 h-4 rounded-full bg-petal-400 text-white text-[10px] font-bold` — mostra count do cartStore (oculto quando 0)

### Cart Offcanvas (Sheet)

- Trigger: botão do carrinho no header
- Sheet: `side="right"`, largura `w-80 sm:w-96`
- Conteúdo nessa sessão: título "Carrinho" + mensagem "Seu carrinho está vazio" + botão fechar
- Estado gerenciado por `cartStore.isOpen` / `cartStore.openCart()` / `cartStore.closeCart()`

---

## Footer (`Footer.tsx`)

### Estrutura — 4 colunas

```
Col 1: Marca
  "Frésia" Fraunces italic 40px lilac-500
  Tagline: "Flores com alma, entregues com carinho."
  Ícones sociais: Instagram, Facebook, MessageCircle (lucide-react — WhatsApp não existe no lucide, usar MessageCircle como placeholder)

Col 2: Navegação
  Início / Loja / Sobre nós / Rastrear pedido

Col 3: Atendimento
  Contato / FAQ / Entregas e prazos / Política de troca

Col 4: Newsletter
  Título + parágrafo curto
  Input email + Button "Assinar" (variante lilac)

Rodapé (linha inferior):
  © 2026 Frésia Flores · Todos os direitos reservados
```

### Estilo

- `bg-white border-t border-ink-200 pt-16 pb-8 mt-24`
- Grid: `grid grid-cols-[1.4fr_1fr_1fr_1.4fr] gap-12 max-w-7xl mx-auto px-7`
- Títulos das colunas: `text-[11px] font-semibold tracking-widest uppercase text-ink-800 mb-4`
- Links: `text-sm text-ink-500 hover:text-ink-800 block py-1 transition-colors`

---

## cartStore (`cartStore.ts`)

```ts
// Estado mínimo para essa sessão:
interface CartStore {
  isOpen: boolean
  count: number          // calculado dos items (sempre 0 agora)
  openCart: () => void
  closeCart: () => void
}
// items[] reais implementados na Sessão 4
```

Instalar Zustand: `npm install zustand` no frontend.

---

## Layout (`Layout.tsx`)

```tsx
interface LayoutProps { children: React.ReactNode }

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

---

## Critério de Sucesso

1. `localhost:5173` exibe Header + conteúdo + Footer sem erros de console
2. Clicar no ícone de carrinho abre Sheet lateral da direita
3. Todos os 6 componentes shadcn gerados em `components/ui/` sem erros
4. Ícones todos outline/flat (sem cor), usando lucide-react

---

## Fora do Escopo desta Sessão

- Dropdown real de categorias (Sessão 3)
- Itens reais no carrinho (Sessão 4)
- Responsividade mobile
- Funcionalidade de busca
- Link de conta (autenticação na Sessão 6)
