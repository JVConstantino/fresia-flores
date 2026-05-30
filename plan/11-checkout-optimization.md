# Otimização do Checkout (SaaS Patterns)

Esta análise compara o checkout atual da Frésia com as pesquisas de melhores práticas do mercado, propondo um plano de evolução para aumentar a conversão.

## 📊 Análise e Comparação

| Funcionalidade (SaaS Moderno) | Como está hoje na Frésia | O que podemos melhorar |
|-------------------------------|--------------------------|------------------------|
| **1. Identificação (Auth)** | O cliente é obrigado a fazer Login ou Cadastrar uma conta com senha no Step 0. | **Guest Checkout (Convidado):** Permitir compras apenas com Email, Nome e CPF, sem forçar criação de senha. |
| **2. Endereço e CEP** | Autofill via ViaCEP implementado, mas os campos estão divididos entre os Steps 1 (CEP) e 2 (Dados). | **Merge de Steps:** Juntar a busca do CEP com o preenchimento da rua e número no mesmo passo para reduzir fricção. |
| **3. Opções de Frete** | Fixo em "motoboy" calculando taxa pelo bairro selecionado. | **Múltiplos Métodos:** Criar opção de "Retirada na Loja" (grátis) e "Entrega Local" (taxa do bairro). |
| **4. Retenção de Dados** | Se a página recarregar, o usuário perde os dados preenchidos no formulário. | **Auto-save:** Salvar o progresso no `localStorage` automaticamente a cada campo preenchido. |
| **5. Pagamento (PIX)** | Cartão e PIX implementados, mas a UX do PIX pode ser mais fluida. | Destacar PIX com desconto (opcional) e simplificar o passo de geração. |

---

## 🛠️ Plano de Implementação Proposto

Com base na comparação, propomos as seguintes mudanças técnicas para atingir o "próximo nível":

### Fase 1: Suporte a Guest Checkout (Convidado)
- **Schema Prisma:** Alterar `userId Int` para `userId Int?` no model `Order`, permitindo pedidos sem conta atrelada.
- **Backend:** Ajustar o `authMiddleware` e `orderController` para aceitar a criação de pedidos públicos (guest) sem erro de autenticação.
- **Frontend:** Alterar o Step 0 do Checkout. Ao digitar o email:
  - Se existir conta: pede senha (Login automático).
  - Se não existir: pede apenas Nome e CPF (Convidado), removendo a fricção de criar senha.

### Fase 2: Reestruturação de Steps (UX) e Auto-save
Reduzir de 6 passos soltos para 4 passos super diretos e intuitivos:
- **Step 1:** Identificação (Email/Nome/Auth)
- **Step 2:** Endereço + Frete (Busca CEP e escolha: Retirar ou Entrega)
- **Step 3:** Revisão Final + Mensagem para presente
- **Step 4:** Pagamento
- **Estado (Zustand):** Adicionar persistência (`zustand/persist`) ao formulário do checkout para que um `F5` na página não zere os dados digitados.

### Fase 3: Múltiplos Métodos de Entrega
- Atualizar a interface do Step 2 para perguntar: `Como você quer receber?`
  - `[ ] Receber em Casa (Taxa calculada via Bairro)`
  - `[ ] Retirar na Loja (Grátis)`
- Atualizar a prop `deliveryMethod` (que já existe no banco) para refletir essa escolha na criação do pedido.

---

### Perguntas para Revisão
1. Você concorda em alterarmos o banco de dados para permitir **Checkout como Convidado** (`userId` opcional)?
2. Deseja que a opção de **Retirada na Loja** seja adicionada como método de frete?
