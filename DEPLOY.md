# 🚀 Deploy Guide - Frésia Flores

## 📋 Pré-requisitos

- Node.js 22+ instalado no servidor
- MySQL 8.0+ configurado
- Acesso ao hPanel do Hostinger
- Domínio `fresiaflores.com.br` apontando para o servidor

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```bash
# Ambiente
NODE_ENV=production
PORT=4000

# Banco de Dados (MySQL Hostinger)
DATABASE_URL=mysql://u903737197_fresia_next:SENHA_AQUI@srv1894.hstgr.io:3306/u903737197_fresia_next

# Autenticação
JWT_SECRET=sua_chave_secreta_super_segura_aqui

# Mercado Pago
MP_ACCESS_TOKEN=APP_USR-seu_token_aqui
MP_PUBLIC_KEY=APP_USR-sua_chave_publica_aqui

# Frontend (será usado pelo Vite durante o build)
VITE_API_URL=https://fresiaflores.com.br/api/v1
VITE_MP_PUBLIC_KEY=APP_USR-sua_chave_publica_aqui
```

## 📦 Deploy Local (Teste)

1. **Instalar dependências:**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..
   ```

2. **Build do projeto:**
   ```bash
   npm run build
   ```

3. **Iniciar em modo produção:**
   ```bash
   NODE_ENV=production npm start
   ```

4. **Testar:**
   - Frontend: http://localhost:4000
   - API: http://localhost:4000/api/v1/health

## 🌐 Deploy no Hostinger

### Opção 1: Deploy Manual via hPanel

1. **Gerar ZIP de deploy:**
   ```bash
   ./scripts/create-deploy-zip.sh
   ```

2. **Upload via hPanel:**
   - Acesse: hPanel → Arquivos → Gerenciador de Arquivos
   - Navegue até: `/home/u903737197/domains/fresiaflores.com.br/`
   - Faça upload do arquivo `fresia-deploy-YYYYMMDD_HHMMSS.zip`
   - Extraia o ZIP

3. **Configurar variáveis de ambiente:**
   - Acesse: hPanel → Avançado → Node.js
   - Configure as variáveis listadas acima

4. **Instalar dependências e build:**
   ```bash
   cd /home/u903737197/domains/fresiaflores.com.br/
   npm install
   npm run build
   ```

5. **Iniciar aplicação:**
   ```bash
   NODE_ENV=production npm start
   ```

### Opção 2: Deploy via MCP (Automático)

Use o MCP do Hostinger para fazer deploy automático:

```typescript
// 1. Fazer upload do ZIP
hostinger_hosting_deployJsApplication({
  domain: "fresiaflores.com.br",
  archivePath: "/caminho/para/fresia-deploy-YYYYMMDD_HHMMSS.zip",
  options: {
    app_type: "node",
    node_version: 22,
    build_script: "build",
    entry_file: "backend/dist/server.js"
  }
})

// 2. Monitorar progresso
hostinger_hosting_listJsDeployments({
  domain: "fresiaflores.com.br",
  page: 1,
  perPage: 5
})

// 3. Ver logs se falhar
hostinger_hosting_showJsDeploymentLogs({
  domain: "fresiaflores.com.br",
  buildUuid: "uuid-do-deploy"
})
```

## 🔒 Configurar SSL/HTTPS

1. Acesse: hPanel → Segurança → SSL
2. Instale o certificado Let's Encrypt (gratuito)
3. Force HTTPS via `.htaccess` (já configurado)

## 🧪 Testes Pós-Deploy

- [ ] Frontend carrega em https://fresiaflores.com.br
- [ ] SSL/HTTPS funcionando (cadeado verde)
- [ ] API responde em /api/v1/health
- [ ] Login funciona
- [ ] Produtos carregam do banco
- [ ] Carrinho funciona
- [ ] Checkout funciona
- [ ] Admin panel acessível
- [ ] Sem erros no console do navegador
- [ ] Sem erros nos logs do servidor

## 🐛 Troubleshooting

### Erro: Cannot find module '@/prisma/client'
**Solução:** Execute `npm run build` no diretório `backend/`

### Erro: PathError com Express 5
**Solução:** Use `/*splat` ao invés de `*` nas rotas wildcard

### Frontend não carrega em produção
**Solução:** Verifique se `NODE_ENV=production` está configurado

### CORS errors
**Solução:** Verifique se o domínio está na lista de origens permitidas no `server.ts`

### Banco de dados não conecta
**Solução:** Verifique a `DATABASE_URL` e se o IP do servidor está liberado no firewall do MySQL

## 📊 Monitoramento

### Logs da aplicação
```bash
# Ver logs em tempo real
tail -f logs/combined.log

# Ver erros
tail -f logs/error.log
```

### Status do servidor
```bash
# Verificar se o processo está rodando
ps aux | grep node

# Verificar porta 4000
lsof -i :4000
```

## 🔄 Atualizações

Para atualizar a aplicação em produção:

1. Faça as alterações no código
2. Gere novo ZIP: `./scripts/create-deploy-zip.sh`
3. Faça upload e extraia no servidor
4. Execute: `npm install && npm run build`
5. Reinicie a aplicação

## 📞 Suporte

- Documentação Hostinger: https://developers.hostinger.com/
- Logs de deploy: hPanel → Avançado → Node.js → Logs
- Suporte Hostinger: Chat 24/7 no hPanel
