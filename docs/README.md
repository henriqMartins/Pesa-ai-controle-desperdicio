# Pesa Aí — Documentação técnica

PWA de controle de desperdício para petiscaria. Funcionários registram a
quantidade descartada; a dona acompanha o custo em tempo real e exporta relatórios.

Este é o **índice da documentação**. Cada documento tem um único propósito —
comece pelo que precisa. Para a visão geral do projeto inteiro (o que entrega,
stack, como rodar), veja o [README da raiz](../README.md).

## Índice

**Produto**
- [produto.md](produto.md) — o que o sistema faz, para quem e por quê; escopo e backlog.
- [guia-uso.md](guia-uso.md) — guia da equipe/da dona, em linguagem simples (imprimível).

**Técnico** (como é construído)
- [arquitetura.md](arquitetura.md) — stack, decisões técnicas e o Supabase como backend.
- [modelo-dados.md](modelo-dados.md) — tabelas, colunas, RLS, scripts SQL e consultas.
- [plano-seguranca.md](plano-seguranca.md) — modelo de autenticação/autorização (PIN + RLS por papel) e o que ficou de fora.
- Este arquivo (abaixo) — estrutura de pastas, camadas do código e fluxo de dados.

**Operação** (rodar e publicar)
- [setup.md](setup.md) — preparar o ambiente local e o banco.
- [infraestrutura.md](infraestrutura.md) — Supabase, deploy na Vercel, automações e PWA no tablet.
- [ci.md](ci.md) — o portão de qualidade que roda a cada push/PR.

**Qualidade**
- [testes.md](testes.md) — estratégia de testes e **como rodar os testes automatizados**.
- [plano-testes.md](plano-testes.md) — checklist de testes manuais por área.
- [teste-aceitacao.md](teste-aceitacao.md) — roteiro ponta a ponta antes de liberar uma versão.

**Módulo de Pratos** (ficha técnica / precificação)
- [plano-tela-pratos-logica.md](plano-tela-pratos-logica.md) — dados, cálculo e persistência (implementado).
- [plano-tela-pratos-visual.md](plano-tela-pratos-visual.md) — layout, tokens e componentes.
- [README-tela-pratos.md](README-tela-pratos.md) — handoff de design original; **§8 é a fonte das fórmulas** de custo. Congelado no resto.

**Planos de evolução**
- [registro-correcao.md](registro-correcao.md) — explicação + implementação da correção/exclusão de registro.

**Outros**
- [atualizacoes.md](atualizacoes.md) — changelog do projeto.
- [historico/](historico/) — documentos **congelados**: planejamento e design original.
- Protótipos hi-fi em HTML, referência visual (abrir no navegador):
  `Monitor de Desperdício.dc.html`, `Wireframes - Monitor de Desperdício.dc.html`,
  `Doc - Modais de Filtro.dc.html`. Descrevem a paleta azul original —
  a paleta real do projeto é a laranja/quente de [`src/index.css`](../src/index.css).

---

## Estrutura de pastas

```
.
├── .github/workflows/
│   ├── ci.yml                    # lint + typecheck + testes + build (push/PR)
│   ├── backup-dados.yml          # backup semanal das 6 tabelas (artefato)
│   └── keep-supabase-alive.yml   # ping p/ o projeto free não pausar
├── supabase/
│   ├── schema.sql                # 4 tabelas base + índice + Realtime (+ RLS antigo, aberto)
│   ├── criar_tabelas_pratos.sql  # pratos + prato_ingredientes + RPC salvar_prato
│   ├── criar_tabela_motivos.sql  # só a tabela motivos (banco antigo)
│   ├── migrate_v1_to_v2.sql      # migração do schema antigo (valor_por_kg/peso_g)
│   ├── migrate_v2_rls_auth.sql   # RLS por papel — FECHA o banco (rodar por último)
│   ├── seed.sql                  # dados de exemplo
│   ├── reset_e_recriar.sql       # apaga as tabelas (dev)
│   └── reset_prod_entrega.sql    # reset de produção p/ entrega (destrutivo, com trava)
├── public/
│   ├── theme-init.js             # aplica o tema antes do paint (anti-flash, CSP-safe)
│   └── icon*.svg, pwa-*.png      # ícones do PWA (gerados por scripts/gerar-icones.mjs)
├── src/
│   ├── lib/
│   │   ├── supabase.ts     # cliente único do Supabase (singleton)
│   │   ├── auth.ts         # login por PIN, papel do JWT, cliente isolado de verificação
│   │   ├── unidades.ts     # conversão e exibição de unidades (kg/L/un)
│   │   ├── fuso.ts         # datas ancoradas em America/Sao_Paulo
│   │   ├── filtros.ts      # lógica pura dos filtros (modal e mini-filtros)
│   │   ├── calculoPrato.ts # custo, perda, markup e preço sugerido de pratos
│   │   ├── mapPrato.ts     # banco ⇄ view-model dos pratos
│   │   ├── numero.ts       # máscara decimal pt-BR
│   │   └── exportar.ts     # geração de Excel e PDF
│   ├── types/              # Alimento, Funcionario, Motivo, Registro, Prato (+ Novo*/payloads)
│   ├── hooks/
│   │   ├── useAlimentos.ts         # CRUD de alimentos + estado
│   │   ├── useFuncionarios.ts      # CRUD de funcionários + estado
│   │   ├── useMotivos.ts           # CRUD de motivos + estado
│   │   ├── usePratos.ts            # CRUD de pratos (salvar via RPC)
│   │   ├── useFuncionarioAtual.ts  # funcionário selecionado (localStorage)
│   │   ├── useRegistros.ts         # últimos N registros + inserir/atualizar + Realtime
│   │   ├── useRegistrosPeriodo.ts  # registros de um intervalo arbitrário, sob demanda
│   │   ├── useMonitor.ts           # KPIs e rankings do dashboard + Realtime
│   │   ├── useSessao.ts            # sessão de Auth reativa
│   │   ├── useEhGestor.ts          # papel da sessão → gating de UI
│   │   ├── useLock.ts              # store de "tela bloqueada"
│   │   ├── useLockout.ts           # bloqueio após N PINs errados
│   │   ├── useIsMobile.ts          # breakpoint de viewport (+ useEhCelular)
│   │   ├── useOrientation.ts       # orientação e trava em paisagem
│   │   └── useTheme.ts             # tema claro/escuro (localStorage)
│   ├── components/
│   │   ├── ProtectedRoute.tsx   # portão: sem sessão → TelaPin; bloqueado → LockOverlay
│   │   ├── TelaPin.tsx          # login por PIN (perfil + teclado)
│   │   ├── LockOverlay.tsx      # tela bloqueada (sessão viva)
│   │   ├── TecladoPin.tsx       # teclado de 6 dígitos
│   │   ├── ErrorBoundary.tsx    # boundary global de erro de render
│   │   ├── RegistrarModal.tsx   # registro/edição (card no desktop, 3 passos no mobile)
│   │   ├── TecladoNumerico.tsx  # teclado numérico na paleta do tema
│   │   ├── FiltrosModal.tsx     # filtros avançados (3 modos × períodos)
│   │   ├── ModoExibicao.tsx     # tela cheia para TV/balcão
│   │   └── pratos/              # ListaPratos, FichaPrato, LinhaIngrediente,
│   │                            # ResultadoPrato, BadgeGestor, tipos, fabricas
│   ├── pages/
│   │   ├── Monitor.tsx       # dashboard ao vivo (KPIs, painéis, export, correção)
│   │   ├── Produtos.tsx      # grade de cards + modal novo/editar
│   │   ├── Equipe.tsx        # lista + modal (escrita só p/ gestor)
│   │   ├── Motivos.tsx       # lista + cadastro/edição de motivos
│   │   └── Pratos.tsx        # container lista ↔ ficha (só gestor)
│   ├── App.tsx               # shell, navegação, modais globais, tema, lock, sair
│   ├── index.css             # tokens de tema (dark + light) e componentes base
│   └── main.tsx              # ponto de entrada React (StrictMode + ErrorBoundary)
├── .env.local                # credenciais locais (não vai para o git)
├── vercel.json               # SPA fallback + CSP e headers de segurança
└── vite.config.ts            # Vite + PWA + configuração do Vitest
```

---

## Camadas do código

### Camada 1 — Banco de dados (`supabase/`)

O banco vive no Supabase Cloud (PostgreSQL). **Seis tabelas** cobrem tudo:

| Tabela | Papel |
|---|---|
| `alimentos` | Itens com preço por unidade base (kg/L/un) |
| `funcionarios` | Quem aparece como autor do lançamento |
| `motivos` | Catálogo de motivos editável (chips do registro) |
| `registros` | Cada evento de desperdício |
| `pratos` | Cabeçalho da ficha técnica (embalagem, margem, perda) |
| `prato_ingredientes` | Linhas da ficha (FK `on delete cascade`) |

**Coluna gerada:** `registros.custo` é calculada pelo próprio banco:
```sql
custo = round(quantidade * preco_unitario_no_momento, 2)
```
O front nunca envia `custo` — o banco sempre calcula.

**Snapshot de preço:** `preco_unitario_no_momento` congela o preço no instante do
registro, para relatórios antigos não serem recalculados com o preço de hoje.

**Unidades:** `quantidade` é gravada na unidade base do alimento;
`unidade_registro` guarda como foi digitado (g, kg, mL, L, un) para reexibir.

**RLS por papel:** RLS **ativo** nas seis tabelas com políticas para o role
`authenticated`, decididas pelo papel lido do JWT (`auth_papel()`). O acesso do
role `anon` foi **revogado** — a `anon key` só serve para o `/auth`. Ver
[modelo-dados.md](modelo-dados.md) e [plano-seguranca.md](plano-seguranca.md).

**Realtime:** a publicação `supabase_realtime` inclui `registros` — é o que mantém
o Monitor ao vivo.

**Salvamento atômico de pratos:** a RPC `salvar_prato(payload jsonb)` faz o upsert
do prato e a substituição completa dos ingredientes numa única transação
(escrita em duas tabelas via REST não seria transacional).

---

### Camada 2 — Cliente Supabase (`src/lib/supabase.ts`)

Cria **um único cliente** para toda a aplicação, lendo `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY`. Se faltarem, o app falha com mensagem clara. A URL é só
o domínio base (`https://xxx.supabase.co`).

Existe **um segundo cliente**, criado sob demanda em `src/lib/auth.ts`, sem
persistência de sessão e com `storageKey` próprio: serve só para conferir o PIN
no desbloqueio, sem disputar o lock interno de auth do cliente principal.

> A `service_role key` **nunca** vai ao front — ela ignora o RLS. Só a `anon key`
> (protegida pelo RLS) é usada no cliente.

---

### Camada 3 — Autenticação e autorização (`src/lib/auth.ts`)

- `entrarComPin(papel, pin)` chama `signInWithPassword` com um email “fantasma”
  embutido (`gestor@petiscaria.local` / `funcionario@petiscaria.local`) e o PIN
  como senha. Quem digita nunca vê o email.
- `verificarPin(papel, pin)` confere o PIN **no servidor** pelo cliente isolado,
  sem tocar na sessão viva (usado pelo `LockOverlay`).
- `papelDaSessao(session)` lê o papel de **`app_metadata`** do JWT — nunca de
  `user_metadata`, que o próprio usuário poderia editar via `auth.updateUser`
  para se promover a gestor.
- `sair()` encerra a sessão; o `onAuthStateChange` leva o `ProtectedRoute` de
  volta à `TelaPin` sem navegação manual.

---

### Camada 4 — Tipos TypeScript (`src/types/`)

```typescript
interface Alimento { id, nome, categoria, preco_por_unidade, unidade, ativo, criado_em }
interface Motivo   { id, texto, ativo, criado_em }
interface Registro { id, alimento_id, funcionario_id, quantidade,
                      unidade_registro, preco_unitario_no_momento, custo, motivo, criado_em }

// SELECT com JOIN (alimentos + funcionários embutidos)
interface RegistroCompleto extends Registro {
  alimentos: { nome: string; unidade: UnidadeBase }
  funcionarios: { nome: string }
}

interface Prato { id, nome, calcular_perda, embalagem, margem_pct, ativo,
                  criado_em, prato_ingredientes? }
```

Os tipos `Novo*` (ex.: `NovoAlimento`) omitem campos gerados pelo banco (`id`,
`criado_em`, `custo`), evitando que sejam enviados por engano. Os pratos têm
ainda os *payloads* da RPC (`PratoPayload`, `IngredientePayload`).

---

### Camada 5 — Libs utilitárias (`src/lib/`)

**`unidades.ts`** — Dicionário de conversão de unidades:
- `converterParaBase(qtd, unidadeEntrada, unidadeBase)` → quantidade na base
- `exibirQuantidade(qtdBase, unidadeRegistro, unidadeBase)` → string para exibir

**`fuso.ts`** — Toda data/hora ancorada em `America/Sao_Paulo`, sem dependências
(usa `Intl.DateTimeFormat` para descobrir o offset em qualquer instante). Se o
tablet estiver com o relógio ou o fuso errado, “hoje” e “este mês” continuam
corretos.

**`filtros.ts`** — Lógica **pura** dos filtros: `fxRange` (período → intervalo),
`noIntervalo`, `topRegistrados`, `topValor`, `porProduto`, `produtosDistintos` e
`filtrarPeriodoPainel` (mini-filtros dos painéis).

**`calculoPrato.ts`** — Custo por ingrediente (com perda), custo total, preço
sugerido, markup e margem de venda. `LIMIAR_PERDA = 15`%.

**`mapPrato.ts`** — Conversão entre o formato do banco (números, snake_case) e o
view-model da UI (campos string com máscara decimal).

**`exportar.ts`** — Gera arquivos no navegador:
- `exportarExcel()` → workbook com 3 abas (Registros, Top Alimentos, Ranking)
- `exportarPDF()` → documento com cabeçalho, tabelas e lista

Recebem os dados já carregados pelo hook — não fazem query.

---

### Camada 6 — Hooks (`src/hooks/`)

**Dados**

- **`useAlimentos(apenasAtivos)` / `useFuncionarios(apenasAtivos)` / `useMotivos(apenasAtivos)`**
  — carregam a lista no mount; expõem `adicionar()`, `atualizar()`, `excluir()` e
  `recarregar()`. Em alimentos e funcionários, o erro `23503` (FK) é traduzido em
  “tem lançamentos vinculados; desative em vez de excluir”.
- **`usePratos()`** — lista os pratos ativos com o join dos ingredientes já
  mapeado para view-model; `salvar()` usa a RPC `salvar_prato`.
- **`useRegistros(limite)`** — últimos N registros com JOIN + Realtime; expõe
  `inserir(novo)` e `atualizar(id, dados)` (usados pelo modal de registro).
- **`useRegistrosPeriodo(range)`** — registros de um intervalo `[a, b)` arbitrário,
  sob demanda (o que os filtros avançados e o período “Total” precisam, já que
  `useMonitor` só carrega o mês). Passar `null` deixa o hook ocioso.
- **`useMonitor()`** — carrega os registros do mês e agrega **em memória** via
  `agregar()`: totais do dia/mês, média por dia, projeção, últimos lançamentos,
  top alimentos, top motivos e ranking de funcionários. Recalcula ao vivo via
  Realtime (`event: '*'`), expõe `erro`, `excluir(id)` e `recarregar()`.

**Sessão e UI**

- **`useSessao()`** — sessão de Auth reativa (`getSession` + `onAuthStateChange`),
  com `carregando` para não piscar a `TelaPin` quando já há sessão salva.
- **`useEhGestor()`** — `papelDaSessao(session) === 'gestor'`. É **gating de UX**,
  não segurança: a restrição real é o RLS.
- **`useLock()`** — store de módulo (`useSyncExternalStore`) para “tela
  bloqueada”, compartilhada entre o botão Bloquear e o `ProtectedRoute`. Persiste
  em `localStorage` e é limpa no `SIGNED_OUT`.
- **`useLockout()`** — 5 tentativas erradas → 1 min de bloqueio, persistido em
  `localStorage` (recarregar não zera o contador).
- **`useFuncionarioAtual()`** — persiste o funcionário selecionado no `localStorage`.
- **`useIsMobile(breakpoint)`** / **`useEhCelular(breakpoint)`** — o primeiro olha
  a largura (modal × bottom-sheet); o segundo o **menor lado** da viewport, para
  decidir trava de orientação sem entrar em loop de rotação.
- **`useOrientation(travarEm?)`** — observa retrato/paisagem e tenta travar
  (só funciona em fullscreen; falha em silêncio quando o navegador recusa).
- **`useTheme()`** — lê/grava o tema em `data-theme` + `localStorage`.

> **Por que agregar no cliente?** Com alguns milhares de registros por mês,
> somar/ordenar em JavaScript é instantâneo e economiza round-trips.

---

### Camada 7 — Componentes e páginas

**Componentes (`src/components/`)**
- `ProtectedRoute` — sem sessão renderiza `TelaPin`; com sessão renderiza o app,
  com `LockOverlay` por cima quando bloqueado (o app segue montado por baixo).
- `TelaPin` / `TecladoPin` / `LockOverlay` — login e bloqueio por PIN de 6 dígitos,
  com lockout e mensagem de erro de altura fixa (sem “pulo” de layout).
- `ErrorBoundary` — captura erro de render e oferece “Recarregar” em vez de tela
  branca (precisa ser classe; não há equivalente em hook).
- `RegistrarModal` — entrada rápida (desktop) ou bottom-sheet em 3 passos
  (mobile): funcionário → alimento → quantidade (teclado) + unidade + motivo →
  confirmar. Calcula o custo em tempo real, permite salvar um motivo novo na hora
  e é **reaproveitado em modo edição** (pré-preenchido, mantendo o snapshot de
  preço quando o alimento não muda).
- `TecladoNumerico` — teclado próprio na paleta do tema, sem o teclado do SO.
- `FiltrosModal` — filtros avançados: 3 modos (mais registrados, maior valor, por
  produto) × períodos (7d, 30d, mês, total, intervalo).
- `ModoExibicao` — tela cheia para TV/balcão, com KPIs em `clamp()`, relógio com
  segundos e trava de orientação no celular.
- `pratos/` — `ListaPratos`, `FichaPrato`, `LinhaIngrediente`, `ResultadoPrato`,
  `BadgeGestor` + `tipos`/`fabricas` do view-model.

**Páginas (`src/pages/`)** — consomem hooks; nenhuma faz query direta.
- `Monitor` — 3 KPIs + 3 painéis (barras) com mini-filtros de período, ao vivo;
  export Excel/PDF; editar/excluir lançamento; estado de erro com retry.
- `Produtos` — grade de cards com busca; modal de novo/editar com unidade, preço
  e toggle ativo.
- `Equipe` — lista com avatar/papel/status; modal de novo/editar **só para gestor**.
- `Motivos` — lista com editar e ativar/desativar; formulário de cadastro.
- `Pratos` — container que alterna lista ↔ ficha técnica (rota só de gestor).

---

### Camada 8 — Navegação, layout e tema (`src/App.tsx`, `src/index.css`)

```
/           → redireciona para /monitor
/monitor    → Monitor.tsx
/produtos   → Produtos.tsx
/equipe     → Equipe.tsx
/motivos    → Motivos.tsx
/pratos     → Pratos.tsx      (só gestor; funcionário cai em /monitor)
*           → redireciona para /monitor
```

"Registrar" não é rota: é um **modal** aberto pelo botão `＋ Registrar` (desktop)
ou pelo **FAB** (mobile). O `Layout` traz, a partir de `lg` (1024px), a top bar
completa (marca, abas, relógio AO VIVO a partir de `xl`, e os botões Exibição /
Tema / Filtrar / Bloquear / Sair / Registrar). Abaixo de 1024px vira top bar
enxuta + **bottom-nav** + FAB, com as ações secundárias num **menu de três
pontos**. As áreas de segurança (notch, barra de gestos) são respeitadas por
utilitários `safe-*`/`pb-nav`.

**Tema:** `src/index.css` define tokens em `:root[data-theme='dark']` (padrão) e
`:root[data-theme='light']`. Componentes usam `var(--…)` — nenhuma cor fixa. O
tema é aplicado no `<html>`, persistido em `localStorage` e inicializado sem flash
por `public/theme-init.js` (arquivo externo, para conviver com a CSP
`script-src 'self'`).

---

## Como os dados fluem

```
Pessoa toca "Confirmar" no RegistrarModal
        │
        ▼
  useRegistros → supabase.from('registros').insert()
        │           (com o JWT da sessão — sem ele o RLS nega)
        ▼
  Supabase (RLS por papel) → PostgreSQL executa INSERT
  banco calcula a coluna `custo` automaticamente
        │
        ├─── resposta HTTP → modal fecha, toast "Registro salvo"
        │
        └─── Realtime broadcast (WebSocket)
                  │
                  ▼
        useMonitor recebe o evento e recarrega
                  │
                  ▼
        Monitor recalcula KPIs e rankings sem F5
```

---

## Como rodar

```bash
npm install                 # dependências
# configurar .env.local com URL e anon key do Supabase (veja .env.example)
npm run dev                 # desenvolvimento (porta 3000 por padrão)
npm run build               # typecheck + build de produção
```

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite, porta 3000; `VITE_PORT` muda) |
| `npm run build` | Typecheck + build otimizado para produção |
| `npm run preview` | Serve o build localmente para testar |
| `npm run typecheck` | Verifica tipos sem gerar build |
| `npm run lint` | ESLint |
| `npm test` | Roda os testes automatizados uma vez (Vitest) |
| `npm run test:watch` | Testes em modo observação (re-roda ao salvar) |
| `npm run test:coverage` | Testes + relatório de cobertura |

> Detalhes da estratégia de testes em [testes.md](testes.md); do banco em
> [setup.md](setup.md).

---

## Estado atual

Em produção, entregue à cliente. Implementado: registro/correção, Monitor ao
vivo com filtros, modo de exibição, relatórios, pratos, tema duplo, PWA
instalável, autenticação por PIN com papéis, RLS por papel, CSP/headers, CI e
backup automatizado.

Dívida conhecida e próximos passos: ver [produto.md](produto.md#próximos-passos-backlog)
e a seção *Roadmap* do [README da raiz](../README.md#roadmap--dívida-conhecida).
