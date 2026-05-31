# Instruções para Suporte Hostinger - Deploy Frésia Flores

## 📋 Resumo da Situação

O frontend do site **fresiaflores.com.br** foi deployado com sucesso via MCP, mas o backend precisa ser compilado manualmente para o site funcionar completamente.

---

## ✅ O que já foi feito

1. ✅ Deploy do código-fonte realizado via MCP
2. ✅ Frontend (React/Vite) compilado com sucesso
3. ✅ Arquivos estáticos gerados em `frontend/dist/`
4. ✅ Arquivo `server.js` criado na raiz para iniciar o backend

---

## 🔧 O que precisa ser feito

### **Passo 1: Acessar o Terminal SSH**

1. Acesse o hPanel: https://hpanel.hostinger.com
2. Navegue até: **Avançado** → **SSH**
3. Copie as credenciais de acesso SSH (host, usuário, senha)
4. Conecte via terminal:
   ```bash
   ssh u903737197@srv1894.hstgr.io
   ```

### **Passo 2: Navegar até o diretório do projeto**

```bash
cd ~/domains/fresiaflores.com.br
```

### **Passo 3: Compilar o Backend**

Execute o comando para compilar o TypeScript do backend:

```bash
npm run build:backend
```

**O que este comando faz:**
- Instala dependências do backend (`cd backend && npm install`)
- Compila TypeScript para JavaScript (`npm run build`)
- Gera os arquivos em `backend/dist/`

**Tempo estimado:** 30-60 segundos

**Resultado esperado:**
```
> fresia-flores@1.0.0 build:backend
> cd backend && npm install && npm run build

added 164 packages in 5s
> fresia-backend@1.0.0 build
> tsc
```

### **Passo 4: Configurar Variáveis de Ambiente**

#### **Opção A: Via hPanel (Recomendado)**

1. No hPanel, vá em: **Avançado** → **Node.js**
2. Encontre a aplicação `fresiaflores.com.br`
3. Clique em **Editar** (ícone de lápis)
4. Role até a seção **Environment variables**
5. Adicione as seguintes variáveis:

| Nome | Valor |
|------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `DATABASE_URL` | `mysql://u903737197_fresia_next:SENHA_AQUI@srv1894.hstgr.io:3306/u903737197_fresia_next` |
| `JWT_SECRET` | `fresia_jwt_2026_super_seguro_trocar_em_producao` |
| `MP_ACCESS_TOKEN` | `APP_USR-seu_token_mercado_pago` |
| `MP_PUBLIC_KEY` | `APP_USR-sua_chave_publica_mercado_pago` |

**⚠️ IMPORTANTE:**
- Substitua `SENHA_AQUI` pela senha real do banco de dados MySQL
- Substitua os tokens do Mercado Pago pelos valores reais
- Clique em **Salvar** após adicionar todas as variáveis

#### **Opção B: Via Terminal SSH**

Crie o arquivo `.env` na raiz do projeto:

```bash
cd ~/domains/fresiaflores.com.br
nano .env
```

Cole o seguinte conteúdo (substitua os valores):

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=mysql://u903737197_fresia_next:SENHA_AQUI@srv1894.hstgr.io:3306/u903737197_fresia_next
JWT_SECRET=fresia_jwt_2026_super_seguro_trocar_em_producao
MP_ACCESS_TOKEN=APP_USR-seu_token_mercado_pago
MP_PUBLIC_KEY=APP_USR-sua_chave_publica_mercado_pago
```

Salve o arquivo: `Ctrl+X`, depois `Y`, depois `Enter`

### **Passo 5: Reiniciar a Aplicação Node.js**

#### **Via hPanel:**

1. No hPanel, vá em: **Avançado** → **Node.js**
2. Encontre a aplicação `fresiaflores.com.br`
3. Clique no botão **RESTART** (ícone de recarregar)
4. Aguarde 10-15 segundos

#### **Via Terminal SSH:**

```bash
cd ~/domains/fresiaflores.com.br
source /home/u903737197/nodevenv/domains/fresiaflores.com.br/20/bin/activate
pm2 restart all
```

### **Passo 6: Verificar se está funcionando**

#### **Teste 1: Verificar se o processo está rodando**

```bash
pm2 list
```

**Resultado esperado:**
```
┌─────┬────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name           │ mode        │ status  │ restart │ cpu      │
├─────┼────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ server         │ fork        │ online  │ 0       │ 0%       │
└─────┴────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

O status deve ser **online**.

#### **Teste 2: Verificar logs**

```bash
pm2 logs server --lines 20
```

**Resultado esperado:**
```
Backend rodando em http://localhost:4000
Ambiente: production
Frontend servido de: /home/u903737197/domains/fresiaflores.com.br/frontend/dist
```

#### **Teste 3: Testar a API**

```bash
curl http://localhost:4000/api/v1/health
```

**Resultado esperado:**
```json
{"status":"ok","ts":1780165599680}
```

#### **Teste 4: Testar o site no navegador**

Acesse: https://fresiaflores.com.br

**Resultado esperado:**
- Página inicial do Frésia Flores carrega
- Logo e menu aparecem
- Produtos são listados (se houver no banco)

---

## 🐛 Troubleshooting

### **Problema 1: "Cannot find module '@/prisma/client'"**

**Causa:** Backend não foi compilado

**Solução:**
```bash
cd ~/domains/fresiaflores.com.br
npm run build:backend
pm2 restart all
```

### **Problema 2: "ECONNREFUSED" ou "Connection refused"**

**Causa:** Banco de dados não está acessível

**Solução:**
1. Verifique se a `DATABASE_URL` está correta
2. Verifique se o IP do servidor está liberado no firewall do MySQL
3. Teste a conexão:
   ```bash
   mysql -h srv1894.hstgr.io -u u903737197_fresia_next -p u903737197_fresia_next
   ```

### **Problema 3: Site retorna erro 502 Bad Gateway**

**Causa:** Aplicação Node.js não está rodando

**Solução:**
```bash
cd ~/domains/fresiaflores.com.br
pm2 restart all
pm2 logs server --lines 50
```

Verifique nos logs se há erros de inicialização.

### **Problema 4: CORS errors no console do navegador**

**Causa:** Variável `NODE_ENV` não está definida como `production`

**Solução:**
1. Verifique se `NODE_ENV=production` está nas variáveis de ambiente
2. Reinicie a aplicação após a alteração

### **Problema 5: Frontend carrega mas API não responde**

**Causa:** Backend não está rodando ou variáveis de ambiente incorretas

**Solução:**
```bash
pm2 list
pm2 logs server --lines 50
```

Verifique se o status é **online** e se não há erros nos logs.

---

## 📞 Informações de Contato

Se precisar de suporte adicional:

- **Documentação do projeto:** `DEPLOY.md` (na raiz do projeto)
- **Logs da aplicação:** `pm2 logs server`
- **Diretório do projeto:** `/home/u903737197/domains/fresiaflores.com.br`

---

## ✅ Checklist Final

Antes de considerar o deploy concluído, verifique:

- [ ] Backend compilado (`npm run build:backend`)
- [ ] Variáveis de ambiente configuradas (6 variáveis)
- [ ] Aplicação reiniciada (`pm2 restart all`)
- [ ] Processo rodando (`pm2 list` mostra status **online**)
- [ ] API respondendo (`curl http://localhost:4000/api/v1/health`)
- [ ] Site acessível (https://fresiaflores.com.br)
- [ ] Login funciona (tente logar com uma conta de teste)
- [ ] Produtos carregam (verifique a página inicial)

---

**Última atualização:** 30/05/2026 15:35
**Versão do deploy:** fresia-deploy-20260530_153408.zip
