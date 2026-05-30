# Prompt — Sessão 1: Setup Inicial

> Copie e cole no Claude Code para a primeira sessão.
> Substitua os blocos [MEMORIA] com output do qmd/LightRAG quando o vault já estiver populado.

---

```
=== CONTEXTO DO PROJETO ===

[Cole aqui o conteúdo completo do CLAUDE.md]

=== OBJETIVO DESTA SESSÃO ===

Setup inicial do projeto Frésia.
Quero sair do zero até ter o monorepo rodando localmente com:
- Frontend: React + Vite + shadcn/ui com os design tokens aplicados
- Backend: Node + Express + Prisma conectado ao MySQL
- Docker Compose subindo os três serviços

=== TAREFAS PARA VOCÊ AGORA ===

1. Liste até 6 dúvidas que você tem antes de começar.

2. Proponha um plano em etapas para esta sessão com:
   - Ordem de execução
   - Arquivos que serão criados/modificados
   - Dependências a instalar

3. NÃO escreva código ainda. Aguarde minha aprovação do plano.

=== CONTEXTO EXTRA ===

Os design tokens já existem em HTML/CSS (protótipos do Claude Design).
Ao configurar o Tailwind, use estes valores exatos:

Primary (lilac):
  500: #9b83e6
  600: #8970d9
  100: #ece3f7
  50:  #f5f0fb

Accent (petal):
  400: #f5a98c
  100: #fde9e3

Success (leaf):
  500: #5a9e68

Text (ink):
  800: #1f1c26  (primary text)
  500: #6b6579  (muted)
  200: #e8e4ef  (border)
  50:  #f9f8fc  (background)

Fontes:
  Display: Fraunces (Google Fonts)
  Body: DM Sans (Google Fonts)

Border radius:
  sm: 6px / md: 10px / lg: 16px / pill: 999px
```

---

## Após aprovar o plano

Prompt para cada etapa de implementação:

```
Vamos implementar a etapa [N]: [NOME DA ETAPA].

Antes de codar:
1. Confirme os arquivos que serão criados/modificados
2. Liste qualquer decisão que precise da minha aprovação

Depois, implemente.
Use commits pequenos e explique cada mudança.
```

---

## Fim da sessão

```
Sessão encerrada.

Gere um markdown de changelog com:
1. O que foi implementado (nomes de arquivos criados/modificados)
2. Decisões técnicas e justificativas
3. Pendências e próximos passos

Formato: sem código, só texto de referência.
Título: "Sessão 2026-04-23 — Setup Inicial"
```

Salve a saída em `docs/sessions/2026-04-23.md` e `fresia-vault/01-sessoes/2026-04-23.md`.
