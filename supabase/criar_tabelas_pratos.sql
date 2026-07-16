-- =====================================================================
-- Sistema de Controle de Desperdício — Petiscaria
-- Tabelas de PRATOS (ficha técnica / precificação)
--
-- Como usar: cole este arquivo no SQL Editor do projeto Supabase e execute.
-- É idempotente — pode rodar de novo sem erro.
--
-- Modelo RELACIONAL (2 tabelas): `pratos` + `prato_ingredientes` (FK com
-- on delete cascade). Ingredientes são TEXTO LIVRE com valor digitado à mão
-- (não puxam do catálogo `alimentos`). O custo é recalculado a partir dos
-- inputs salvos — não há snapshot de preço como em `registros`.
--
-- ACESSO: por ora o RLS é PERMISSIVO (igual ao resto do sistema). A restrição
-- real por papel (só gestor) entra na fase de segurança (Supabase Auth + RLS
-- por papel) — ver docs/plano-seguranca.md.
-- =====================================================================

-- Prato pronto (cabeçalho da ficha)
create table if not exists pratos (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  -- estado do toggle "Calcular perda" (global da ficha)
  calcular_perda boolean not null default false,
  -- custo fixo de embalagem somado ao total (R$)
  embalagem      numeric(10,2) not null default 0 check (embalagem >= 0),
  -- percentual de markup aplicado sobre o custo total (%)
  margem_pct     numeric(10,2) not null default 0 check (margem_pct >= 0),
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now()
);

-- Ingredientes de cada prato (linha da ficha técnica)
create table if not exists prato_ingredientes (
  id              uuid primary key default gen_random_uuid(),
  prato_id        uuid not null references pratos(id) on delete cascade,
  -- preserva a ordem em que aparecem na ficha
  posicao         int not null default 0,
  nome            text not null default '',
  -- tipo do preço unitário
  tipo            text not null
                    check (tipo in ('fixo','kg','g','L','mL','un')),
  -- preço unitário conforme o tipo (R$ fixo, R$/kg, R$/g, R$/L, R$/mL, R$/un)
  valor           numeric(12,4) not null default 0 check (valor >= 0),
  -- quantidade usada (em g/mL quando o tipo é kg/L; o cálculo divide por 1000)
  qtd             numeric(12,4) not null default 0 check (qtd >= 0),
  -- pesos só relevantes quando "calcular_perda" está ativo (null caso contrário)
  peso_bruto_kg   numeric(12,4) check (peso_bruto_kg is null or peso_bruto_kg >= 0),
  peso_liquido_kg numeric(12,4) check (peso_liquido_kg is null or peso_liquido_kg >= 0)
);

create index if not exists idx_prato_ingredientes_prato_id
  on prato_ingredientes (prato_id);


-- =====================================================================
-- Salvamento atômico (criar/editar prato + seus ingredientes)
--
-- Escrita em duas tabelas via REST não é transacional. Esta função faz tudo
-- numa única transação: upsert do prato e substituição completa da lista de
-- ingredientes. O front chama via supabase.rpc('salvar_prato', { payload }).
--
-- payload (jsonb):
-- {
--   "id": null | "<uuid>",           -- null = novo prato (gera uuid)
--   "nome": "Costela com Requeijão",
--   "calcular_perda": true,
--   "embalagem": 2.00,
--   "margem_pct": 150,
--   "ingredientes": [
--     { "posicao": 0, "nome": "Costela bovina", "tipo": "kg",
--       "valor": 38.0, "qtd": 300, "peso_bruto_kg": 1.2, "peso_liquido_kg": 0.9 },
--     ...
--   ]
-- }
-- Retorna o id do prato salvo.
-- =====================================================================

create or replace function salvar_prato(payload jsonb)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  v_id := coalesce(nullif(payload->>'id', '')::uuid, gen_random_uuid());

  insert into pratos (id, nome, calcular_perda, embalagem, margem_pct)
  values (
    v_id,
    coalesce(payload->>'nome', ''),
    coalesce((payload->>'calcular_perda')::boolean, false),
    coalesce((payload->>'embalagem')::numeric, 0),
    coalesce((payload->>'margem_pct')::numeric, 0)
  )
  on conflict (id) do update set
    nome           = excluded.nome,
    calcular_perda = excluded.calcular_perda,
    embalagem      = excluded.embalagem,
    margem_pct     = excluded.margem_pct;

  -- Substitui a lista de ingredientes por completo (mais simples que diff)
  delete from prato_ingredientes where prato_id = v_id;

  insert into prato_ingredientes
    (prato_id, posicao, nome, tipo, valor, qtd, peso_bruto_kg, peso_liquido_kg)
  select
    v_id,
    coalesce((elem.ing->>'posicao')::int, (elem.i - 1)::int),
    coalesce(elem.ing->>'nome', ''),
    elem.ing->>'tipo',
    coalesce((elem.ing->>'valor')::numeric, 0),
    coalesce((elem.ing->>'qtd')::numeric, 0),
    nullif(elem.ing->>'peso_bruto_kg', '')::numeric,
    nullif(elem.ing->>'peso_liquido_kg', '')::numeric
  from jsonb_array_elements(coalesce(payload->'ingredientes', '[]'::jsonb))
       with ordinality as elem(ing, i);

  return v_id;
end;
$$;


-- =====================================================================
-- RLS (Row Level Security)
--
-- Permissivo por ora (mesmo padrão das demais tabelas). A restrição real
-- por papel (só gestor) fica para a fase de Auth — ver docs/plano-seguranca.md.
-- =====================================================================

alter table pratos             enable row level security;
alter table prato_ingredientes enable row level security;

drop policy if exists "anon_acesso_total" on pratos;
drop policy if exists "anon_acesso_total" on prato_ingredientes;

create policy "anon_acesso_total" on pratos
  for all to anon using (true) with check (true);

create policy "anon_acesso_total" on prato_ingredientes
  for all to anon using (true) with check (true);


-- =====================================================================
-- GRANTs
--
-- Tabelas criadas via SQL Editor não recebem GRANTs automáticos. Sem GRANT,
-- o role anon recebe "permission denied" antes mesmo de o RLS ser verificado.
-- =====================================================================

grant select, insert, update, delete on public.pratos             to anon, authenticated;
grant select, insert, update, delete on public.prato_ingredientes to anon, authenticated;
grant execute on function salvar_prato(jsonb)                     to anon, authenticated;
