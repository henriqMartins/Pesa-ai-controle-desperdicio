-- =====================================================================
-- Criação da tabela `motivos` (catálogo de motivos de desperdício)
--
-- Quando usar: se o banco foi criado ANTES de a tabela `motivos` existir
-- (bancos que rodaram uma versão antiga do schema.sql, ou só o schema v1).
-- Sintoma: a aba "Motivos" e os chips do modal de registro vêm vazios, e a
-- chamada REST a /rest/v1/motivos responde 404.
--
-- É idempotente: pode ser executado mais de uma vez sem erro.
--
-- Como usar: cole no SQL Editor do Supabase e execute. Depois recarregue o
-- app — a aba "Motivos" e os chips passam a funcionar.
--
-- Observação: este bloco já faz parte de schema.sql (banco do zero) e de
-- migrate_v1_to_v2.sql (migração). Este arquivo isola só `motivos` para
-- aplicação pontual num banco que já tem as demais tabelas.
-- `motivos` NÃO precisa entrar na publicação de Realtime (só `registros`).
--
-- ⚠️  A política criada aqui é PERMISSIVA para a `anon key` (modelo original,
--     sem login). Num banco já fechado, rode migrate_v2_rls_auth.sql DEPOIS
--     deste script — senão `motivos` fica aberto na internet enquanto as outras
--     tabelas seguem protegidas. Ver docs/plano-seguranca.md.
-- =====================================================================

-- 1. Tabela
create table if not exists motivos (
  id        uuid primary key default gen_random_uuid(),
  texto     text not null,
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);

-- 2. RLS + política permissiva (modelo original, sem login) — substituída por
--    migrate_v2_rls_auth.sql, que precisa rodar depois deste script
alter table motivos enable row level security;
drop policy if exists "anon_acesso_total" on motivos;
create policy "anon_acesso_total" on motivos
  for all to anon using (true) with check (true);

-- 3. GRANT (tabelas criadas via SQL Editor não recebem grant automático;
--    sem ele, o role anon leva "permission denied" antes mesmo do RLS)
grant select, insert, update, delete on public.motivos to anon, authenticated;

-- 4. Motivos padrão (idempotente — só insere o que ainda não existe)
insert into motivos (texto)
select m from (values
  ('Erro de montagem'),
  ('Queimou / estragou'),
  ('Caiu no chão'),
  ('Sobra'),
  ('Validade vencida')
) as v(m)
where not exists (select 1 from motivos where motivos.texto = v.m);
