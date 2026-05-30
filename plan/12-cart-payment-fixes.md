# Otimização do Carrinho, Pagamento e Correção de Categorias

Este plano define a estratégia para implementar melhorias no Carrinho de Compras, Otimização de Interface no Pagamento (com Animação de Cartão e Bypass de Mercado Pago) e a resolução do bug do módulo de Categorias.

## Resumo das Modificações

### 1. Melhoria da UI do Carrinho (`CartPage.tsx`)
- **Redesign Visual**: Aplicar um visual mais limpo com foco no Subtotal, Descontos e Frete.
- **Produtos Relacionados (Cross-sell/Upsell)**: Adicionar uma vitrine na parte inferior com "Você também pode gostar", sugerindo itens com base nas categorias dos produtos já inseridos no carrinho (usando o `productService.findAll`).

### 2. UI de Pagamento e Animação de Cartão
- **Animação de Cartão de Crédito**: Atualizar o componente `CreditCardForm.tsx` para incluir uma representação visual do cartão (CSS puro ou lib leve) que vira ao digitar o CVV e atualiza em tempo real enquanto o usuário digita os dados.
- **Melhoria Visual do PIX**: Destacar o QR Code e as instruções de pagamento no PIX.

### 3. Bypass do Mercado Pago (Modo Teste)
- **UI do Modo Teste**: Adicionar um Switch/Checkbox "Ativar Modo de Teste" na área de pagamento (`CheckoutPage.tsx`).
- **Lógica de Bypass**: 
  - Quando ativado, envia o parâmetro `isTestMode: true` para a API.
  - No Backend (`orderService.ts` e `paymentService.ts`), se `isTestMode === true`, ignoramos completamente as requisições à API do Mercado Pago.
  - Para Cartão: O pedido será marcado instantaneamente como `PAID` simulando sucesso.
  - Para PIX: O sistema retornará um payload "mockado" de QR Code simulando o pagamento e aprovação automática para que o fluxo de checkout e testes de e-mail/status prossiga sem depender de credenciais reais.

### 4. Correção do Módulo de Categorias
- **Diagnóstico do Bug**: O usuário relatou que as Categorias "não estão funcionando". Vou diagnosticar e auditar todo o caminho da API do Admin e Frontend (criação, edição e exclusão).
- **Correção e Sincronização**: Garantir que as categorias criadas no Admin apareçam instantaneamente no filtro da `StorePage.tsx` e associem-se perfeitamente aos novos produtos criados.
