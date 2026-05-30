# Sistema de Memória — Frésia + Obsidian + qmd + LightRAG

## Por que isso existe

Claude Code não tem memória entre sessões.
Este sistema resolve isso: cada sessão deixa rastro estruturado no Obsidian,
e você consulta/injeta contexto relevante no início de cada nova sessão via qmd + LightRAG.

---

## Componentes

| Ferramenta | Papel |
|------------|-------|
| **Obsidian** | Vault de conhecimento do projeto (decisões, specs, changelogs) |
| **qmd** (github.com/tobi/qmd) | Query em markdown — busca semântica local nos seus `.md` |
| **LightRAG** (github.com/hkuds/lightrag) | Grafo de conhecimento + RAG sobre o vault Obsidian |

---

## Estrutura do Vault Obsidian

```
fresia-vault/
├── 00-contexto/
│   ├── CLAUDE.md          # Espelho do CLAUDE.md do repo
│   ├── stack.md           # Decisões de arquitetura
│   └── design-system.md   # Design tokens resumidos
│
├── 01-sessoes/
│   ├── 2026-04-23.md      # Changelog por sessão (gerado pelo Claude)
│   └── ...
│
├── 02-decisoes/
│   ├── auth-jwt.md        # Por que JWT e não sessions
│   ├── prisma-vs-raw.md   # Por que Prisma
│   └── ...
│
├── 03-api/
│   ├── contracts.md       # Endpoints + payloads
│   └── mercadopago.md     # Notas de integração MP
│
├── 04-bugs/
│   └── ...                # Bugs importantes e como foram resolvidos
│
└── 05-referencias/
    ├── shopify-patterns.md
    └── woocommerce-patterns.md
```

---

## Setup — qmd

```bash
# Instalar
npm install -g qmd

# Indexar o vault
qmd index ./fresia-vault

# Consultar (ex: antes de uma sessão)
qmd query ./fresia-vault "decisões sobre checkout mercado pago"
qmd query ./fresia-vault "estrutura de pastas backend"
```

Use a saída do `qmd query` para montar o bloco de contexto que você cola no início de cada prompt do Claude Code.

---

## Setup — LightRAG

```bash
# Instalar
pip install lightrag-hku

# Indexar o vault
python -c "
from lightrag import LightRAG, QueryParam
import os, glob

rag = LightRAG(working_dir='./fresia-rag')

# Indexar todos os .md do vault
for f in glob.glob('./fresia-vault/**/*.md', recursive=True):
    with open(f) as fp:
        rag.insert(fp.read())
"

# Consultar
python -c "
from lightrag import LightRAG, QueryParam
rag = LightRAG(working_dir='./fresia-rag')
print(rag.query('como funciona o carrinho?', param=QueryParam(mode='hybrid')))
"
```

LightRAG é mais poderoso que qmd para perguntas abertas — ele constrói um grafo de entidades e relacionamentos, então responde com mais contexto relacional (ex: "o carrinho usa Zustand que depende de...").

---

## Fluxo de Trabalho por Sessão

### Antes da sessão (2 min)

```bash
# 1. Ver o que mudou nas últimas sessões
qmd query ./fresia-vault "últimas implementações e pendências"

# 2. Contexto específico da tarefa de hoje
qmd query ./fresia-vault "checkout mercado pago webhook"
```

Cole a saída no início do prompt, junto com o `CLAUDE.md`.

**Template de início de sessão:**

```
=== CONTEXTO DO PROJETO ===
[Cole aqui o CLAUDE.md]

=== MEMÓRIA DAS SESSÕES ANTERIORES ===
[Cole aqui o output do qmd/LightRAG]

=== OBJETIVO DE HOJE ===
Implementar [FEATURE X].

Tarefas:
1. Liste dúvidas (máx 5)
2. Proponha plano em etapas
3. NÃO escreva código ainda
```

### Durante a sessão

Mantenha um rascunho no Obsidian em `01-sessoes/YYYY-MM-DD-rascunho.md` com anotações rápidas.

### Fim da sessão

Peça ao Claude para gerar o changelog:

```
Gere um arquivo markdown de changelog desta sessão com:
1. O que foi implementado (com nomes de arquivos)
2. Decisões técnicas tomadas e o motivo
3. Pendências e próximos passos
4. Nenhum código — só texto de referência
```

Salve em `01-sessoes/YYYY-MM-DD.md` no vault e também em `docs/sessions/YYYY-MM-DD.md` no repo.

Re-indexe o vault:

```bash
qmd index ./fresia-vault
# ou re-insira o novo arquivo no LightRAG
```

---

## Integração com Obsidian

### Plugin recomendado: Templater

Crie um template em Obsidian para changelogs de sessão:

```markdown
---
date: <% tp.date.now("YYYY-MM-DD") %>
tags: [sessao, fresia]
---

# Sessão <% tp.date.now("YYYY-MM-DD") %>

## Implementado
-

## Decisões
-

## Pendências
-

## Próxima sessão
-
```

### Plugin recomendado: Dataview

Para ter uma visão consolidada das pendências:

```dataview
TABLE date, pendencias
FROM "01-sessoes"
SORT date DESC
LIMIT 5
```

---

## Por que não só o CLAUDE.md?

O `CLAUDE.md` é estático — documenta o estado atual do projeto.
O vault Obsidian é dinâmico — documenta a **evolução**, as **decisões**, os **erros** e os **aprendizados**.

Com LightRAG você consegue perguntar coisas como:
- "Por que mudamos de PHP para React?"
- "Quais bugs já tivemos no módulo de pagamento?"
- "O que estava pendente na sessão anterior ao checkout?"

E receber respostas contextuais, não só buscas por palavra-chave.

---

**Versão**: 1.0
**Última atualização**: 23 de Abril de 2026
