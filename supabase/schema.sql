-- =====================================================================
-- Sistema de Controle de Desperdício — Petiscaria
-- Schema do banco (Postgres / Supabase)
--
-- Como usar: cole este arquivo no SQL Editor do projeto Supabase e execute.
-- Três tabelas resolvem quase tudo. Totais e rankings são CONSULTAS sobre a
-- tabela de registros — não precisam de tabela própria.
-- =====================================================================

-- Alimentos cadastrados pela dona
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

-- Funcionários (identificação na tela — sem senha nem PIN)
create table if not exists funcionarios (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  papel     text not null default 'funcionario'
              check (papel in ('funcionario','gestor')),
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Registros de desperdício
create table if not exists registros (
  id                       uuid primary key default gen_random_uuid(),
  alimento_id              uuid not null references alimentos(id),
  funcionario_id           uuid not null references funcionarios(id),
  -- quantidade na unidade base do alimento (kg, L ou un) — usada para calcular custo
  quantidade               numeric(10,4) not null check (quantidade > 0),
  -- unidade em que a funcionária digitou (g, kg, mL, L, un) — usada para exibição
  unidade_registro         text not null,
  -- snapshot do preço no momento do registro (preço muda com o tempo)
  preco_unitario_no_momento numeric(10,2) not null,
  -- custo calculado automaticamente pelo banco
  custo                    numeric(10,2)
                             generated always as
                             (round(quantidade * preco_unitario_no_momento, 2)) stored,
  motivo                   text,
  criado_em                timestamptz not null default now()
);

-- Índice para acelerar consultas por data
create index if not exists idx_registros_criado_em on registros (criado_em);

-- Habilitar Realtime para a tabela de registros (necessário para o painel ao vivo)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'registros'
  ) then
    alter publication supabase_realtime add table registros;
  end if;
end $$;


-- =====================================================================
-- Exemplos de consultas (totais e rankings)
-- Não criam objetos; servem de referência para os relatórios e o painel.
-- =====================================================================

-- Total desperdiçado hoje (R$)
-- select coalesce(sum(custo),0) as total_hoje
-- from registros
-- where criado_em >= date_trunc('day', now());

-- Top alimentos mais desperdiçados (por valor)
-- select a.nome, sum(r.custo) as total, sum(r.peso_g) as peso_total
-- from registros r join alimentos a on a.id = r.alimento_id
-- group by a.nome
-- order by total desc;

-- Ranking de funcionários (só para a gestão)
-- select f.nome, sum(r.custo) as total
-- from registros r join funcionarios f on f.id = r.funcionario_id
-- group by f.nome
-- order by total desc;


-- =====================================================================
-- RLS (Row Level Security)
--
-- O Supabase exige RLS ativo para que o Realtime funcione corretamente.
-- Como este sistema é aberto (sem login), criamos políticas permissivas
-- para a anon key — qualquer pessoa com a URL pode ler e escrever.
--
-- Se no futuro for necessário restringir acesso (ex.: só gestor vê o
-- ranking), substitua a política de `registros` por regras específicas.
-- =====================================================================

alter table alimentos    enable row level security;
alter table funcionarios enable row level security;
alter table registros    enable row level security;

-- Políticas permissivas para a anon key (sistema aberto, ambiente interno)
-- DROP IF EXISTS garante que re-executar o script não gera erro de duplicata
drop policy if exists "anon_acesso_total" on alimentos;
drop policy if exists "anon_acesso_total" on funcionarios;
drop policy if exists "anon_acesso_total" on registros;

create policy "anon_acesso_total" on alimentos
  for all to anon using (true) with check (true);

create policy "anon_acesso_total" on funcionarios
  for all to anon using (true) with check (true);

create policy "anon_acesso_total" on registros
  for all to anon using (true) with check (true);


-- =====================================================================
-- GRANTs
--
-- Tabelas criadas via SQL Editor não recebem GRANTs automáticos.
-- Sem GRANT, o role anon recebe "permission denied" antes mesmo de
-- o RLS ser verificado. Ambos precisam passar para o acesso funcionar.
-- =====================================================================

grant select, insert, update, delete on public.alimentos    to anon, authenticated;
grant select, insert, update, delete on public.funcionarios to anon, authenticated;
grant select, insert, update, delete on public.registros    to anon, authenticated;
