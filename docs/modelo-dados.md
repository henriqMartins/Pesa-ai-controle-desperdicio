# Modelo de dados

> O SQL canônico vive em [`supabase/schema.sql`](../supabase/schema.sql) e os
> tipos correspondentes em [`src/types/`](../src/types/). O DDL de cada tabela é
> reproduzido abaixo para consulta — mantenha-o em sincronia com o `schema.sql`.
> Planejamento original (congelado, schema antigo): [historico/base.md](historico/base.md).

Quatro tabelas resolvem o núcleo do sistema (Monitor/Produtos/Equipe/Motivos).
Totais e rankings são **consultas** sobre a tabela de registros — não precisam de
tabela própria. O módulo de **Pratos** acrescenta mais duas tabelas relacionais
(ver seção própria abaixo).

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
Usados para **atribuir a autoria** do lançamento: quem registra escolhe o próprio
nome na lista. Não são contas de acesso — o login é por PIN em duas contas do
Supabase Auth (ver [plano-seguranca.md](plano-seguranca.md)); a coluna `papel`
aqui é rótulo de equipe, e o papel que decide permissão é o do JWT.

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

## Módulo de Pratos (ficha técnica / precificação)

Duas tabelas relacionais cobrem os **pratos prontos** (produtos compostos por
vários ingredientes, ex.: "Costela com Requeijão"), separadas do catálogo de
`alimentos`. Os ingredientes são **texto livre com valor digitado à mão** — não
puxam de `alimentos`. Não há snapshot de preço: o custo é recalculado a partir
dos inputs salvos. DDL em [`criar_tabelas_pratos.sql`](../supabase/criar_tabelas_pratos.sql).

### `pratos`
Cabeçalho da ficha.

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()`. |
| `nome` | text | Obrigatório. |
| `calcular_perda` | boolean | Toggle global da ficha; default `false`. |
| `embalagem` | numeric(10,2) | Custo fixo de embalagem (R$); default `0`, `>= 0`. |
| `margem_pct` | numeric(10,2) | Markup sobre o custo (%); default `0`, `>= 0`. |
| `ativo` | boolean | Default `true`. |
| `criado_em` | timestamptz | Default `now()`. |

### `prato_ingredientes`
Linhas da ficha técnica (FK → `pratos`, `on delete cascade`).

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()`. |
| `prato_id` | uuid | FK → `pratos(id)`, `on delete cascade`. Indexada. |
| `posicao` | int | Ordem na ficha; default `0`. |
| `nome` | text | Texto livre; default `''`. |
| `tipo` | text | `'fixo'`,`'kg'`,`'g'`,`'L'`,`'mL'`,`'un'`. |
| `valor` | numeric(12,4) | Preço unitário conforme o tipo; default `0`, `>= 0`. |
| `qtd` | numeric(12,4) | Quantidade usada (g/mL quando tipo é kg/L); default `0`, `>= 0`. |
| `peso_bruto_kg` | numeric(12,4) | Nulável; só usado com perda ativa. |
| `peso_liquido_kg` | numeric(12,4) | Nulável; só usado com perda ativa. |

**Cálculo:** feito no cliente ([`src/lib/calculoPrato.ts`](../src/lib/calculoPrato.ts),
espelhando o [README §8](README-tela-pratos.md)): `baseCost = valor*qtd/(kg|L ? 1000 : 1)`;
com perda ativa e pesos > 0, `finalCost = baseCost*(bruto/liquido)`; o preço
sugerido é `totalCusto*(1+margem/100)`. Perda `%` = `((bruto-liquido)/bruto)*100`
(limiar de alerta 15%).

**Salvamento atômico:** a escrita em duas tabelas usa a função RPC `salvar_prato(payload jsonb)`
(no mesmo script), que faz upsert do prato + substituição completa dos ingredientes
numa transação. O cliente chama `supabase.rpc('salvar_prato', { payload })`.

> **RLS:** ambas as tabelas são **exclusivas do gestor** — políticas
> `pra_gestor`/`prai_gestor` exigem `auth_papel() = 'gestor'`. Como
> `salvar_prato` é `SECURITY INVOKER`, o RLS vale dentro dela: um funcionário que
> a chamasse direto pela REST seria barrado. Ver a seção de RLS abaixo.

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

O sistema exige **sessão autenticada** (login por PIN → Supabase Auth) e decide a
autorização por **papel lido do JWT**. O acesso do role `anon` às tabelas foi
**revogado**: a `anon key` que vai no bundle só serve para o endpoint `/auth`.
O SQL canônico é [`migrate_v2_rls_auth.sql`](../supabase/migrate_v2_rls_auth.sql).

> ⚠️ [`schema.sql`](../supabase/schema.sql) ainda cria as políticas antigas e
> abertas (`anon_acesso_total` + `grant ... to anon`), porque é o script de
> "banco do zero". **Sempre rode `migrate_v2_rls_auth.sql` depois dele** — e
> nunca re-rode `schema.sql`, `criar_tabela_motivos.sql` ou
> `criar_tabelas_pratos.sql` num banco já fechado sem rodar a migração de RLS em
> seguida, sob pena de reabrir o acesso `anon`.

**Modelo de acesso implementado:**

| Tabela | Funcionário | Gestor |
|---|---|---|
| `registros` | tudo (corrige o próprio lançamento) | tudo |
| `motivos` | tudo | tudo |
| `alimentos` (produtos) | tudo | tudo |
| `funcionarios` (equipe) | só leitura | tudo |
| `pratos`, `prato_ingredientes` | — | tudo |

```sql
-- Papel do usuário logado, lido do JWT. `app_metadata` (só a service_role grava),
-- NUNCA `user_metadata` (que o próprio usuário editaria via auth.updateUser).
create or replace function public.auth_papel()
returns text language sql stable as $$
  select auth.jwt() -> 'app_metadata' ->> 'papel';
$$;

-- Tudo liberado para quem está autenticado (registros, motivos, alimentos):
create policy "reg_all" on registros
  for all to authenticated using (true) with check (true);

-- Equipe: todos leem, só gestor escreve.
create policy "fun_select" on funcionarios
  for select to authenticated using (true);
create policy "fun_update" on funcionarios
  for update to authenticated
  using (auth_papel() = 'gestor') with check (auth_papel() = 'gestor');

-- Pratos: recurso exclusivo do gestor.
create policy "pra_gestor" on pratos
  for all to authenticated
  using (auth_papel() = 'gestor') with check (auth_papel() = 'gestor');

-- A anon key deixa de acessar as tabelas...
revoke all on public.registros from anon;
-- ...e o papel autenticado recebe o GRANT (o RLS acima é quem filtra).
grant select, insert, update, delete on public.registros to authenticated;
-- service_role (backup/keep-alive no Actions) bypassa RLS, mas ainda precisa do GRANT.
grant select, insert, update, delete on public.registros to service_role;
```

> **Por que GRANT *e* política:** tabelas criadas pelo SQL Editor não recebem
> `GRANT` automático, e sem ele o role leva "permission denied" (42501) antes
> mesmo de o RLS ser avaliado. Ambos precisam passar. Isso vale até para a
> `service_role`, que ignora o RLS mas não o `GRANT`.

> **Segurança:** a `service_role key` nunca vai ao front-end — ela ignora o RLS.
> Só a `anon key` é usada no cliente, e ela hoje não abre nenhuma tabela.

Verificação decisiva (deve responder `401 permission denied`, não os dados):

```bash
curl "$VITE_SUPABASE_URL/rest/v1/registros?select=*" -H "apikey: $VITE_SUPABASE_ANON_KEY"
```

## Scripts SQL

Ordem para um **banco do zero**: `schema.sql` → `criar_tabelas_pratos.sql` →
(`seed.sql`, opcional) → **`migrate_v2_rls_auth.sql` por último**.

| Arquivo | Quando usar |
|---|---|
| [`schema.sql`](../supabase/schema.sql) | Criar as 4 tabelas base do zero (idempotente). Deixa o RLS **aberto** — exige a migração de RLS depois. |
| [`criar_tabelas_pratos.sql`](../supabase/criar_tabelas_pratos.sql) | Criar `pratos`/`prato_ingredientes` + RPC `salvar_prato`. Idempotente; também deixa o RLS aberto. |
| [`migrate_v2_rls_auth.sql`](../supabase/migrate_v2_rls_auth.sql) | **Fechar o banco**: RLS por papel para `authenticated`, revogação do `anon` e grants de `authenticated`/`service_role`. Idempotente — rode sempre por último. |
| [`migrate_v1_to_v2.sql`](../supabase/migrate_v1_to_v2.sql) | Migrar um banco do schema antigo (`valor_por_kg`/`peso_g`) preservando dados, e criar a tabela `motivos`. |
| [`criar_tabela_motivos.sql`](../supabase/criar_tabela_motivos.sql) | Criar **só** a tabela `motivos` num banco que já tem as demais. Use quando `/rest/v1/motivos` responde 404. |
| [`seed.sql`](../supabase/seed.sql) | Popular dados de exemplo (alimentos, funcionários, motivos, registros). |
| [`reset_e_recriar.sql`](../supabase/reset_e_recriar.sql) | Apagar as tabelas (dev, sem dados a preservar). |
| [`reset_prod_entrega.sql`](../supabase/reset_prod_entrega.sql) | Preparar **produção** para a entrega: zera os dados, recria os 5 motivos padrão, grava o `papel` em `app_metadata`, redefine os PINs e derruba as sessões. Destrutivo, com trava `set app.confirmo = 'SIM'`. |
