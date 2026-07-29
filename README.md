# Pesa Aí — Monitor de Desperdício

PWA de controle de desperdício de alimentos para a **Petiscaria Aquino**.
A equipe registra o que foi descartado em segundos, no tablet do balcão; a dona
acompanha o custo **em tempo real** e exporta relatórios em Excel/PDF.

Substitui o controle em papel. Roda inteiramente em serviços gratuitos
(Supabase + Vercel + GitHub Actions), sem servidor próprio.

```
Funcionário toca "＋"  →  alimento + quantidade + motivo  →  Confirmar
                                                              │
                       Postgres calcula o custo (coluna gerada)
                                                              │
                       WebSocket (Realtime) → Monitor atualiza sem F5
```

---

## Sumário

- [O que o sistema entrega](#o-que-o-sistema-entrega)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Modelo de dados](#modelo-de-dados)
- [Segurança](#segurança)
- [Rodando localmente](#rodando-localmente)
- [Scripts](#scripts)
- [Qualidade: testes e CI](#qualidade-testes-e-ci)
- [Deploy e operação](#deploy-e-operação)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Documentação](#documentação)
- [Roadmap / dívida conhecida](#roadmap--dívida-conhecida)

---

## O que o sistema entrega

### Registro de desperdício
- **Modal único** (não é rota): entrada rápida em card no desktop/tablet;
  **bottom-sheet em 3 passos** no celular (quem → o quê → quanto/motivo → confirmar).
- **Teclado numérico próprio** (`TecladoNumerico`), na paleta do tema — evita o
  teclado do SO e o zoom automático no tablet.
- **Unidades por alimento:** cada produto tem uma unidade base (`kg`, `L`, `un`) e
  aceita entrada em `g`/`kg`, `mL`/`L` ou `un`. A conversão é centralizada em
  [`src/lib/unidades.ts`](src/lib/unidades.ts).
- **Custo ao vivo** antes de confirmar, e **custo definitivo calculado pelo banco**
  (coluna gerada) — o front nunca envia `custo`.
- **Snapshot de preço:** o preço é congelado no instante do registro, então
  relatórios antigos não são recalculados com o preço de hoje.
- **Motivos como chips** reutilizáveis + campo livre com botão “＋ salvar”, que
  cadastra o motivo novo na hora.
- **Correção de lançamento:** editar (reaproveitando o mesmo modal) ou excluir
  com confirmação, direto do Monitor. Na edição, trocar o alimento adota o preço
  atual do novo alimento; mudar só a quantidade preserva o snapshot original.

### Monitor (dashboard ao vivo)
- **3 KPIs:** desperdício do dia, do mês e média por dia com **projeção** do mês.
- **3 painéis com barras:** últimos lançamentos, mais desperdiçados e principais
  motivos — cada um com **mini-filtro de período** (Hoje / Ontem / Mês / Total /
  data específica).
- **Realtime:** qualquer INSERT/UPDATE/DELETE em `registros`, de qualquer
  aparelho ou aba, recalcula os números sem recarregar a página.
- **Estado de erro com retry** — falha de carga não mostra “R$ 0,00” disfarçado
  de “sem desperdício”.
- **Fuso fixo de São Paulo:** “hoje” e “este mês” não dependem do relógio do
  tablet ([`src/lib/fuso.ts`](src/lib/fuso.ts), sem dependências, resistente a
  horário de verão).

### Filtros avançados
Modal dedicado ([`FiltrosModal`](src/components/FiltrosModal.tsx)) com três modos
de análise — **mais registrados**, **maior valor** e **por produto** — sobre
períodos que ultrapassam o mês corrente (7d / 30d / mês / total / intervalo
personalizado). Lógica pura e testada em [`src/lib/filtros.ts`](src/lib/filtros.ts).

### Modo de exibição (TV/balcão)
Tela cheia real (Fullscreen API) com KPIs gigantes em `clamp()`, relógio
“AO VIVO” com segundos e rankings — atualizando ao vivo. No celular tenta
**travar em paisagem** e sugere girar o aparelho quando o navegador recusa.

### Cadastros
| Tela | O que faz | Quem pode |
|---|---|---|
| **Produtos** | Grade de cards + busca; modal de novo/editar com unidade base, preço e toggle ativo | funcionário e gestor |
| **Motivos** | Cadastrar, editar e ativar/desativar os chips do registro | funcionário e gestor |
| **Equipe** | Lista com avatar, papel e status; modal de novo/editar | **só gestor** escreve |
| **Pratos** | Ficha técnica e precificação de pratos prontos | **só gestor** (aba oculta para funcionário) |

**Exclusão protegida por histórico:** tentar apagar um produto ou funcionário que
já tem lançamentos é bloqueado (FK `23503`) com a orientação de **desativar** —
os relatórios antigos continuam corretos.

### Pratos (ficha técnica / precificação)
Módulo do gestor para calcular o custo de pratos compostos:
ingredientes de texto livre com preço digitado (`fixo`/`kg`/`g`/`L`/`mL`/`un`),
custo de **embalagem**, **margem (markup)** e **cálculo de perda** opcional
(peso bruto ÷ peso líquido, com alerta acima de 15%). Devolve custo total, preço
sugerido, markup e margem de venda. Cálculo puro e testado em
[`src/lib/calculoPrato.ts`](src/lib/calculoPrato.ts); o salvamento é **atômico**
via função RPC `salvar_prato(payload jsonb)` (upsert do prato + substituição dos
ingredientes numa transação).

### Relatórios
- **Excel** (SheetJS): 3 abas — Registros, Top Alimentos, Ranking de funcionários.
- **PDF** (jsPDF): cabeçalho com totais, tabelas e lista de registros com
  paginação automática.
- Datas/horas sempre formatadas no fuso de São Paulo; nome do arquivo contém o
  mês/ano.

### Acesso e sessão
- **Login por PIN de 6 dígitos**, com escolha de perfil **Funcionário** ou
  **Gestor**. Por baixo é Supabase Auth real (`signInWithPassword` com email
  “fantasma” embutido e o PIN como senha) — o app herda rate limiting,
  expiração e refresh de token nativos.
- **Lockout** após 5 tentativas erradas (1 min), persistido em `localStorage`
  para que recarregar a página não zere o contador.
- **Bloquear tela** sem derrubar a sessão: overlay com PIN, validado no servidor
  por um **cliente Supabase isolado** (não disputa o lock de auth do cliente
  principal). Sobrevive a reload.
- **Papel lido do JWT** (`app_metadata.papel`, que só a `service_role` escreve) —
  nunca de `user_metadata`, que o próprio usuário poderia editar para se promover.

### PWA e experiência de aparelho
- Instalável (manifest completo, ícones 192/512 + maskable + apple-touch-icon,
  splash e theme color da marca), gerados por [`scripts/gerar-icones.mjs`](scripts/gerar-icones.mjs).
- Service worker com `registerType: 'autoUpdate'` e registro por **arquivo
  externo**, para conviver com a CSP `script-src 'self'`.
- **Tema claro/escuro** tokenizado, persistido e aplicado antes do primeiro paint
  (`public/theme-init.js`) — sem flash.
- Zoom travado, `viewport-fit=cover`, respeito a **safe-areas** (notch/barra de
  gestos) e troca de shell em `lg` (1024px): top bar no desktop/tablet paisagem,
  top bar enxuta + bottom-nav + FAB abaixo disso.
- **ErrorBoundary** global: erro de render mostra tela amigável com “Recarregar”,
  não tela branca.

---

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Linguagem | TypeScript | ~6.0 |
| UI | React | 19.2 |
| Build / dev server | Vite | 8 |
| Estilo | Tailwind CSS + tokens CSS próprios | 3.4 |
| Roteamento | react-router-dom | 7 |
| Backend / banco | Supabase (Postgres + REST + Auth + Realtime) | nuvem |
| Cliente do banco | @supabase/supabase-js | 2 |
| PWA | vite-plugin-pwa (Workbox) | 1.3 |
| Relatórios | SheetJS (`xlsx`) + jsPDF | — |
| Testes | Vitest + Testing Library + jsdom | 4 |
| Lint | ESLint 10 (flat config) + typescript-eslint | — |
| Hospedagem | Vercel (Hobby) | — |
| Automação | GitHub Actions | — |

**Sem back-end próprio por decisão:** o Supabase entrega banco, API, auth e
tempo real; escrever um servidor seria mais código para manter sem ganho neste
cenário (um local, equipe de 1–5 pessoas). Detalhes em
[docs/arquitetura.md](docs/arquitetura.md).

---

## Arquitetura

```
┌─────────────────────────── Navegador (PWA) ───────────────────────────┐
│  ErrorBoundary → ProtectedRoute → Layout → Routes                     │
│      │              │                                                  │
│      │              ├─ sem sessão → TelaPin (teclado de PIN)           │
│      │              └─ bloqueado  → LockOverlay (PIN, sessão viva)     │
│                                                                        │
│  pages/         Monitor · Produtos · Equipe · Motivos · Pratos          │
│  components/    RegistrarModal · FiltrosModal · ModoExibicao · teclados │
│  hooks/         dados (CRUD + Realtime) e UI (tema, viewport, lock)     │
│  lib/           supabase · auth · unidades · fuso · filtros ·           │
│                 calculoPrato · mapPrato · exportar                     │
│  types/         espelho do schema do banco                             │
└────────────────────────────────┬───────────────────────────────────────┘
                    REST + WebSocket (anon key + JWT da sessão)
┌────────────────────────────────▼───────────────────────────────────────┐
│  Supabase: Postgres + RLS por papel + Auth (PIN) + Realtime            │
└────────────────────────────────────────────────────────────────────────┘
```

**Regras que a estrutura respeita:**

- **Páginas não consultam o banco.** Toda I/O vive em `hooks/`; as páginas
  recebem dados e handlers.
- **Cliente Supabase único** (`src/lib/supabase.ts`) — mais um, isolado e sem
  persistência, existe apenas para conferir o PIN no desbloqueio.
- **Lógica de números é função pura e testada:** `agregar()` (KPIs do Monitor),
  `filtros.ts`, `unidades.ts`, `calculoPrato.ts`, `exportar.ts`. É o que permite
  testar os cálculos sem simular o Supabase.
- **Agregação no cliente:** o Monitor carrega os registros do mês (limite 5000) e
  soma/ordena em memória. Nesse volume é instantâneo e economiza round-trips.
- **Nenhuma cor fixa em componente:** todo estilo referencia tokens
  (`var(--…)`) definidos em `src/index.css` para os temas claro e escuro.
- **Datas sempre pelo `lib/fuso`**, nunca pelo relógio local do aparelho.

### Rotas

| Rota | Tela | Observação |
|---|---|---|
| `/` | → `/monitor` | redirect |
| `/monitor` | Monitor | dashboard ao vivo |
| `/produtos` | Produtos | CRUD de alimentos |
| `/equipe` | Equipe | escrita só para gestor |
| `/motivos` | Motivos | CRUD de motivos |
| `/pratos` | Pratos | **só gestor**; funcionário cai em `/monitor` |
| `*` | → `/monitor` | fallback |

“Registrar” **não é rota** — é modal, aberto pelo botão `＋ Registrar`
(desktop) ou pelo FAB (celular). A Vercel devolve `index.html` em qualquer rota
(`vercel.json` → `rewrites`), então recarregar `/pratos` funciona.

---

## Modelo de dados

Seis tabelas. Totais e rankings são **consultas/agregações** — não têm tabela
própria. DDL completo e comentado em [docs/modelo-dados.md](docs/modelo-dados.md).

| Tabela | Papel |
|---|---|
| `alimentos` | itens com preço por unidade base (`kg`/`L`/`un`) |
| `funcionarios` | nomes da equipe + papel, para atribuir o lançamento |
| `motivos` | catálogo editável (chips do registro) |
| `registros` | cada evento de desperdício |
| `pratos` | cabeçalho da ficha técnica (embalagem, margem, perda) |
| `prato_ingredientes` | linhas da ficha (FK `on delete cascade`) |

Pontos de projeto que importam:

- `registros.custo` é **coluna gerada**: `round(quantidade * preco_unitario_no_momento, 2)`.
- `registros.quantidade` é gravada **na unidade base** do alimento;
  `unidade_registro` guarda como foi digitado, só para reexibir fielmente.
- O registro guarda o **texto** do motivo (não FK) — desativar ou renomear um
  motivo não reescreve o histórico.
- `registros.criado_em` é indexado; só `registros` entra na publicação
  `supabase_realtime`.

---

## Segurança

O modelo é o do [plano de segurança](docs/plano-seguranca.md), já implementado:

1. **A `anon key` é pública por design** (vai no bundle, prefixo `VITE_`). Logo,
   proteção feita só no React é contornável — quem abre o DevTools chama a API
   direto.
2. **Por isso a autorização real está no Postgres:** RLS exige sessão
   `authenticated` e decide por papel lido do JWT
   ([`migrate_v2_rls_auth.sql`](supabase/migrate_v2_rls_auth.sql)). O acesso do
   role `anon` às tabelas foi **revogado** — a `anon key` só serve para o `/auth`.

| Tabela | Funcionário | Gestor |
|---|---|---|
| `registros`, `motivos`, `alimentos` | tudo | tudo |
| `funcionarios` | só leitura | tudo |
| `pratos`, `prato_ingredientes` | — | tudo |

3. **`app_metadata.papel`** é a fonte do papel, no front (`papelDaSessao`) e no
   banco (`auth_papel()`). `user_metadata` seria editável pelo próprio usuário.
4. **Camada de conveniência sobre a base real:** lockout de PIN e bloqueio de tela.
5. **Headers na borda** (`vercel.json`): CSP restritiva (`script-src 'self'`,
   `connect-src` só para o Supabase), HSTS, `X-Frame-Options: DENY`, `nosniff`,
   `Referrer-Policy`, `Permissions-Policy`.
6. **`service_role key` nunca no front** — só como secret do GitHub Actions
   (backup e keep-alive), onde precisa ignorar o RLS.

Verificação decisiva (deve responder `401 permission denied`, não os dados):

```bash
curl "$VITE_SUPABASE_URL/rest/v1/registros?select=*" -H "apikey: $VITE_SUPABASE_ANON_KEY"
```

---

## Rodando localmente

**Pré-requisitos:** Node.js 22 LTS+ (mesma versão do CI), Git e um projeto
Supabase.

```bash
git clone https://github.com/henriqMartins/Pesa-ai-controle-desperdicio.git
cd Pesa-ai-controle-desperdicio
npm install
cp .env.example .env.local     # preencha URL e anon key do Supabase
npm run dev                    # http://localhost:3000 (VITE_PORT muda a porta)
```

`.env.local`:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

Se faltarem, `src/lib/supabase.ts` falha cedo com mensagem clara.
**Nunca** coloque a `service_role key` aqui.

**Banco do zero**, no SQL Editor do Supabase, nesta ordem:

```
1. supabase/schema.sql                # alimentos, funcionarios, motivos, registros + Realtime
2. supabase/criar_tabelas_pratos.sql  # pratos, prato_ingredientes + RPC salvar_prato
3. supabase/seed.sql                  # (opcional) dados de exemplo
4. supabase/migrate_v2_rls_auth.sql   # FECHA o banco: RLS por papel — sempre por último
```

Depois, crie as duas contas em **Authentication → Users** com PIN de 6 dígitos
como senha e o papel em `app_metadata`:
`gestor@petiscaria.local` → `{"papel":"gestor"}` e
`funcionario@petiscaria.local` → `{"papel":"funcionario"}`.
Passo a passo em [docs/setup.md](docs/setup.md).

---

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Vite em modo desenvolvimento (porta 3000 por padrão) |
| `npm run build` | `tsc -b` + build de produção em `dist/` |
| `npm run preview` | serve o build para conferir antes de publicar |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm test` | Vitest, execução única |
| `npm run test:watch` | Vitest observando os arquivos |
| `npm run test:coverage` | Vitest + relatório de cobertura |

Mesma sequência do CI, localmente:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

---

## Qualidade: testes e CI

**16 arquivos de teste, 89 testes** (`npm test`). A estratégia é deliberada:
automatizar **onde o erro é invisível e caro** e deixar o resto num checklist
manual.

| Área coberta | Arquivos |
|---|---|
| Conversão de unidades | `lib/unidades.test.ts` |
| Agregação dos KPIs | `hooks/useMonitor.test.ts` |
| Filtros e períodos | `lib/filtros.test.ts` |
| Cálculo de pratos | `lib/calculoPrato.test.ts`, `lib/mapPrato.test.ts` |
| Exportação Excel/PDF | `lib/exportar.test.ts` |
| Auth por PIN e lockout | `lib/auth.test.ts`, `hooks/useLockout.test.ts` |
| Componentes-chave | `TelaPin`, `LockOverlay`, `ProtectedRoute`, `RegistrarModal`, `FiltrosModal`, `ErrorBoundary`, `Produtos`, `Equipe` |

Não é automatizado de propósito: a coluna gerada `custo` (roda no Postgres, não
em JS), o Realtime (WebSocket), a instalação do PWA e a inspeção visual —
tudo em [docs/plano-testes.md](docs/plano-testes.md) e
[docs/teste-aceitacao.md](docs/teste-aceitacao.md).

**GitHub Actions:**

| Workflow | Quando | O que faz |
|---|---|---|
| [`ci.yml`](.github/workflows/ci.yml) | push na `main` e todo PR | lint → typecheck → testes → build |
| [`backup-dados.yml`](.github/workflows/backup-dados.yml) | domingos 06:00 UTC + manual | exporta as 6 tabelas via REST e publica artefato (90 dias) |
| [`keep-supabase-alive.yml`](.github/workflows/keep-supabase-alive.yml) | a cada 2 dias + manual | ping na REST API para o projeto free não pausar |

Os dois últimos usam os secrets `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` —
necessária porque, com o RLS por papel, a `anon key` não lê mais as tabelas.
O CI **não precisa de secrets**: os testes usam variáveis fake (`vite.config.ts`
→ `test.env`) e o build só empacota.

---

## Deploy e operação

- **Vercel**, conectada ao GitHub: cada push na `main` publica em ~1 min.
  `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` são configuradas no painel.
- `vercel.json` cuida do SPA fallback (`rewrites`) e dos headers de segurança.
- **Ambientes:** o `.env.local` aponta para o projeto de **homologação**; a
  Vercel aponta para o da **loja**. Migração de banco sempre em HML primeiro.
- **Instalação no aparelho:** Android/Chrome → “Adicionar à tela inicial”;
  iPad/Safari → Compartilhar → “Adicionar à Tela de Início”.
- **Entrega/reset de produção:** [`reset_prod_entrega.sql`](supabase/reset_prod_entrega.sql)
  zera os dados de teste, recria os 5 motivos padrão, grava o papel em
  `app_metadata`, redefine os PINs e derruba as sessões abertas. É destrutivo e
  tem trava explícita (`set app.confirmo = 'SIM'`).

Detalhes em [docs/infraestrutura.md](docs/infraestrutura.md).

---

## Estrutura do repositório

```
.
├─ .github/workflows/       ci · backup-dados · keep-supabase-alive
├─ docs/                    documentação técnica (índice em docs/README.md)
├─ public/                  ícones do PWA, theme-init.js (anti-flash)
├─ scripts/gerar-icones.mjs gera os PNGs do PWA a partir dos SVGs
├─ src/
│  ├─ components/           modais, teclados, telas de PIN/lock, ErrorBoundary
│  │  └─ pratos/            ficha técnica (lista, ficha, linha, resultado)
│  ├─ hooks/                dados (Supabase + Realtime) e UI
│  ├─ lib/                  supabase · auth · unidades · fuso · filtros ·
│  │                        calculoPrato · mapPrato · exportar · numero
│  ├─ pages/                Monitor · Produtos · Equipe · Motivos · Pratos
│  ├─ types/                espelho do schema do banco
│  ├─ App.tsx               shell, navegação, modais globais, toast
│  └─ index.css             tokens dos dois temas + primitivas (.panel, .field…)
├─ supabase/                schema e migrações SQL (ver docs/modelo-dados.md)
├─ vercel.json              SPA fallback + CSP e headers de segurança
└─ vite.config.ts           Vite + PWA + config do Vitest
```

Os testes ficam **ao lado** do código que testam (`*.test.ts[x]`) e são
excluídos do build (`tsconfig.app.json`).

---

## Documentação

Índice completo em **[docs/README.md](docs/README.md)**. Atalhos:

| Quero… | Leia |
|---|---|
| entender o produto e o escopo | [produto.md](docs/produto.md) |
| entender as decisões técnicas | [arquitetura.md](docs/arquitetura.md) |
| ver tabelas, RLS e consultas | [modelo-dados.md](docs/modelo-dados.md) |
| preparar o ambiente | [setup.md](docs/setup.md) |
| publicar e operar | [infraestrutura.md](docs/infraestrutura.md) |
| entender o modelo de segurança | [plano-seguranca.md](docs/plano-seguranca.md) |
| rodar/escrever testes | [testes.md](docs/testes.md) · [plano-testes.md](docs/plano-testes.md) · [teste-aceitacao.md](docs/teste-aceitacao.md) |
| ensinar a equipe a usar | [guia-uso.md](docs/guia-uso.md) |
| ver o histórico de mudanças | [atualizacoes.md](docs/atualizacoes.md) |

---

## Roadmap / dívida conhecida

- **Bundle único de ~1,23 MB (374 KB gzip):** `xlsx` e `jspdf` entram no chunk
  principal mesmo para quem nunca exporta. Candidato natural a `import()`
  dinâmico nos botões de exportação.
- **Autoria do registro** ainda vem do funcionário escolhido na lista
  (`localStorage`), não do `auth.uid()` da sessão. Amarrar ao usuário logado daria
  trilha de auditoria confiável — decisão pendente, pois hoje duas contas
  (gestor/funcionário) são compartilhadas por várias pessoas.
- **Ranking de funcionários** existe nos relatórios exportados, mas não é exibido
  no Monitor — exposição fica a critério da dona.
- **Soft delete / auditoria** de lançamentos (hoje é hard delete com confirmação).
- **Modo offline** — segurar o registro local e sincronizar quando a rede voltar;
  só se surgir necessidade real.
- **MFA** na conta de gestor e *Leaked Password Protection* (toggles do painel
  Supabase) seguem como polimento da Fase 4.
- **Alerta do `xlsx` (SheetJS)** no npm (prototype pollution / ReDoS): risco
  baixo neste uso (geração local, ambiente confiável); migrar para o pacote do
  CDN oficial da SheetJS é a saída se virar bloqueio.

---

Projeto de uso interno da Petiscaria Aquino, mantido por
[@henriqMartins](https://github.com/henriqMartins).
