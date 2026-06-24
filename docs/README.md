# Pesa Aí — Documentação técnica

PWA de controle de desperdício para petiscaria. Funcionários registram o peso
descartado; a dona acompanha o custo em tempo real e exporta relatórios.

> Documentos relacionados: [setup](setup.md) · [modelo de dados](modelo-dados.md) · [infraestrutura](infraestrutura.md) · [plano de testes](plano-testes.md)

---

## Visão geral

**Quem usa:** funcionários (registram desperdício) e a dona (painel + configuração).

**O que faz:**
- Cadastro de alimentos com preço por kg e funcionários com papel (funcionário/gestor)
- Registro de desperdício: seleciona funcionário + alimento + peso → custo calculado automaticamente pelo banco
- Painel com filtros por período, top alimentos, ranking de funcionários e atualização em tempo real
- Exportação de relatórios em Excel (3 abas) e PDF

**Decisão de negócio:** sistema aberto, sem login nem PIN. O acesso físico ao
tablet do estabelecimento é o controle suficiente para uma equipe de 1–5 pessoas.

---

## Estrutura de pastas

```
.
├── supabase/
│   └── schema.sql          # definição completa do banco (tabelas, RLS, Realtime)
├── src/
│   ├── lib/
│   │   ├── supabase.ts     # cliente único do Supabase (singleton)
│   │   ├── filtros.ts      # cálculo de períodos de data
│   │   └── exportar.ts     # geração de Excel e PDF
│   ├── types/
│   │   ├── alimento.ts     # tipos de Alimento
│   │   ├── funcionario.ts  # tipos de Funcionário e papel
│   │   ├── registro.ts     # tipos de Registro e RegistroCompleto
│   │   └── index.ts        # re-exporta tudo
│   ├── hooks/
│   │   ├── useAlimentos.ts         # CRUD de alimentos + estado
│   │   ├── useFuncionarios.ts      # CRUD de funcionários + estado
│   │   ├── useFuncionarioAtual.ts  # funcionário selecionado (localStorage)
│   │   ├── useRegistros.ts         # últimos N registros + inserir + Realtime
│   │   ├── useTotais.ts            # totais do dia e do mês
│   │   └── useRegistrosFiltro.ts   # registros por período + agregações + Realtime
│   ├── pages/
│   │   ├── Registro.tsx      # tela principal de lançamento
│   │   ├── Painel.tsx        # dashboard com filtros e export
│   │   └── Configuracao.tsx  # gestão de alimentos e funcionários
│   ├── App.tsx               # roteamento e layout
│   └── main.tsx              # ponto de entrada React
├── .env.local                # credenciais locais (não vai para o git)
└── vite.config.ts            # Vite + PWA
```

---

## Camadas do código

### Camada 1 — Banco de dados (`supabase/schema.sql`)

O banco vive no Supabase Cloud (PostgreSQL). Três tabelas cobrem tudo:

| Tabela | Papel |
|---|---|
| `alimentos` | Cadastro de itens com preço por kg |
| `funcionarios` | Cadastro de quem usa o sistema |
| `registros` | Cada evento de desperdício (imutável, append-only) |

**Coluna gerada:** `registros.custo` é calculada pelo próprio banco:
```sql
custo = round((peso_g / 1000.0) * preco_kg_no_momento, 2)
```
O front nunca envia `custo` — o banco sempre calcula. Isso garante que nenhum
bug no JavaScript produz um custo errado.

**Snapshot de preço:** `preco_kg_no_momento` congela o valor do kg no instante
do registro. Se o preço do frango mudar amanhã, os registros antigos continuam
mostrando o custo original.

**RLS (Row Level Security):** ativo nas três tabelas, com policy permissiva para
qualquer role (sistema aberto). Sem policy, o RLS bloquearia tudo por padrão.

**Realtime:** a publicação `supabase_realtime` inclui a tabela `registros`. É o
que permite o Painel atualizar ao vivo sem polling.

---

### Camada 2 — Cliente Supabase (`src/lib/supabase.ts`)

```
.env.local  →  supabase.ts  →  todas as outras camadas
```

Cria **um único cliente** para toda a aplicação. É aqui que as variáveis de
ambiente são lidas. Se `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` estiverem
ausentes, o app falha imediatamente com mensagem clara — melhor do que falhar
silenciosamente na primeira query.

A URL deve ser apenas o domínio base (`https://xxx.supabase.co`), sem nenhum
caminho. O cliente adiciona `/rest/v1/`, `/realtime/v1/` etc. conforme a
operação.

---

### Camada 3 — Tipos TypeScript (`src/types/`)

Define a forma de cada objeto que trafega entre front e banco.

```typescript
// O que o banco devolve num SELECT simples
interface Alimento { id, nome, categoria, valor_por_kg, ativo, criado_em }

// O que o front envia num INSERT (sem id, sem criado_em — o banco gera)
type NovoAlimento = Pick<Alimento, 'nome' | 'valor_por_kg'> & Partial<...>

// SELECT com JOIN (alimentos + funcionários embutidos)
interface RegistroCompleto extends Registro {
  alimentos: { nome: string }
  funcionarios: { nome: string }
}
```

A separação entre `Alimento` (completo, vindo do banco) e `NovoAlimento` (o que
o front envia) evita que campos gerados pelo banco — como `id`, `criado_em` e
`custo` — sejam enviados por engano.

---

### Camada 4 — Libs utilitárias (`src/lib/`)

**`filtros.ts`** — Calcula os limites de data para cada período:

```
'hoje' | 'semana' | 'mes' | 'personalizado'
        ↓
{ de: ISO string, ate: ISO string, label: string }
```

O `ate` é sempre `23:59:59` do dia final (não o horário atual). Isso garante
que um registro feito às 14h apareça no filtro "hoje" mesmo que o usuário
tenha aberto o Painel às 10h.

**`exportar.ts`** — Gera arquivos para download no navegador:
- `exportarExcel()` → workbook com 3 abas (Registros, Top Alimentos, Ranking)
- `exportarPDF()` → documento com cabeçalho, tabelas e lista de registros

Ambas recebem os dados já carregados pelo hook — não fazem nenhuma query ao banco.

---

### Camada 5 — Hooks (`src/hooks/`)

É onde os dados vivem dentro do React. Cada hook gerencia um pedaço do estado
global e expõe funções para mutação.

**`useAlimentos(apenasAtivos)` / `useFuncionarios(apenasAtivos)`**
- Carregam a lista no mount
- Expõem `adicionar()` e `atualizar()` que chamam o banco e recarregam a lista
- O parâmetro `apenasAtivos` controla se itens desativados aparecem

**`useFuncionarioAtual()`**
- Persiste o funcionário selecionado no `localStorage`
- Sobrevive a F5 — a funcionária não precisa se identificar de novo
- Expõe `selecionar(id)` e o objeto `funcionarioAtual`

**`useRegistros(limite)`**
- Busca os últimos N registros com JOIN (`alimentos.nome`, `funcionarios.nome`)
- Inscreve no Realtime: quando qualquer INSERT ocorre na tabela `registros`,
  recarrega automaticamente
- Expõe `inserir(novo)` para a tela de Registro

**`useTotais()`**
- Busca em paralelo o total do dia e o total do mês
- Também escuta Realtime para atualizar os cards ao vivo

**`useRegistrosFiltro(de, ate)`**
- Busca todos os registros no período (limite de 5000)
- Roda `agregar()` em memória para calcular `topAlimentos` e `ranking` sem
  queries extras ao banco
- Inscreve no Realtime com um canal nomeado pelo período para evitar duplicatas
- Retorna `{ registros, total, topAlimentos, ranking, loading }`

**Por que agregar no cliente?**
Fazer `GROUP BY` no banco geraria queries adicionais. Com no máximo alguns
milhares de registros por mês, ordenar e somar no JavaScript é instantâneo e
economiza round-trips.

---

### Camada 6 — Páginas (`src/pages/`)

Cada página consome hooks e renderiza a UI. Nenhuma página faz query direta
ao banco — tudo passa pelos hooks.

**`Registro.tsx`**
- Carrega alimentos ativos e funcionários ativos
- Persiste o funcionário selecionado via `useFuncionarioAtual`
- Calcula o custo preview em tempo real (`peso_g / 1000 * valor_por_kg`)
- Ao confirmar: chama `inserir()`, exibe feedback por 3s, limpa alimento e peso
  mas mantém o funcionário selecionado

**`Painel.tsx`**
- Barra de filtros (hoje / 7 dias / mês / personalizado)
- Chama `useRegistrosFiltro` com os limites calculados por `calcularPeriodo`
- Exibe cards de resumo, top alimentos, ranking e lista de registros
- Botões de export aparecem apenas quando há dados no período
- Passa os dados prontos para `exportarExcel` / `exportarPDF`

**`Configuracao.tsx`**
- Duas abas: Alimentos e Funcionários
- Cada aba tem lista (com edição/toggle ativo) e formulário de adição
- `useAlimentos(false)` e `useFuncionarios(false)` com `apenasAtivos=false`
  para mostrar também os itens desativados

---

### Camada 7 — Roteamento e layout (`src/App.tsx`)

Três rotas:

```
/           → redireciona para /registro
/registro   → Registro.tsx
/painel     → Painel.tsx
/configuracao → Configuracao.tsx
*           → redireciona para /registro
```

O componente `Layout` envolve todas as páginas com o header de navegação.
O `NavLink` do React Router aplica automaticamente a classe `bg-teal-600`
na rota ativa.

---

## Como os dados fluem

```
Funcionária toca "Confirmar"
        │
        ▼
  Registro.tsx chama inserir()
        │
        ▼
  useRegistros → supabase.from('registros').insert()
        │
        ▼
  Supabase (RLS policy) → PostgreSQL executa INSERT
  banco calcula coluna `custo` automaticamente
        │
        ├─── resposta HTTP 201 → tela mostra "Registro salvo"
        │
        └─── Realtime broadcast via WebSocket
                  │
                  ▼
        useRegistrosFiltro (Painel) recebe o evento
                  │
                  ▼
        Painel recarrega e atualiza sem F5
```

---

## Como rodar

```bash
# Instalar dependências
npm install

# Configurar .env.local com URL e anon key do Supabase
# (veja .env.example)

# Desenvolvimento
npm run dev

# Build de produção
npm run build
```

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite, porta 5173) |
| `npm run build` | Typecheck + build otimizado para produção |
| `npm run preview` | Serve o build localmente para testar |
| `npm run typecheck` | Verifica tipos sem gerar build |
| `npm run lint` | ESLint |

---

## Estado atual

Implementação completa das Fases 1 e 2. Pendente apenas a infraestrutura:

- [ ] Rodar `schema.sql` + SQL de RLS no Supabase
- [ ] Deploy na Vercel com as variáveis de ambiente
- [ ] Instalar como PWA no tablet do estabelecimento
- [ ] Rodar o [plano de testes](plano-testes.md) com a cliente
