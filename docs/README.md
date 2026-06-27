# Pesa Aí — Documentação técnica

PWA de controle de desperdício para petiscaria. Funcionários registram a
quantidade descartada; a dona acompanha o custo em tempo real e exporta relatórios.

Este é o **índice da documentação**. Cada documento tem um único propósito —
comece pelo que precisa.

## Índice

**Produto**
- [produto.md](produto.md) — o que o sistema faz, para quem e por quê; escopo e backlog.

**Técnico** (como é construído)
- [arquitetura.md](arquitetura.md) — stack, decisões técnicas e o Supabase como backend.
- [modelo-dados.md](modelo-dados.md) — tabelas, colunas, RLS e consultas.
- Este arquivo (abaixo) — estrutura de pastas, camadas do código e fluxo de dados.

**Operação** (rodar e publicar)
- [setup.md](setup.md) — preparar o ambiente local.
- [infraestrutura.md](infraestrutura.md) — Supabase, deploy na Vercel e PWA no tablet.

**Qualidade**
- [testes.md](testes.md) — estratégia de testes e **como rodar os testes automatizados**.
- [plano-testes.md](plano-testes.md) — checklist de testes manuais e de aceite.

**Planos de evolução**
- [registro-correcao.md](registro-correcao.md) — explicação + plano para corrigir/excluir um registro.

**Outros**
- [atualizacoes.md](atualizacoes.md) — changelog (redesign, motivos, teclado, tema).
- [historico/](historico/) — documentos **congelados**: planejamento e design original.

---

## Estrutura de pastas

```
.
├── supabase/
│   ├── schema.sql            # banco completo (tabelas, RLS, grants, Realtime)
│   ├── migrate_v1_to_v2.sql  # migração do schema antigo + tabela motivos
│   ├── seed.sql              # dados de exemplo
│   └── reset_e_recriar.sql   # apaga tabelas (dev)
├── src/
│   ├── lib/
│   │   ├── supabase.ts     # cliente único do Supabase (singleton)
│   │   ├── unidades.ts     # conversão e exibição de unidades (kg/L/un)
│   │   └── exportar.ts     # geração de Excel e PDF
│   ├── types/
│   │   ├── alimento.ts     # tipos de Alimento
│   │   ├── funcionario.ts  # tipos de Funcionário e papel
│   │   ├── motivo.ts       # tipos de Motivo
│   │   ├── registro.ts     # tipos de Registro e RegistroCompleto
│   │   └── index.ts        # re-exporta tudo
│   ├── hooks/
│   │   ├── useAlimentos.ts         # CRUD de alimentos + estado
│   │   ├── useFuncionarios.ts      # CRUD de funcionários + estado
│   │   ├── useMotivos.ts           # CRUD de motivos + estado
│   │   ├── useFuncionarioAtual.ts  # funcionário selecionado (localStorage)
│   │   ├── useRegistros.ts         # últimos N registros + inserir + Realtime
│   │   ├── useMonitor.ts           # KPIs e rankings do dashboard + Realtime
│   │   ├── useIsMobile.ts          # breakpoint de viewport
│   │   └── useTheme.ts             # tema claro/escuro (localStorage)
│   ├── components/
│   │   ├── RegistrarModal.tsx  # modal de registro (desktop) / bottom-sheet (mobile)
│   │   └── TecladoNumerico.tsx # teclado numérico na paleta do tema
│   ├── pages/
│   │   ├── Monitor.tsx       # dashboard ao vivo
│   │   ├── Produtos.tsx      # grade de cards + modal novo/editar
│   │   ├── Equipe.tsx        # lista + modal de funcionários
│   │   └── Motivos.tsx       # lista + cadastro de motivos
│   ├── App.tsx               # navegação, layout, modal, tema
│   ├── index.css             # tokens de tema (dark + light) e componentes base
│   └── main.tsx              # ponto de entrada React
├── .env.local                # credenciais locais (não vai para o git)
└── vite.config.ts            # Vite + PWA
```

---

## Camadas do código

### Camada 1 — Banco de dados (`supabase/schema.sql`)

O banco vive no Supabase Cloud (PostgreSQL). Quatro tabelas cobrem tudo:

| Tabela | Papel |
|---|---|
| `alimentos` | Itens com preço por unidade base (kg/L/un) |
| `funcionarios` | Quem usa o sistema |
| `motivos` | Catálogo de motivos editável (chips do registro) |
| `registros` | Cada evento de desperdício (append-only) |

**Coluna gerada:** `registros.custo` é calculada pelo próprio banco:
```sql
custo = round(quantidade * preco_unitario_no_momento, 2)
```
O front nunca envia `custo` — o banco sempre calcula.

**Snapshot de preço:** `preco_unitario_no_momento` congela o preço no instante do
registro, para relatórios antigos não serem recalculados com o preço de hoje.

**Unidades:** `quantidade` é gravada na unidade base do alimento;
`unidade_registro` guarda como foi digitado (g, kg, mL, L, un) para reexibir.

**RLS + grants:** RLS **ativo** nas quatro tabelas com policy permissiva para
`anon`, e `GRANT` explícito por tabela — ambos necessários para acesso e Realtime.

**Realtime:** a publicação `supabase_realtime` inclui `registros` — é o que mantém
o Monitor ao vivo. Veja [modelo de dados](modelo-dados.md) para o detalhe das colunas.

---

### Camada 2 — Cliente Supabase (`src/lib/supabase.ts`)

Cria **um único cliente** para toda a aplicação, lendo `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY`. Se faltarem, o app falha com mensagem clara. A URL é só
o domínio base (`https://xxx.supabase.co`).

> A `service_role key` **nunca** vai ao front — ela ignora o RLS. Só a `anon key`
> (protegida pelo RLS) é usada no cliente.

---

### Camada 3 — Tipos TypeScript (`src/types/`)

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
```

Os tipos `Novo*` (ex.: `NovoAlimento`) omitem campos gerados pelo banco (`id`,
`criado_em`, `custo`), evitando que sejam enviados por engano.

---

### Camada 4 — Libs utilitárias (`src/lib/`)

**`unidades.ts`** — Dicionário de conversão de unidades:
- `converterParaBase(qtd, unidadeEntrada, unidadeBase)` → quantidade na base
- `exibirQuantidade(qtdBase, unidadeRegistro, unidadeBase)` → string para exibir

**`exportar.ts`** — Gera arquivos no navegador:
- `exportarExcel()` → workbook com 3 abas (Registros, Top Alimentos, Ranking)
- `exportarPDF()` → documento com cabeçalho, tabelas e lista

Recebem os dados já carregados pelo hook — não fazem query.

---

### Camada 5 — Hooks (`src/hooks/`)

**`useAlimentos(apenasAtivos)` / `useFuncionarios(apenasAtivos)` / `useMotivos(apenasAtivos)`**
- Carregam a lista no mount; expõem `adicionar()` e `atualizar()`
- `apenasAtivos` controla se itens desativados aparecem

**`useFuncionarioAtual()`** — persiste o funcionário selecionado no `localStorage`.

**`useRegistros(limite)`** — últimos N registros com JOIN + Realtime; expõe
`inserir(novo)` (usado pelo modal de registro).

**`useMonitor()`** — carrega os registros do mês e agrega **em memória**: totais
do dia/mês, média por dia, projeção, últimos lançamentos, top alimentos, top
motivos e ranking de funcionários. Recalcula ao vivo via Realtime.

**`useIsMobile(breakpoint)`** — reage ao tamanho da viewport (modal × bottom-sheet).

**`useTheme()`** — lê/grava o tema em `data-theme` + `localStorage`.

> **Por que agregar no cliente?** Com alguns milhares de registros por mês,
> somar/ordenar em JavaScript é instantâneo e economiza round-trips.

---

### Camada 6 — Componentes e páginas

**Componentes (`src/components/`)**
- `RegistrarModal` — entrada rápida (desktop) ou bottom-sheet em 3 passos (mobile):
  funcionário → alimento → quantidade (teclado) + unidade + motivo → confirmar.
  Calcula o custo em tempo real; permite salvar um motivo novo na hora.
- `TecladoNumerico` — teclado próprio na paleta do tema, sem o teclado do SO.

**Páginas (`src/pages/`)** — consomem hooks; nenhuma faz query direta.
- `Monitor` — 3 KPIs + 3 painéis (barras), ao vivo; export Excel/PDF.
- `Produtos` — grade de cards; modal de novo/editar com unidade, preço e toggle ativo.
- `Equipe` — lista com avatar/papel/status; modal de novo/editar.
- `Motivos` — lista com ativar/desativar; formulário de cadastro.

---

### Camada 7 — Navegação, layout e tema (`src/App.tsx`, `src/index.css`)

```
/           → redireciona para /monitor
/monitor    → Monitor.tsx
/produtos   → Produtos.tsx
/equipe     → Equipe.tsx
/motivos    → Motivos.tsx
*           → redireciona para /monitor
```

"Registrar" não é rota: é um **modal** aberto pelo botão `＋ Registrar` (desktop)
ou pelo **FAB** (mobile). O `Layout` traz a top bar (com relógio AO VIVO e botão
de tema) no desktop e top bar enxuta + **bottom-nav** + FAB no mobile.

**Tema:** `src/index.css` define tokens em `:root[data-theme='dark']` (padrão) e
`:root[data-theme='light']`. Componentes usam `var(--…)`. O tema é aplicado no
`<html>`, persistido em `localStorage` e inicializado sem flash por um script
inline em `index.html`.

---

## Como os dados fluem

```
Pessoa toca "Confirmar" no RegistrarModal
        │
        ▼
  useRegistros → supabase.from('registros').insert()
        │
        ▼
  Supabase (RLS) → PostgreSQL executa INSERT
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
npm run dev                 # desenvolvimento (porta 5173)
npm run build               # typecheck + build de produção
```

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite, porta 5173) |
| `npm run build` | Typecheck + build otimizado para produção |
| `npm run preview` | Serve o build localmente para testar |
| `npm run typecheck` | Verifica tipos sem gerar build |
| `npm run lint` | ESLint |
| `npm test` | Roda os testes automatizados uma vez (Vitest) |
| `npm run test:watch` | Testes em modo observação (re-roda ao salvar) |
| `npm run test:coverage` | Testes + relatório de cobertura |

> Detalhes da estratégia de testes em [testes.md](testes.md).

---

## Estado atual

Implementação funcional completa (redesign + motivos + teclado + tema). Pendente
a infraestrutura:

- [ ] Rodar `schema.sql` (ou `migrate_v1_to_v2.sql`) + `seed.sql` no Supabase
- [ ] Deploy na Vercel com as variáveis de ambiente
- [ ] Instalar como PWA no tablet do estabelecimento
- [ ] Rodar o [plano de testes manual](plano-testes.md) com a cliente

Backlog técnico mapeado: [correção de registro](registro-correcao.md).
