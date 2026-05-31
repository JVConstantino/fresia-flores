# Design: Sistema de Memória Frésia

**Data:** 2026-04-23  
**Status:** Aprovado

---

## Objetivo

Implementar o sistema de memória descrito em `docs/MEMORY_SYSTEM.md`: completar o vault Obsidian, instalar qmd para busca por keyword e configurar LightRAG para busca relacional/semântica entre sessões.

---

## Stack de Ferramentas

| Componente | Ferramenta | Motivo |
|-----------|-----------|--------|
| Vault de conhecimento | Obsidian (`fresia-vault/`) | Já parcialmente criado |
| Busca rápida por keyword | qmd (npm global) | Simples, sem setup extra |
| LLM para extração de entidades | Gemini Flash 1.5 via OpenRouter | API key já disponível |
| Embeddings vetoriais | `all-MiniLM-L6-v2` (sentence-transformers local) | Gratuito, ~80MB, ~300MB RAM em uso |
| Busca relacional/semântica | LightRAG (`lightrag-hku`) | Grafo de entidades + RAG híbrido |

**Credenciais:** `OPENROUTER_API_KEY` em `.env` (nunca commitado).

---

## Estrutura de Arquivos

```
fresia-claude-setup/
├── fresia-vault/
│   ├── 00-contexto/
│   │   ├── CLAUDE.md              (já existe)
│   │   ├── stack.md               (criar — decisões de arquitetura resumidas)
│   │   └── design-system.md       (criar — tokens e componentes resumidos)
│   ├── 01-sessoes/                (criar — changelogs por sessão)
│   ├── 02-decisoes/               (já existe)
│   ├── 03-api/
│   │   └── contracts.md           (criar — resumo dos endpoints)
│   ├── 04-bugs/                   (criar — vazio, para uso futuro)
│   └── 05-referencias/            (criar — vazio, para uso futuro)
│
└── fresia-memory/
    ├── .env                       (OPENROUTER_API_KEY — não commitado)
    ├── .env.example               (template sem valor)
    ├── .gitignore                 (ignora .env e fresia-rag/)
    ├── requirements.txt           (lightrag-hku, sentence-transformers)
    ├── index.py                   (indexa vault no LightRAG)
    ├── query.py                   (consulta o grafo LightRAG)
    └── fresia-rag/                (dados do grafo — gerado em runtime, não commitado)
```

---

## Scripts

### `index.py`
- Lê todos os `.md` de `../fresia-vault/` recursivamente
- Usa LightRAG com LLM = Gemini Flash 1.5 (OpenRouter) e embedding = `all-MiniLM-L6-v2`
- Salva grafo em `./fresia-rag/`
- Roda uma vez e depois de cada nova sessão

### `query.py`
- Recebe query como argumento de linha de comando
- Consulta LightRAG em modo `hybrid` (vetorial + grafo)
- Imprime resultado no terminal para colar no início do prompt

```bash
python query.py "decisões sobre checkout mercado pago"
python query.py "o que estava pendente na última sessão"
```

---

## Fluxo de Trabalho

### Antes de cada sessão
```bash
# Busca rápida
qmd query ./fresia-vault "últimas implementações"

# Busca relacional
python fresia-memory/query.py "pendências da última sessão"
```
Cole a saída no início do prompt.

### Durante a sessão
- Decisões importantes → `02-decisoes/YYYY-MM-DD-topico.md`
- Rascunhos → `01-sessoes/YYYY-MM-DD-rascunho.md`

### Fim de sessão
1. Gerar changelog com Claude
2. Salvar em `01-sessoes/YYYY-MM-DD.md`
3. Reindexar:
```bash
python fresia-memory/index.py
qmd index ./fresia-vault
```

---

## Etapas de Implementação (Abordagem B)

| # | Etapa | Critério de sucesso |
|---|-------|-------------------|
| 1 | Completar estrutura do vault + arquivos iniciais | Pastas criadas, arquivos com conteúdo real |
| 2 | Instalar qmd globalmente + indexar vault | `qmd query` retorna resultado relevante |
| 3 | Instalar LightRAG + sentence-transformers + criar scripts | `python index.py` completa sem erro |
| 4 | Testar query end-to-end | `python query.py "checkout"` retorna resposta contextual |

---

## Restrições

- OpenRouter não expõe endpoint de embeddings — por isso sentence-transformers local
- `fresia-rag/` não deve ser commitado (binários pesados do grafo)
- API key nunca em código — sempre via `.env`
