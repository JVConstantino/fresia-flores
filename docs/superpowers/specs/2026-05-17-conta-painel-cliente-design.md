# Design: Painel do Cliente Expandido

**Data:** 2026-05-17  
**Status:** Aprovado pelo usuário

## Contexto

O `ContaPage.tsx` atual tem apenas 2 abas (Meus Pedidos e Meus Dados) e o handler de salvar perfil é simulado (comentado). O usuário pediu expansão com: alterar senha, endereços, cartões de pagamento e melhor UI geral.

**Decisões de design aprovadas:**
- Layout: sidebar fixa à esquerda com avatar + navegação (opção A)
- Cartões: salvar apenas metadados (bandeira, últimos 4 dígitos, apelido) — sem número real
- Endereços: ilimitados, um marcado como padrão

---

## Arquitetura

### Backend — Novos endpoints

Todos protegidos por `authMiddleware`. Adicionar ao arquivo `backend/src/routes/account.ts`.

#### Perfil
```
PATCH /account/profile
Body: { name: string, phone?: string }
Resposta: { id, name, email, phone }
```
Controller: `authController.ts` — adicionar método `updateProfile`

#### Senha
```
PATCH /account/password
Body: { currentPassword: string, newPassword: string }
Resposta: { message: "Senha atualizada" }
```
Controller: `authController.ts` — adicionar método `updatePassword`  
Lógica: verificar `bcrypt.compare(currentPassword, user.passwordHash)`, rejeitar se inválida

#### Endereços
```
GET    /account/addresses          → lista todos os endereços do usuário
POST   /account/addresses          → criar endereço (se isDefault: true, desmarcar os outros)
PUT    /account/addresses/:id      → atualizar endereço
DELETE /account/addresses/:id      → remover endereço
```
Controller: novo `addressController.ts`  
Modelo: `Address` já existe no schema Prisma com todos os campos necessários

#### Cartões
```
GET    /account/cards              → lista cartões salvos
POST   /account/cards              → salvar metadados de cartão
DELETE /account/cards/:id          → remover cartão
```
Controller: novo `cardController.ts`  
Modelo: novo `PaymentCard` no schema Prisma:

```prisma
model PaymentCard {
  id        Int      @id @default(autoincrement())
  userId    Int
  brand     String   // "visa", "mastercard", "elo", etc.
  lastFour  String   // "4242"
  nickname  String?  // "Cartão pessoal"
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

Adicionar `paymentCards PaymentCard[]` no model `User`.

### Frontend — ContaPage.tsx

**Estrutura de layout:**
```
<div class="max-w-5xl mx-auto grid grid-cols-[240px_1fr] gap-6 py-10 px-6">
  <Sidebar />         ← avatar, nome, email, lista de navs, botão sair
  <ContentArea />     ← renderiza a aba ativa
</div>
```

**5 seções (state: `activeTab`):**

| Tab | Componente | Descrição |
|-----|-----------|-----------|
| `orders` | inline | Lista de pedidos — já existente, apenas refinada |
| `profile` | inline | Nome + telefone, salva via PATCH /account/profile |
| `password` | inline | Senha atual + nova + confirmar, salva via PATCH /account/password |
| `addresses` | inline | Lista + form de endereço, CRUD completo |
| `cards` | inline | Lista + form de cartão (metadados) |

**Formulários:** react-hook-form + zod em todas as seções  
**Feedback:** `toast.success` / `toast.error` via sonner (padrão do projeto)

---

## Seção: Endereços

**Formulário de endereço** (campos):
- CEP (com busca automática via ViaCEP: `https://viacep.com.br/ws/{cep}/json/`)
- Logradouro, Número, Complemento (opcional)
- Bairro, Cidade, Estado
- Checkbox "Definir como padrão"

**Comportamento:**
- Se `isDefault: true` ao salvar, backend desmarca os outros (`updateMany({ isDefault: false })` antes de salvar o novo)
- Endereço padrão aparece primeiro na lista com badge "Padrão"
- Botão excluir não aparece se for o único endereço

---

## Seção: Cartões

**Formulário** (campos):
- Apelido (ex: "Cartão pessoal")
- Bandeira (select: Visa, Mastercard, Elo, Hipercard, Amex)
- Últimos 4 dígitos (input numérico, maxLength=4)
- Checkbox "Definir como padrão"

**UI de cartão salvo:** visual estilo mini cartão (cor por bandeira, ícone, apelido, •••• 4242)

---

## Arquivos a modificar / criar

| Arquivo | Ação |
|---------|------|
| `backend/prisma/schema.prisma` | Adicionar model `PaymentCard` + relação em `User` |
| `backend/src/controllers/authController.ts` | Adicionar `updateProfile` e `updatePassword` |
| `backend/src/controllers/addressController.ts` | Criar — CRUD de endereços |
| `backend/src/controllers/cardController.ts` | Criar — CRUD de cartões |
| `backend/src/routes/account.ts` | Adicionar todas as rotas novas |
| `frontend/src/pages/account/ContaPage.tsx` | Reescrever completo com sidebar + 5 seções |

---

## Verificação

1. Logar como cliente → painel abre com sidebar e avatar
2. Editar nome/telefone → salvar → atualiza sem reload
3. Alterar senha com senha errada → mensagem de erro
4. Alterar senha correta → sucesso, campos limpos
5. Adicionar endereço com CEP → campos preenchidos automaticamente
6. Marcar endereço como padrão → badge aparece, outros desmarcados
7. Adicionar cartão (metadados) → aparece na lista com visual de mini-cartão
8. Excluir endereço / cartão → some da lista
9. Aba Pedidos → lista carrega normalmente
