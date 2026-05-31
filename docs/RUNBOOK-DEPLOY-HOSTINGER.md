# Runbook de Deploy — Frésia Flores no Hostinger Web Apps

> Documento de referência para **subir o site sem repetir os erros já resolvidos**.
> Última validação: **2026-05-31** — `https://fresiaflores.com.br` no ar e funcional.

---

## 1. Arquitetura em produção

| Camada | Detalhe |
|--------|---------|
| Plataforma | Hostinger **"Web Apps"** (CloudLinux + CageFS). NÃO é o Node/Passenger antigo. |
| Pipeline | A cada deploy a plataforma roda `npm ci` → `npm run build` → `npm start`. |
| Porta | Injetada pela plataforma em `process.env.PORT`. **NUNCA defina `PORT` manualmente.** |
| App | Node.js 20, Express 5. O Express serve **a API** (`/api/v1/...`) **e** o frontend React (estático). |
| Entry file | `server.js` **ou** `dist-start.js` (ambos vão no pacote; o hPanel aponta para um deles). |
| Diretório raiz | `fresia-hostinger` (configurado no app; o ZIP precisa ter essa pasta como wrapper). |
| Banco | MySQL 8 via **TCP `127.0.0.1:3306`** (mysql2, JS puro). |
| Auth | JWT em cookie httpOnly. |

### Domínios
- Produção: **fresiaflores.com.br**
- Teste/staging: **grey-gull-800563.hostingersite.com**

### Banco de produção (2026-05-31)
- Database: `u903737197_servidor`
- Usuário: `u903737197_root`
- Senha: **alfanumérica, sem caracteres especiais** (ver §5). Valor real fica
  no hPanel / gerenciador de senhas — **não versionar segredos neste arquivo**.

---

## 2. Erros já enfrentados e a causa raiz (LEIA antes de mexer)

| Sintoma | Causa raiz | Solução definitiva |
|---------|-----------|--------------------|
| **HTTP 403** na raiz | App não iniciava (entry file não encontrado / pasta wrapper errada / build falhava) | ZIP com wrapper `fresia-hostinger/`; `package.json` enxuto + `package-lock.json` compatível; entry `server.js`/`dist-start.js` na raiz do wrapper |
| **403 + runtime log vazio** | `npm ci` falhava (lockfile incompatível com package.json) ou crash no boot | Lockfile gerado a partir do MESMO package.json enxuto; build pré-compilado em `dist/` |
| Crash no boot, log vazio | Import de `@prisma/client/runtime/library` (Decimal) em 3 services | Substituído por `Number()`; Prisma removido do runtime |
| `express.static('public')` não servia assets | Caminho relativo ao CWD (o Web Apps não garante CWD) | `path.join(__dirname, '../public')` (absoluto) |
| **Access denied @'127.0.0.1' / @'::1'** | `db.ts` forçava **socket Unix**, inacessível no CageFS (`/tmp/mysql.sock` é symlink quebrado; `/var/lib/mysql` é root-only). Caía em TCP/host errado. | `db.ts` conecta **só por TCP** em `127.0.0.1:3306`. Hostinger confirmou: TCP localhost é o caminho oficial. |
| Senha truncada na URL | `#`/`@`/`:` na senha quebram o parser de `DATABASE_URL` (o `#` vira fragmento) | Senha do MySQL **só letras e números** (ex: `Senha2025abc`) |
| `Table '...User' doesn't exist` | Banco novo vazio (faltou popular) | Migrar tabelas+dados (mysqldump/import ou phpMyAdmin) |
| MySQL no Linux diferencia maiúsculas | Tabelas são PascalCase (`User`, `Product`) | O shim `prisma/client.ts` já usa os nomes corretos — não usar minúsculas em SQL cru |
| SSH "Connection closed" repetido | **fail2ban** bane o IP após tentativas seguidas | Espaçar conexões; não repetir em loop. Usar phpMyAdmin como alternativa. |

---

## 3. Variáveis de ambiente (hPanel → Web App → Variáveis)

```
NODE_ENV=production
DATABASE_URL=mysql://u903737197_root:<SENHA_DB>@127.0.0.1:3306/u903737197_servidor
JWT_SECRET=<hex longo, fixo entre deploys>
```
> `<SENHA_DB>` = senha alfanumérica do usuário MySQL (valor real no hPanel, não aqui).

Opcionais (quando ativar recursos):
```
CORS_ORIGIN=<domínio extra, se precisar>
MP_ACCESS_TOKEN=<token Mercado Pago>   # SDK é lazy; sem ele o app sobe normal
```

**Regras de ouro:**
- ❌ **NUNCA** definir `PORT` (a plataforma injeta).
- ❌ **NUNCA** usar `MYSQL_SOCKET_PATH` (socket não funciona no CageFS).
- ✅ Host do banco sempre `127.0.0.1` (não `localhost` → evita IPv6 `::1`).
- ✅ Senha do MySQL **sem** `# @ : / ?` (quebram a URL).

---

## 4. Montar o pacote de deploy

O pacote é um ZIP com a pasta wrapper `fresia-hostinger/` contendo:

```
fresia-hostinger/
├── dist/              # backend compilado (npx tsc)
├── public/            # frontend buildado (index.html, assets/, .htaccess) + logo
├── server.js          # = dist-start.js (entry alternativo)
├── dist-start.js      # registra tsconfig-paths e carrega dist/server.js
├── package.json       # ENXUTO: só deps de runtime; scripts build:"echo ok", start:"node dist-start.js"
└── package-lock.json  # gerado a partir do package.json enxuto (compatível com npm ci)
```

**Não incluir** `node_modules/` (a plataforma instala via `npm ci`).

### Passos
```bash
# 1. Compilar backend
cd backend && npx tsc

# 2. Buildar frontend
cd ../frontend && npm run build   # gera frontend/dist → copiar para public/ do pacote

# 3. Reaproveitar um pacote bom como base (ex: fresia-hostinger-TCP-2026-05-31.zip),
#    trocar dist/ e public/ pelos recém-gerados, e re-zipar mantendo o wrapper:
cd /tmp/fbuild
rm -rf fresia-hostinger/dist && cp -R <repo>/backend/dist fresia-hostinger/dist
zip -qr <deploy-packages>/fresia-hostinger-<DATA>.zip fresia-hostinger -x "*.DS_Store"
```

> O `package.json` enxuto e o `package-lock.json` compatível são o segredo para o `npm ci`
> não falhar. Não use o `package.json` completo do backend (tem prisma/typescript/postinstall).

---

## 5. Deploy via API da Hostinger (sem reiniciar o Claude Code)

O MCP `hostinger-api-mcp` pode rodar por stdio com o token, sem precisar reconectar no Claude:

```bash
# Token: hPanel → perfil → API (https://hpanel.hostinger.com/profile/api)
export HOSTINGER_API_TOKEN="<token>"

# Driver JSON-RPC stdio (script /tmp/mcpcall.mjs — ver §8)
cd /tmp/package   # pasta do pacote npm hostinger-api-mcp (npm pack + npm install)

# Listar deploys / ver config (root_directory, entry_file, app_type)
node /tmp/mcpcall.mjs hosting_listJsDeployments '{"domain":"fresiaflores.com.br"}'

# Deployar
node /tmp/mcpcall.mjs hosting_deployJsApplication \
  '{"domain":"fresiaflores.com.br","archivePath":"/caminho/fresia-hostinger-<DATA>.zip"}'

# Ver logs de um build (uuid vem do deploy/list)
node /tmp/mcpcall.mjs hosting_showJsDeploymentLogs \
  '{"domain":"fresiaflores.com.br","deploymentUuid":"<uuid>"}'
```

Estado do build: `pending` → `completed` (ou `failed`). Polle `hosting_listJsDeployments`.

> Alternativa: reconectar o MCP no Claude Code com
> `claude mcp add hostinger --env HOSTINGER_API_TOKEN=<token> -- npx -y hostinger-api-mcp@latest`
> e reiniciar — aí as ferramentas `hosting_*` ficam nativas.

---

## 6. Banco de dados

### Popular um banco novo (vazio)
**Opção A — phpMyAdmin (sem terminal, recomendado):**
1. hPanel → Bancos de Dados → phpMyAdmin do banco de origem.
2. Selecionar banco origem → **Exportar** → Personalizado → SQL →
   ✅ `CREATE TABLE`, ✅ **Desativar verificação de chaves estrangeiras**,
   ❌ **não** marcar "Adicionar CREATE DATABASE / USE".
3. Selecionar banco destino → **Importar** → escolher o `.sql` → Executar.
4. Conferir: 24 tabelas (`User`, `Product`, `Order`, ...).

**Opção B — SSH (mysqldump):** mesmo servidor, ambos os bancos locais.
```bash
ssh -p <PORTA_SSH> <usuario>@<IP_SERVIDOR>   # dados de acesso no hPanel → SSH
mysqldump -h 127.0.0.1 -u <user_origem> -p --no-tablespaces --single-transaction <db_origem> > /tmp/dump.sql
mysql -h 127.0.0.1 -u u903737197_root -p u903737197_servidor < /tmp/dump.sql   # -p pede a senha
rm /tmp/dump.sql
```
> ⚠️ fail2ban: não reconecte em loop. Se "Connection closed" na hora, espere ~15-30 min.

### Admin / seed
- Admin de produção: `constantino.dev.br@gmail.com` / `<SENHA_ADMIN>` (tabela `User`, `isAdmin=1`, `passwordHash` bcrypt).
- Seed local: `npm run seed` (em `backend/`, com `DATABASE_URL` apontando para o banco).

---

## 7. Verificação end-to-end (smoke test)

```bash
D=https://fresiaflores.com.br
curl -s -o /dev/null -w "health=%{http_code}\n" $D/api/v1/health
curl -s -o /dev/null -w "home=%{http_code}\n"   $D/
curl -s -o /dev/null -w "produtos=%{http_code}\n" $D/api/v1/products
# Login (deve retornar JSON do usuário + cookie token):
curl -s -c /tmp/ck.txt -X POST $D/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"email":"constantino.dev.br@gmail.com","password":"<SENHA_ADMIN>"}'
# Rota admin com cookie:
curl -s -o /dev/null -w "admin/stats=%{http_code}\n" -b /tmp/ck.txt $D/api/v1/admin/stats
```
Esperado: todos `200`; login retorna `{"id":...,"isAdmin":1}` e grava cookie `token`.

---

## 8. Script auxiliar `/tmp/mcpcall.mjs` (driver MCP stdio)

Chama uma ferramenta do hostinger-api-mcp por JSON-RPC e imprime o resultado.
Recriar se necessário:

```js
import { spawn } from 'node:child_process'
const TOKEN = process.env.HOSTINGER_API_TOKEN
const toolName = process.argv[2], toolArgs = JSON.parse(process.argv[3] || '{}')
const child = spawn('node', ['/tmp/package/src/servers/hosting.js'],
  { env: { ...process.env, HOSTINGER_API_TOKEN: TOKEN }, stdio: ['pipe','pipe','inherit'] })
let buf='', id=1; const pending=new Map()
const send=(m,p)=>{const i=id++;child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:i,method:m,params:p})+'\n');return new Promise(r=>pending.set(i,r))}
child.stdout.on('data',d=>{buf+=d;let j;while((j=buf.indexOf('\n'))>=0){const l=buf.slice(0,j).trim();buf=buf.slice(j+1);if(!l)continue;try{const m=JSON.parse(l);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}}catch{}}})
;(async()=>{
  await send('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'cli',version:'1.0'}})
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized',params:{}})+'\n')
  const r=await send('tools/call',{name:toolName,arguments:toolArgs})
  console.log('=== RESULT ===');console.log(JSON.stringify(r.result??r.error,null,2));child.kill();process.exit(0)
})().catch(e=>{console.error(e);child.kill();process.exit(1)})
```
Setup: `cd /tmp && npm pack hostinger-api-mcp@latest && tar xzf hostinger-api-mcp-*.tgz && cd package && npm install`.

---

## 9. Checklist rápido para o próximo deploy (com mais recursos)

- [ ] `cd backend && npx tsc` sem erros
- [ ] `cd frontend && npm run build` sem erros
- [ ] Pacote ZIP com wrapper `fresia-hostinger/`, `package.json` enxuto + lock compatível, **sem** node_modules
- [ ] Env vars conferidas: `NODE_ENV`, `DATABASE_URL` (TCP 127.0.0.1, senha sem `#`), `JWT_SECRET`; **sem** `PORT` nem `MYSQL_SOCKET_PATH`
- [ ] Se houver migração de schema (tabelas novas): aplicar no banco de produção via phpMyAdmin/SSH **antes** ou junto do deploy
- [ ] Deploy via `hosting_deployJsApplication`; aguardar `completed`
- [ ] Smoke test do §7 todo `200`
- [ ] Novos endpoints/recursos testados com cookie de admin
```
