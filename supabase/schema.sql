-- =====================================================================
-- Sistema de Controle de Desperdício — Petiscaria
-- Schema do banco (Postgres / Supabase)
--
-- Como usar: cole este arquivo no SQL Editor do projeto Supabase e execute.
-- Três tabelas resolvem quase tudo. Totais e rankings são CONSULTAS sobre a
-- tabela de registros — não precisam de tabela própria.
-- =====================================================================

-- Alimentos cadastrados pela dona
create table alimentos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  categoria   text,
  valor_por_kg numeric(10,2) not null check (valor_por_kg >= 0),
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

-- Funcionários (usados para login simples e atribuição do registro)
create table funcionarios (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  pin       text,                       -- PIN de 4 dígitos (controle leve, não segurança forte)
  papel     text not null default 'funcionario'
              check (papel in ('funcionario','gestor')),
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Registros de desperdício
create table registros (
  id                   uuid primary key default gen_random_uuid(),
  alimento_id          uuid not null references alimentos(id),
  funcionario_id       uuid not null references funcionarios(id),
  peso_g               numeric(10,2) not null check (peso_g > 0),
  -- snapshot do preço no momento do registro (preço muda com o tempo)
  preco_kg_no_momento  numeric(10,2) not null,
  -- custo calculado automaticamente pelo banco
  custo                numeric(10,2)
                         generated always as
                         (round((peso_g / 1000.0) * preco_kg_no_momento, 2)) stored,
  motivo               text,
  criado_em            timestamptz not null default now()
);

-- Índice para acelerar consultas por data
create index idx_registros_criado_em on registros (criado_em);


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
-- RLS (ponto de partida pragmático)
-- Para começar, ative o RLS e crie políticas permitindo leitura/escrita ao
-- usuário autenticado do app. Refine depois (ex.: só 'gestor' enxerga o
-- ranking). Mantenha simples no início — é um ambiente confiável (um local).
--
-- As linhas abaixo ficam comentadas: descomente quando for configurar o
-- controle de acesso na próxima etapa.
-- =====================================================================

-- alter table alimentos    enable row level security;
-- alter table funcionarios enable row level security;
-- alter table registros    enable row level security;
