# Plano de Infraestrutura — Deploy e Produção

> Este documento cobre tudo que precisa ser feito para colocar o sistema em
> produção na petiscaria. Siga as etapas **nesta ordem**.

---

## Pré-requisitos

Antes de começar, confirme que você tem:

- [ ] Conta no **GitHub** (repositório já criado: `henriqMartins/Pesa-ai-controle-desperdicio`)
- [ ] Conta no **Supabase** (supabase.com) — plano gratuito. **Dois projetos:** um
      de produção (loja) e um de homologação (hml)
- [ ] Conta na **Vercel** (vercel.com) — plano Hobby (gratuito)
- [ ] Projeto Supabase com as **seis** tabelas criadas e o RLS por papel aplicado
      (ver 1.1)
- [ ] Node.js 22 LTS+ instalado localmente (mesma versão do CI, para testes
      locais antes do deploy)

---

## Etapa 1 — Configurar o Supabase

### 1.1 Rodar os scripts do banco (se ainda não foi feito)

1. Acesse o painel do seu projeto Supabase
2. Vá em **SQL Editor → New query**
3. Rode, **nesta ordem**, colando cada arquivo e clicando **Run**:
   1. `supabase/schema.sql` — `alimentos`, `funcionarios`, `motivos`, `registros`
   2. `supabase/criar_tabelas_pratos.sql` — `pratos`, `prato_ingredientes`, RPC `salvar_prato`
   3. `supabase/seed.sql` — *(opcional)* dados de exemplo
   4. `supabase/migrate_v2_rls_auth.sql` — **fecha o banco** (RLS por papel)
4. Verifique em **Table Editor** que as seis tabelas existem

> ⚠️ O passo 4 é obrigatório e vem por último: os scripts 1 e 2 criam políticas
> **abertas** para o role `anon` (herança do sistema original sem login), e a
> migração de RLS é o que revoga esse acesso. Nunca re-rode 1 ou 2 num banco já
> fechado sem rodar 4 em seguida.

### 1.1.1 Criar as contas de acesso (login por PIN)

Em **Authentication → Users → Add user**, crie duas contas com o PIN de 6 dígitos
como senha e o papel em **`app_metadata`** (não `user_metadata`):

| Email (ninguém digita — está embutido no código) | `app_metadata` |
|---|---|
| `gestor@petiscaria.local` | `{"papel":"gestor"}` |
| `funcionario@petiscaria.local` | `{"papel":"funcionario"}` |

Sem o `papel` em `app_metadata`, o RLS nega tudo que exige gestor e a aba Pratos
não aparece. Para gravar/corrigir por SQL, use a Parte 3 de
`supabase/reset_prod_entrega.sql` como referência.

### 1.2 Habilitar Realtime para a tabela `registros`

O Painel usa Realtime para atualizar ao vivo. Sem isso, ele não atualiza
automaticamente.

No **SQL Editor**, rode:

```sql
alter publication supabase_realtime add table registros;
```

> **Confirmar:** Vá em **Database → Replication** e veja se `registros` aparece
> na lista de tabelas publicadas.

### 1.3 Popular com dados iniciais

A forma recomendada é rodar [`supabase/seed.sql`](../supabase/seed.sql) no SQL
Editor — ele já popula alimentos, funcionários, motivos e alguns registros de
exemplo no schema atual. Você também pode cadastrar tudo pelas telas **Produtos**,
**Equipe** e **Motivos** depois do deploy.

> **Atenção ao schema atual:** o preço fica em `preco_por_unidade` (com a coluna
> `unidade` = `kg`/`L`/`un`), e **não** no antigo `valor_por_kg`. Exemplo mínimo:
>
> ```sql
> insert into alimentos (nome, categoria, preco_por_unidade, unidade) values
>   ('Frango', 'Proteína', 22.00, 'kg'),
>   ('Camarão', 'Frutos do mar', 65.00, 'kg'),
>   ('Refrigerante', 'Bebidas', 8.00, 'L');
>
> insert into funcionarios (nome, papel) values
>   ('Maria', 'gestor'), ('João', 'funcionario');
> ```

### 1.4 Copiar as credenciais

Em **Project Settings → API**:
- Copie a **Project URL** → vai para `VITE_SUPABASE_URL`
- Copie a **anon public** key → vai para `VITE_SUPABASE_ANON_KEY`

> Nunca use a `service_role` key no front-end.

---

## Etapa 2 — Deploy na Vercel

### 2.1 Conectar o repositório

1. Acesse vercel.com e clique em **Add New → Project**
2. Selecione **Import Git Repository**
3. Autorize o acesso ao GitHub e selecione `Pesa-ai-controle-desperdicio`
4. Deixe as configurações padrão:
   - **Framework Preset:** Vite (detectado automaticamente)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### 2.2 Configurar variáveis de ambiente

Ainda na tela de import (antes de clicar em Deploy), em **Environment Variables**:

| Nome | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://xxxxxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_...` |

> **Importante:** As variáveis que começam com `VITE_` são expostas no bundle
> do front-end — isso é esperado e seguro para a `anon key`. Nunca adicione
> chaves secretas aqui.

### 2.3 Fazer o deploy

Clique em **Deploy**. A Vercel vai:
1. Clonar o repositório
2. Rodar `npm install`
3. Rodar `npm run build`
4. Publicar a pasta `dist`

O processo leva ~1 minuto. Você receberá uma URL como
`https://pesa-ai-controle-desperdicio.vercel.app`.

### 2.4 Configurar deploy automático

Após o primeiro deploy, a Vercel detecta automaticamente pushes no branch
`main` e redesploya. Nenhuma configuração adicional é necessária.

Para testar: faça qualquer mudança no código, comite e faça push para `main`.
A Vercel publicará a nova versão em ~1 minuto.

> **Confirme que produção aponta para o Supabase da loja**, não para o hml —
> é o erro mais fácil de cometer e o mais caro.

### 2.5 O que o `vercel.json` faz

O arquivo [`vercel.json`](../vercel.json) já vai no repositório e cuida de duas
coisas na borda:

- **SPA fallback:** `rewrites` devolve `index.html` em qualquer caminho. Sem
  isso, recarregar `/pratos` ou `/monitor` daria 404 (o roteamento é do
  react-router, no cliente).
- **Headers de segurança:** `Content-Security-Policy` restritiva
  (`script-src 'self'`, `connect-src` só para `*.supabase.co`),
  `Strict-Transport-Security`, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy` e `Permissions-Policy`
  (câmera/microfone/geolocalização negados).

> A CSP é o motivo de o script de tema (`public/theme-init.js`) e o registro do
> service worker serem **arquivos externos** e não inline. Ao mexer em qualquer
> um dos dois, confira o console por violação de CSP no ambiente publicado.

---

## Etapa 3 — Instalar como PWA no tablet

O app foi configurado como PWA (Progressive Web App), o que permite instalá-lo
no tablet como se fosse um aplicativo nativo.

### No Android (Chrome)
1. Abra o Chrome no tablet
2. Acesse a URL da Vercel
3. Toque no menu (três pontos) → **Adicionar à tela inicial**
4. Confirme o nome sugerido — **"Aquino"** (`short_name` do manifest; o nome
   completo é "Monitor de Desperdício — Petiscaria Aquino") — e toque em **Adicionar**

### No iPad/iPhone (Safari)
1. Abra o Safari
2. Acesse a URL da Vercel
3. Toque no ícone de compartilhar (quadrado com seta)
4. Selecione **Adicionar à Tela de Início**
5. Confirme e toque em **Adicionar**

Após instalar, o app abre em tela cheia (sem barra de endereços), parecendo um
app nativo. Deixe o tablet sempre na tela de **Registro** para uso rápido.

---

## Etapa 4 — (Opcional) Domínio personalizado

Se a dona quiser um endereço mais fácil de lembrar (ex.: `pesaai.com.br`):

1. Registre o domínio em um registrador brasileiro (ex.: Registro.br ~R$ 40/ano)
2. No painel da Vercel, vá em **Project Settings → Domains**
3. Adicione o domínio e siga as instruções de DNS (adicionar um registro `CNAME`
   apontando para `cname.vercel-dns.com`)
4. A Vercel provisiona o certificado SSL automaticamente (HTTPS)

---

## Etapa 5 — Manutenção contínua

### Atualizar o sistema
```bash
# Faça as mudanças no código localmente
npm run dev          # teste local
npm run lint && npm run typecheck && npm test && npm run build   # mesma sequência do CI
git add <arquivos>
git commit -m "descrição"
git push origin main  # CI roda e a Vercel faz o deploy automaticamente
```

O portão de qualidade está descrito em [ci.md](ci.md).

### Automações (GitHub Actions)

| Workflow | Agenda | O que faz | Secrets |
|---|---|---|---|
| [`ci.yml`](../.github/workflows/ci.yml) | push na `main` + todo PR | lint → typecheck → testes → build | nenhum |
| [`backup-dados.yml`](../.github/workflows/backup-dados.yml) | domingos 06:00 UTC (~03:00 SP) + manual | exporta as 6 tabelas via REST (paginado) e publica um artefato com 90 dias de retenção | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| [`keep-supabase-alive.yml`](../.github/workflows/keep-supabase-alive.yml) | a cada 2 dias, 09:00 UTC + manual | consulta leve na REST API para o projeto free não pausar | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

Configure os secrets em **Settings → Secrets and variables → Actions**, apontando
para o projeto de **produção**.

> **Por que `service_role` nos dois últimos:** com o RLS por papel, a `anon key`
> recebe 401 e tanto o backup quanto o ping falhariam. A `service_role` ignora o
> RLS e é segura aqui — roda no servidor do GitHub Actions, nunca no frontend.
> Ela ainda precisa dos `GRANT` de tabela (`migrate_v2_rls_auth.sql` os concede);
> sem eles o erro é `42501 permission denied`.

### Backup dos dados
Três camadas, da mais automática para a mais manual:

1. **Workflow semanal** (acima) — baixe o artefato em **Actions → Backup dos
   dados → run → Artifacts**. É o backup de referência antes de qualquer
   operação destrutiva no banco.
2. **Botão "Exportar Excel"** no Monitor — backup prático do mês, na mão da dona.
3. **Supabase → Table Editor → Export** — cópia pontual de uma tabela. O plano
   gratuito também mantém backup diário por 7 dias.

> Recomendação: exportar uma planilha mensalmente e guardar fora do Supabase.

### Preparar produção para a entrega

[`supabase/reset_prod_entrega.sql`](../supabase/reset_prod_entrega.sql) deixa o
banco no estado de "primeiro dia": zera lançamentos/produtos/equipe/pratos,
recria os 5 motivos padrão, grava o `papel` em `app_metadata`, redefine os PINs e
**derruba as sessões abertas** (senão um tablet esquecido logado continuaria
dentro com o PIN antigo).

É **destrutivo e irreversível**. Antes de rodar: gere e **baixe** o backup pelo
workflow, confirme que o projeto selecionado no SQL Editor é o de produção, troque
os dois PINs no script e descomente a trava `set app.confirmo = 'SIM';`.

### Monitorar uso (Supabase free tier)
O plano gratuito suporta:
- 500 MB de banco de dados
- 5 GB de transferência/mês
- 50.000 usuários ativos/mês

Para uma petiscaria com 5 funcionários e ~100 registros/dia, o projeto roda
no gratuito **por anos** sem atingir nenhum limite.

### Pausar o projeto Supabase
Projetos Supabase gratuitos pausam automaticamente após **7 dias sem atividade**.
Isso já está resolvido pelo workflow `keep-supabase-alive.yml`, que faz um `ping`
na REST API a cada 2 dias. Se o workflow falhar (secret expirado, projeto
renomeado), o alerta aparece na aba **Actions** — vale conferir de vez em quando.

---

## Resumo de custos

| Item | Custo |
|---|---|
| Supabase (free) | R$ 0 |
| Vercel (hobby) | R$ 0 |
| GitHub | R$ 0 |
| Domínio `.com.br` (opcional) | ~R$ 40/ano |
| **Total** | **R$ 0 – R$ 40/ano** |
