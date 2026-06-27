# Modelo de dados

> O SQL canônico vive em [`supabase/schema.sql`](../supabase/schema.sql) e os
> tipos correspondentes em [`src/types/`](../src/types/). O DDL de cada tabela é
> reproduzido abaixo para consulta — mantenha-o em sincronia com o `schema.sql`.
> Planejamento original (congelado, schema antigo): [historico/base.md](historico/base.md).

Quatro tabelas resolvem o sistema. Totais e rankings são **consultas** sobre a
tabela de registros — não precisam de tabela própria.

## Tabelas

### `alimentos`
Alimentos cadastrados pela dona. Cada um tem uma **unidade base** (`kg`, `L` ou
`un`) e o preço é por essa unidade.

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()`. |
| `nome` | text | Obrigatório. |
| `categoria` | text | Opcional. |
| `preco_por_unidade` | numeric(10,2) | Obrigatório, `>= 0`. Preço por unidade base. |
| `unidade` | text | `'kg'`, `'L'` ou `'un'`; default `'kg'`. |
| `ativo` | boolean | Default `true`. |
| `criado_em` | timestamptz | Default `now()`. |

```sql
create table if not exists alimentos (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null,
  categoria        text,
  preco_por_unidade numeric(10,2) not null check (preco_por_unidade >= 0),
  unidade          text not null default 'kg'
                     check (unidade in ('kg','L','un')),
  ativo            boolean not null default true,
  criado_em        timestamptz not null default now()
);
```

### `funcionarios`
Usados para identificação e atribuição do registro. O sistema não tem senha — o funcionário seleciona o próprio nome na tela.

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()`. |
| `nome` | text | Obrigatório. |
| `papel` | text | `'funcionario'` ou `'gestor'`; default `'funcionario'`. |
| `ativo` | boolean | Default `true`. |
| `criado_em` | timestamptz | Default `now()`. |

```sql
create table if not exists funcionarios (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  papel     text not null default 'funcionario'
              check (papel in ('funcionario','gestor')),
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);
```

### `motivos`
Catálogo de motivos editável pela dona. Aparecem como atalhos (chips) na tela de
registro; a equipe pode cadastrar os próprios em vez de redigitar sempre.

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()`. |
| `texto` | text | Obrigatório. |
| `ativo` | boolean | Default `true`. Desativar esconde o chip sem apagar histórico. |
| `criado_em` | timestamptz | Default `now()`. |

> O registro guarda o **texto** do motivo (não uma FK), preservando o histórico
> mesmo que um motivo seja desativado ou renomeado depois.

```sql
create table if not exists motivos (
  id        uuid primary key default gen_random_uuid(),
  texto     text not null,
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);
```

> Foi adicionada ao schema no redesign. Bancos criados antes disso ficam **sem**
> a tabela (a aba Motivos e os chips vêm vazios, e `/rest/v1/motivos` responde
> 404). Para criá-la num banco existente, rode
> [`criar_tabela_motivos.sql`](../supabase/criar_tabela_motivos.sql).

### `registros`
Registros de desperdício.

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()`. |
| `alimento_id` | uuid | FK → `alimentos(id)`. |
| `funcionario_id` | uuid | FK → `funcionarios(id)`. |
| `quantidade` | numeric(10,4) | Obrigatório, `> 0`. Na **unidade base** do alimento. |
| `unidade_registro` | text | Unidade em que a pessoa digitou (`g`, `kg`, `mL`, `L`, `un`) — usada só para exibição. |
| `preco_unitario_no_momento` | numeric(10,2) | **Snapshot** do preço no instante do registro. |
| `custo` | numeric(10,2) | **Coluna gerada** pelo banco; não é enviada pelo cliente. |
| `motivo` | text | Opcional (texto livre ou vindo de um chip de `motivos`). |
| `criado_em` | timestamptz | Default `now()`. Indexada (`idx_registros_criado_em`). |

```sql
create table if not exists registros (
  id                       uuid primary key default gen_random_uuid(),
  alimento_id              uuid not null references alimentos(id),
  funcionario_id           uuid not null references funcionarios(id),
  -- quantidade na unidade base do alimento (kg, L ou un)
  quantidade               numeric(10,4) not null check (quantidade > 0),
  -- unidade em que a pessoa digitou (g, kg, mL, L, un) — só exibição
  unidade_registro         text not null,
  -- snapshot do preço no momento do registro (o preço muda com o tempo)
  preco_unitario_no_momento numeric(10,2) not null,
  -- custo calculado automaticamente pelo banco (coluna gerada)
  custo                    numeric(10,2)
                             generated always as
                             (round(quantidade * preco_unitario_no_momento, 2)) stored,
  motivo                   text,
  criado_em                timestamptz not null default now()
);

-- Índice para acelerar consultas por data
create index if not exists idx_registros_criado_em on registros (criado_em);

-- Realtime: só `registros` entra na publicação (mantém o Monitor ao vivo)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'registros'
  ) then
    alter publication supabase_realtime add table registros;
  end if;
end $$;
```

**Unidades:** o cliente sempre grava `quantidade` já convertida para a unidade
base do alimento (ver [`src/lib/unidades.ts`](../src/lib/unidades.ts):
`converterParaBase`). `unidade_registro` guarda como foi digitado para reexibir
fielmente (`exibirQuantidade`). Ex.: digitar `500 g` num alimento em `kg` grava
`quantidade = 0.5`, `unidade_registro = 'g'`.

**Snapshot de preço:** `preco_unitario_no_momento` guarda o preço **no momento do
registro**. Como o preço muda, sem isso os relatórios antigos seriam recalculados
com o preço de hoje. O `custo` é calculado pelo próprio banco (coluna gerada):

```sql
custo numeric(10,2)
  generated always as
  (round(quantidade * preco_unitario_no_momento, 2)) stored
```

## Consultas (totais e rankings)

```sql
-- Total desperdiçado hoje (R$)
select coalesce(sum(custo),0) as total_hoje
from registros
where criado_em >= date_trunc('day', now());

-- Top alimentos mais desperdiçados (por valor)
select a.nome, sum(r.custo) as total, sum(r.quantidade) as qtd_total
from registros r join alimentos a on a.id = r.alimento_id
group by a.nome
order by total desc;

-- Ranking de funcionários (só para a gestão)
select f.nome, sum(r.custo) as total
from registros r join funcionarios f on f.id = r.funcionario_id
group by f.nome
order by total desc;

-- Principais motivos (por valor)
select coalesce(nullif(trim(motivo), ''), 'Sem motivo') as motivo,
       sum(custo) as total
from registros
group by 1
order by total desc;
```

> Na prática, o front carrega os registros do período e agrega em memória
> (ver `useMonitor`), recalculando ao vivo a cada novo registro via Realtime.

## RLS e permissões

O sistema usa a `anon key` sem autenticação de usuário (ambiente interno, um só
local). O RLS está **ativo** com políticas permissivas para o role `anon`, e as
tabelas recebem `GRANT` explícito — **ambos** precisam passar para o acesso e o
Realtime funcionarem (sem o `GRANT`, o `anon` leva "permission denied" antes
mesmo de o RLS ser avaliado).

```sql
-- Ativar RLS nas quatro tabelas
alter table alimentos    enable row level security;
alter table funcionarios enable row level security;
alter table motivos      enable row level security;
alter table registros    enable row level security;

-- Política permissiva para a anon key (idempotente: drop antes de recriar)
-- Repita o par drop/create para cada tabela (alimentos, funcionarios, motivos, registros):
drop policy if exists "anon_acesso_total" on registros;
create policy "anon_acesso_total" on registros
  for all to anon using (true) with check (true);

-- GRANT por tabela (tabelas criadas via SQL Editor não recebem grant automático)
grant select, insert, update, delete on public.alimentos    to anon, authenticated;
grant select, insert, update, delete on public.funcionarios to anon, authenticated;
grant select, insert, update, delete on public.motivos      to anon, authenticated;
grant select, insert, update, delete on public.registros    to anon, authenticated;
```

> **Segurança:** a `service_role key` nunca vai ao front-end — ela ignora o RLS.
> Só a `anon key` (protegida pelo RLS) é usada no cliente.

## Scripts SQL

| Arquivo | Quando usar |
|---|---|
| [`schema.sql`](../supabase/schema.sql) | Criar o banco do zero (idempotente). |
| [`migrate_v1_to_v2.sql`](../supabase/migrate_v1_to_v2.sql) | Migrar um banco do schema antigo (`valor_por_kg`/`peso_g`) preservando dados, e criar a tabela `motivos`. |
| [`criar_tabela_motivos.sql`](../supabase/criar_tabela_motivos.sql) | Criar **só** a tabela `motivos` (+RLS, grant, motivos padrão) num banco que já tem as demais. Use quando `/rest/v1/motivos` responde 404. |
| [`seed.sql`](../supabase/seed.sql) | Popular dados de exemplo (alimentos, funcionários, motivos, registros). |
| [`reset_e_recriar.sql`](../supabase/reset_e_recriar.sql) | Apagar as tabelas (dev, sem dados a preservar). |
