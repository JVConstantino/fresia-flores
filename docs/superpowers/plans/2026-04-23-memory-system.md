# Memory System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configurar o sistema de memória entre sessões do projeto Frésia: vault Obsidian completo + qmd para busca por keyword + LightRAG para busca relacional com Gemini Flash (OpenRouter) e embeddings locais.

**Architecture:** O vault Obsidian em `fresia-claude-setup/fresia-vault/` serve como fonte de verdade do conhecimento do projeto. O qmd indexa os `.md` para busca rápida por keyword. O LightRAG extrai entidades e relações dos mesmos arquivos via LLM, gera embeddings locais e permite queries híbridas (vetorial + grafo) — tudo orquestrado por dois scripts Python em `fresia-claude-setup/fresia-memory/`.

**Tech Stack:** Python 3.10+, lightrag-hku, sentence-transformers (`all-MiniLM-L6-v2`), openai SDK (apontado para OpenRouter), Node.js (qmd global), Obsidian (vault local).

---

## Mapa de Arquivos

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `fresia-vault/00-contexto/stack.md` | Decisões de arquitetura resumidas |
| Criar | `fresia-vault/00-contexto/design-system.md` | Tokens e componentes resumidos |
| Criar | `fresia-vault/01-sessoes/.gitkeep` | Pasta para changelogs de sessão |
| Criar | `fresia-vault/03-api/contracts.md` | Resumo dos endpoints da API |
| Criar | `fresia-vault/04-bugs/.gitkeep` | Pasta para bugs registrados |
| Criar | `fresia-vault/05-referencias/.gitkeep` | Pasta para referências externas |
| Criar | `fresia-memory/.env` | Variáveis de ambiente (não commitado) |
| Criar | `fresia-memory/.env.example` | Template público da .env |
| Criar | `fresia-memory/.gitignore` | Ignora .env e fresia-rag/ |
| Criar | `fresia-memory/requirements.txt` | Dependências Python |
| Criar | `fresia-memory/index.py` | Indexa vault no LightRAG |
| Criar | `fresia-memory/query.py` | Consulta o grafo LightRAG |

---

## Task 1: Completar a Estrutura do Vault Obsidian

**Files:**
- Create: `fresia-claude-setup/fresia-vault/00-contexto/stack.md`
- Create: `fresia-claude-setup/fresia-vault/00-contexto/design-system.md`
- Create: `fresia-claude-setup/fresia-vault/01-sessoes/.gitkeep`
- Create: `fresia-claude-setup/fresia-vault/03-api/contracts.md`
- Create: `fresia-claude-setup/fresia-vault/04-bugs/.gitkeep`
- Create: `fresia-claude-setup/fresia-vault/05-referencias/.gitkeep`

- [ ] **Step 1: Criar `stack.md`**

```markdown
---
date: 2026-04-23
tags: [contexto, stack]
---

# Stack Frésia

## Camadas

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite 5 |
| UI | shadcn/ui + Tailwind CSS v4 |
| Backend | Node.js + Express 5 |
| Banco | MySQL 8.0 (ORM: Prisma) |
| Pagamento | Mercado Pago (Checkout Pro) |
| Auth | JWT + httpOnly cookies |
| Upload | Multer → armazenamento local |
| Email | Nodemailer |
| Deploy | Docker Compose |

## Padrões

- Estado global: Zustand (cart, auth)
- Forms: React Hook Form + Zod
- Roteamento: React Router v6
- Chamadas API: axios com interceptors JWT
- Controllers só delegam para Services
- Prisma para todas as queries (nunca SQL raw sem justificativa)
- Erros via middleware centralizado (errorHandler.ts)

## Decisões relevantes

- Stack migrada de PHP → React+Node em Abr/2026 (ver 02-decisoes/php-para-react.md)
- shadcn/ui: nunca modificar components/ui/ — extender em components/features/
```

Salvar em: `fresia-claude-setup/fresia-vault/00-contexto/stack.md`

- [ ] **Step 2: Criar `design-system.md`**

```markdown
---
date: 2026-04-23
tags: [contexto, design]
---

# Design System Frésia v2.0

## Paleta de Cores

```css
--lilac-500: #9b83e6;   /* CTAs, botões principais */
--lilac-600: #8970d9;   /* hover */
--lilac-100: #ece3f7;   /* backgrounds leves */
--petal-400: #f5a98c;   /* promoções, badges */
--leaf-500:  #5a9e68;   /* sucesso */
--ink-800:   #1f1c26;   /* texto principal */
--ink-500:   #6b6579;   /* muted */
--ink-200:   #e8e4ef;   /* border */
--ink-50:    #f9f8fc;   /* background */
```

## Tipografia

- Display: Fraunces (italic, 400–700) — h1, h2, h3
- Corpo: DM Sans (300–700) — body, botões, nav

## Border Radius

- sm: 6px / md: 10px / lg: 16px / pill: 999px

## Componentes Chave

- btn-primary: ink-900 bg, pill, hover translateY(-1px)
- btn-lilac: lilac-500 bg, shadow ao hover
- .card: branco, border ink-200, radius 16px
- .input: focus ring lilac-500 opacity 12%
- .badge-lilac / .badge-petal / .badge-leaf
- .brand: Fraunces italic, lilac-500, dot petal-400

## Mapeamento shadcn

primary → lilac-500 | secondary → petal-400
background → ink-50 | foreground → ink-800
muted → ink-100 | border → ink-200 | radius md → 10px
```

Salvar em: `fresia-claude-setup/fresia-vault/00-contexto/design-system.md`

- [ ] **Step 3: Criar `contracts.md`**

```markdown
---
date: 2026-04-23
tags: [api, contratos]
---

# API Contracts — prefixo `/api/v1`

## Loja Pública

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /products | Listagem com filtros/sort |
| GET | /products/:slug | Detalhe + variantes |
| GET | /categories | Listagem de categorias |
| GET | /neighborhoods | Bairros + taxa de entrega |
| POST | /orders | Criar pedido |
| GET | /orders/:id/track | Rastreamento público |
| POST | /newsletter | Inscrição na newsletter |

## Auth

| Método | Rota |
|--------|------|
| POST | /auth/login |
| POST | /auth/register |
| POST | /auth/logout |
| GET | /auth/me |

## Conta do Cliente (auth obrigatório)

| Método | Rota |
|--------|------|
| GET/PATCH | /account/profile |
| GET | /account/orders |
| GET | /account/orders/:id |

## Admin (isAdmin obrigatório)

| Método | Rota |
|--------|------|
| CRUD | /admin/products |
| CRUD | /admin/orders |
| CRUD | /admin/categories |
| CRUD | /admin/neighborhoods |
| GET/PATCH | /admin/settings |
| GET | /admin/dashboard/stats |

## Pagamento

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /payment/create-preference | Cria preferência no Mercado Pago |
| POST | /payment/webhook | Recebe notificações do MP |
```

Salvar em: `fresia-claude-setup/fresia-vault/03-api/contracts.md`

- [ ] **Step 4: Criar pastas vazias com `.gitkeep`**

Criar arquivos vazios em:
- `fresia-claude-setup/fresia-vault/01-sessoes/.gitkeep`
- `fresia-claude-setup/fresia-vault/04-bugs/.gitkeep`
- `fresia-claude-setup/fresia-vault/05-referencias/.gitkeep`

- [ ] **Step 5: Verificar estrutura**

Rodar:
```bash
find fresia-claude-setup/fresia-vault -type f | sort
```

Saída esperada:
```
fresia-claude-setup/fresia-vault/00-contexto/CLAUDE.md
fresia-claude-setup/fresia-vault/00-contexto/design-system.md
fresia-claude-setup/fresia-vault/00-contexto/stack.md
fresia-claude-setup/fresia-vault/01-sessoes/.gitkeep
fresia-claude-setup/fresia-vault/02-decisoes/php-para-react.md
fresia-claude-setup/fresia-vault/03-api/contracts.md
fresia-claude-setup/fresia-vault/04-bugs/.gitkeep
fresia-claude-setup/fresia-vault/05-referencias/.gitkeep
```

---

## Task 2: Instalar qmd e Indexar o Vault

**Pré-requisito:** Node.js instalado (`node -v` deve retornar versão)

- [ ] **Step 1: Instalar qmd globalmente**

```bash
npm install -g qmd
```

Verificar:
```bash
qmd --version
```
Esperado: versão impressa sem erro.

- [ ] **Step 2: Indexar o vault**

A partir do diretório `fresia-claude-setup/`:
```bash
qmd index ./fresia-vault
```

Esperado: mensagem de conclusão sem erros.

- [ ] **Step 3: Testar uma query**

```bash
qmd query ./fresia-vault "stack tecnológica do projeto"
```

Esperado: saída com trechos relevantes de `stack.md` ou `CLAUDE.md`.

- [ ] **Step 4: Testar segunda query**

```bash
qmd query ./fresia-vault "decisão migração PHP React"
```

Esperado: saída com conteúdo de `02-decisoes/php-para-react.md`.

---

## Task 3: Criar Arquivos de Configuração do fresia-memory

**Files:**
- Create: `fresia-claude-setup/fresia-memory/.env`
- Create: `fresia-claude-setup/fresia-memory/.env.example`
- Create: `fresia-claude-setup/fresia-memory/.gitignore`
- Create: `fresia-claude-setup/fresia-memory/requirements.txt`

- [ ] **Step 1: Criar `.gitignore`**

```
.env
fresia-rag/
__pycache__/
*.pyc
.venv/
```

Salvar em: `fresia-claude-setup/fresia-memory/.gitignore`

- [ ] **Step 2: Criar `.env.example`**

```
OPENROUTER_API_KEY=
```

Salvar em: `fresia-claude-setup/fresia-memory/.env.example`

- [ ] **Step 3: Criar `.env`**

```
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
```

Salvar em: `fresia-claude-setup/fresia-memory/.env`

- [ ] **Step 4: Criar `requirements.txt`**

```
lightrag-hku>=1.3.0
sentence-transformers>=3.0.0
openai>=1.0.0
python-dotenv>=1.0.0
```

Salvar em: `fresia-claude-setup/fresia-memory/requirements.txt`

---

## Task 4: Instalar Dependências Python

**Pré-requisito:** Python 3.10+ instalado (`python --version`)

- [ ] **Step 1: Criar e ativar ambiente virtual**

```bash
cd fresia-claude-setup/fresia-memory
python -m venv .venv
```

Windows (PowerShell):
```powershell
.venv\Scripts\Activate.ps1
```

Windows (bash/Git Bash):
```bash
source .venv/Scripts/activate
```

- [ ] **Step 2: Instalar dependências**

```bash
pip install -r requirements.txt
```

A instalação do `sentence-transformers` baixa ~500MB de dependências (torch). Aguardar conclusão.

- [ ] **Step 3: Verificar instalações**

```bash
python -c "import lightrag; print('lightrag ok')"
python -c "from sentence_transformers import SentenceTransformer; print('sentence-transformers ok')"
python -c "import openai; print('openai ok')"
```

Esperado: cada linha imprime `ok` sem erro.

---

## Task 5: Criar `index.py`

**Files:**
- Create: `fresia-claude-setup/fresia-memory/index.py`

- [ ] **Step 1: Criar o script de indexação**

```python
import asyncio
import os
import glob
from pathlib import Path
from dotenv import load_dotenv
from openai import AsyncOpenAI
from sentence_transformers import SentenceTransformer
from lightrag import LightRAG, QueryParam
from lightrag.utils import EmbeddingFunc

load_dotenv()

VAULT_PATH = Path(__file__).parent.parent / "fresia-vault"
RAG_PATH = Path(__file__).parent / "fresia-rag"

client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

embed_model = SentenceTransformer("all-MiniLM-L6-v2")


async def llm_func(prompt, system_prompt=None, history_messages=[], **kwargs):
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.extend(history_messages)
    messages.append({"role": "user", "content": prompt})
    response = await client.chat.completions.create(
        model="google/gemini-flash-1.5",
        messages=messages,
    )
    return response.choices[0].message.content


async def embedding_func(texts: list[str]) -> list[list[float]]:
    embeddings = embed_model.encode(texts, normalize_embeddings=True)
    return embeddings.tolist()


async def main():
    RAG_PATH.mkdir(exist_ok=True)

    rag = LightRAG(
        working_dir=str(RAG_PATH),
        llm_model_func=llm_func,
        embedding_func=EmbeddingFunc(
            embedding_dim=384,
            max_token_size=8192,
            func=embedding_func,
        ),
    )

    md_files = glob.glob(str(VAULT_PATH / "**" / "*.md"), recursive=True)
    md_files = [f for f in md_files if ".gitkeep" not in f]

    print(f"Indexando {len(md_files)} arquivos do vault...")

    for filepath in md_files:
        with open(filepath, encoding="utf-8") as f:
            content = f.read().strip()
        if not content:
            continue
        rel = Path(filepath).relative_to(VAULT_PATH)
        print(f"  → {rel}")
        await rag.ainsert(content)

    print("✓ Indexação concluída.")


if __name__ == "__main__":
    asyncio.run(main())
```

Salvar em: `fresia-claude-setup/fresia-memory/index.py`

- [ ] **Step 2: Rodar a indexação**

```bash
cd fresia-claude-setup/fresia-memory
python index.py
```

Esperado: linhas `→ 00-contexto/CLAUDE.md`, `→ 00-contexto/stack.md`, etc., seguidas de `✓ Indexação concluída.`

O primeiro run faz o download do modelo `all-MiniLM-L6-v2` (~80MB). Aguardar.

- [ ] **Step 3: Verificar pasta gerada**

```bash
ls fresia-rag/
```

Esperado: arquivos como `graph_chunk_entity_relation.graphml`, `kv_store_*.json`, `vdb_*.json` dentro da pasta.

---

## Task 6: Criar `query.py`

**Files:**
- Create: `fresia-claude-setup/fresia-memory/query.py`

- [ ] **Step 1: Criar o script de query**

```python
import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from openai import AsyncOpenAI
from sentence_transformers import SentenceTransformer
from lightrag import LightRAG, QueryParam
from lightrag.utils import EmbeddingFunc

load_dotenv()

RAG_PATH = Path(__file__).parent / "fresia-rag"

client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

embed_model = SentenceTransformer("all-MiniLM-L6-v2")


async def llm_func(prompt, system_prompt=None, history_messages=[], **kwargs):
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.extend(history_messages)
    messages.append({"role": "user", "content": prompt})
    response = await client.chat.completions.create(
        model="google/gemini-flash-1.5",
        messages=messages,
    )
    return response.choices[0].message.content


async def embedding_func(texts: list[str]) -> list[list[float]]:
    embeddings = embed_model.encode(texts, normalize_embeddings=True)
    return embeddings.tolist()


async def main(query: str):
    rag = LightRAG(
        working_dir=str(RAG_PATH),
        llm_model_func=llm_func,
        embedding_func=EmbeddingFunc(
            embedding_dim=384,
            max_token_size=8192,
            func=embedding_func,
        ),
    )

    result = await rag.aquery(query, param=QueryParam(mode="hybrid"))
    print(result)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python query.py \"sua pergunta aqui\"")
        sys.exit(1)
    asyncio.run(main(" ".join(sys.argv[1:])))
```

Salvar em: `fresia-claude-setup/fresia-memory/query.py`

- [ ] **Step 2: Testar query simples**

```bash
python query.py "qual é a stack do projeto Frésia"
```

Esperado: resposta em português descrevendo React, Node, Prisma, MySQL.

- [ ] **Step 3: Testar query relacional**

```bash
python query.py "por que a stack foi migrada de PHP para React"
```

Esperado: resposta mencionando a decisão de Abril 2026 e as razões (preferência do dono, shadcn/ui, Prisma).

- [ ] **Step 4: Testar query de API**

```bash
python query.py "quais são os endpoints de pagamento"
```

Esperado: resposta mencionando `/payment/create-preference` e `/payment/webhook`.

---

## Task 7: Documentar Fluxo de Uso no Vault

**Files:**
- Create: `fresia-claude-setup/fresia-vault/00-contexto/memory-workflow.md`

- [ ] **Step 1: Criar arquivo de workflow**

```markdown
---
date: 2026-04-23
tags: [contexto, workflow]
---

# Fluxo de Trabalho — Sistema de Memória

## Antes de cada sessão

```bash
# Busca rápida por keyword
qmd query ./fresia-vault "últimas implementações"

# Busca relacional (recomendado para contexto profundo)
python fresia-memory/query.py "o que estava pendente na última sessão"
python fresia-memory/query.py "decisões sobre [tema da sessão]"
```

Cole a saída no início do prompt junto com o CLAUDE.md.

## Durante a sessão

- Decisões técnicas → salvar em `02-decisoes/YYYY-MM-DD-topico.md`
- Rascunhos rápidos → `01-sessoes/YYYY-MM-DD-rascunho.md`

## Fim da sessão

Pedir ao Claude:
> "Gere um changelog desta sessão: o que foi implementado (com nomes de arquivos), decisões técnicas e motivos, pendências e próximos passos. Sem código, só texto."

Salvar em `01-sessoes/YYYY-MM-DD.md`, então reindexar:

```bash
python fresia-memory/index.py
qmd index ./fresia-vault
```

## Adicionar nova decisão ao vault

```bash
# 1. Criar arquivo em 02-decisoes/
# 2. Reindexar
python fresia-memory/index.py
qmd index ./fresia-vault
```
```

Salvar em: `fresia-claude-setup/fresia-vault/00-contexto/memory-workflow.md`

- [ ] **Step 2: Reindexar o vault com o novo arquivo**

```bash
python fresia-memory/index.py
qmd index ./fresia-vault
```

Esperado: `→ 00-contexto/memory-workflow.md` na lista de indexação.

---

## Self-Review Checklist

- [x] Spec coverage: vault (Task 1), qmd (Task 2), config (Task 3), Python deps (Task 4), index.py (Task 5), query.py (Task 6), documentação de workflow (Task 7)
- [x] Sem placeholders: todos os steps têm código ou comandos concretos
- [x] Consistência de tipos: `embedding_dim=384` corresponde ao `all-MiniLM-L6-v2` em ambos index.py e query.py
- [x] Path do vault: `Path(__file__).parent.parent / "fresia-vault"` é consistente entre index.py e query.py
- [x] `.env` com a API key real — lembrar de não commitar
