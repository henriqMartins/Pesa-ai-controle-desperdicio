# Setup do ambiente — passo a passo

> Veja também a [arquitetura](arquitetura.md) e o [modelo de dados](modelo-dados.md).
> Para publicar em produção, siga a [infraestrutura](infraestrutura.md).

## Pré-requisitos

1. **Node.js 22 LTS ou superior** — a mesma versão do CI
   (`.github/workflows/ci.yml`). Baixe em nodejs.org.
   Confirme: `node -v` e `npm -v`.
2. **Git** instalado. Confirme: `git --version`.
3. Conta no **GitHub**, no **Supabase** (supabase.com) e na **Vercel**
   (vercel.com) — todas com plano gratuito.

## Instalar dependências do projeto

O projeto já foi inicializado com Vite + React 19 + TypeScript. Para preparar o
ambiente, basta:

```bash
npm install
```

As dependências principais já estão no `package.json`:

```bash
# (referência — já instaladas)
npm install @supabase/supabase-js xlsx jspdf react-router-dom
npm install -D tailwindcss@^3 postcss autoprefixer vite-plugin-pwa
```

> **Aviso sobre o `xlsx` (SheetJS):** a versão publicada no npm tem um alerta de
> segurança (prototype pollution / ReDoS) sem correção no registro. Para este
> projeto — geração de planilhas no navegador, ambiente confiável — o risco é
> baixo. Na etapa de relatórios, avalie instalar a versão oficial pelo CDN da
> SheetJS, conforme a documentação deles.

## Configurar o Supabase (nuvem, sem Docker)

> **Use um projeto de homologação (hml) para desenvolver**, separado do projeto da
> loja. É gratuito e evita que um teste apague dados reais. A Vercel (produção)
> aponta para o projeto da loja; seu `.env.local`, para o hml.

1. Crie um projeto novo no painel do Supabase.
2. Vá em **SQL Editor** e rode, **nesta ordem**:

   | # | Script | O que faz |
   |---|---|---|
   | 1 | [`supabase/schema.sql`](../supabase/schema.sql) | `alimentos`, `funcionarios`, `motivos`, `registros`, índice e Realtime |
   | 2 | [`supabase/criar_tabelas_pratos.sql`](../supabase/criar_tabelas_pratos.sql) | `pratos`, `prato_ingredientes` e a RPC `salvar_prato` |
   | 3 | [`supabase/seed.sql`](../supabase/seed.sql) | *(opcional)* dados de exemplo |
   | 4 | [`supabase/migrate_v2_rls_auth.sql`](../supabase/migrate_v2_rls_auth.sql) | **fecha o banco**: RLS por papel, revoga o `anon` |

   > O passo 4 é obrigatório e vem **por último**: os scripts 1 e 2 deixam o RLS
   > aberto para o role `anon` (herança do sistema original sem login). Detalhes
   > em [modelo-dados.md](modelo-dados.md#rls-e-permissões).

3. Crie as **duas contas de acesso** em **Authentication → Users → Add user**:

   | Email (nunca é digitado pelo usuário) | Senha | `app_metadata` |
   |---|---|---|
   | `gestor@petiscaria.local` | PIN de 6 dígitos | `{"papel":"gestor"}` |
   | `funcionario@petiscaria.local` | PIN de 6 dígitos | `{"papel":"funcionario"}` |

   O papel **precisa** estar em `app_metadata` (não em `user_metadata`): é de lá
   que o front (`papelDaSessao`) e o RLS (`auth_papel()`) leem, e é o único que o
   próprio usuário logado não consegue editar. Se o painel não permitir editar o
   `app_metadata`, use os `update auth.users ...` da Parte 3 de
   [`reset_prod_entrega.sql`](../supabase/reset_prod_entrega.sql) como referência.

4. Em **Project Settings → API**, copie a **Project URL** e a **anon key**.

## Variáveis de ambiente

Copie o `.env.example` para `.env.local` na raiz e preencha:

```
VITE_SUPABASE_URL=...sua project url...
VITE_SUPABASE_ANON_KEY=...sua anon key...
```

O `.env.local` já está no `.gitignore` — **não** versione esse arquivo. O
cliente em `src/lib/supabase.ts` lê essas variáveis e falha com mensagem clara
se estiverem ausentes. **Nunca** coloque a `service_role key` aqui.

## Rodar localmente

```bash
npm run dev     # http://localhost:3000 (VITE_PORT muda a porta)
```

Antes de commitar, rode a mesma sequência do CI:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Deploy e manutenção

- **Deploy:** conectar o repositório do GitHub à Vercel. A cada `push`, ela
  publica sozinha. Configure as variáveis de ambiente no painel da Vercel.
  Passo a passo em [infraestrutura.md](infraestrutura.md).
- **Dispositivo na petiscaria:** abrir o site no tablet e "instalar" como app
  (graças ao PWA). Deixar fixo no Monitor.
- **Backup:** há um workflow semanal que exporta as tabelas como artefato
  (`.github/workflows/backup-dados.yml`); o botão "Exportar Excel" do Monitor
  serve como backup prático adicional.
- **Keep-alive:** projetos Supabase gratuitos pausam após 7 dias sem atividade —
  o workflow `keep-supabase-alive.yml` faz o ping a cada 2 dias.
- **Quem cuida:** definir desde já quem mantém o sistema caso o desenvolvedor
  não esteja disponível.

## Custos

| Item | Custo |
|---|---|
| Supabase (free) | R$ 0 |
| Vercel (hobby) | R$ 0 |
| GitHub | R$ 0 |
| Domínio próprio (opcional) | ~R$ 40/ano |

Nesse volume de dados, o projeto roda no gratuito por anos. O custo real é o
tempo de desenvolvimento.
