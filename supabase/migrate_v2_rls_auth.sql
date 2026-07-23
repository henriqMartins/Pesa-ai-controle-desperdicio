-- =====================================================================
-- Migração v2 — RLS por papel (Fase 2 do plano de segurança)
--
-- FECHA o banco: tira o acesso da `anon key` e passa a exigir sessão
-- autenticada (Supabase Auth, Fase 1). A autorização é decidida pelo PAPEL
-- lido do JWT (`app_metadata.papel`) — inviolável pelo cliente.
--
-- Como usar: cole no SQL Editor. Rode primeiro no projeto HML, valide com o
-- teste de `curl` do fim, e só então rode no de PRODUÇÃO.
-- É idempotente — pode rodar de novo sem erro (dropa antes de criar).
--
-- Modelo de acesso (ver docs/plano-seguranca.md):
--   | Tabela                       | Funcionário | Gestor |
--   | registros                    | tudo        | tudo   |  (funcionário corrige o próprio lançamento)
--   | motivos                      | tudo        | tudo   |
--   | alimentos (produtos)         | tudo        | tudo   |
--   | funcionarios (equipe)        | só leitura  | tudo   |
--   | pratos, prato_ingredientes   | —           | tudo   |  (recurso exclusivo do gestor)
-- =====================================================================


-- ── Helper: papel do usuário logado, lido do JWT ─────────────────────────────
-- Vem de `app_metadata` (só a service_role grava) e NUNCA de `user_metadata`
-- (que o próprio usuário editaria via auth.updateUser). `stable` porque o JWT
-- não muda durante a query.
create or replace function public.auth_papel()
returns text
language sql
stable
as $$
  select auth.jwt() -> 'app_metadata' ->> 'papel';
$$;


-- ── Limpeza de políticas (anon antigas, temporárias e versões anteriores) ────
-- Cobre todos os nomes já usados para permitir re-execução limpa.
do $$
declare
  t   text;
  pol text;
begin
  foreach t in array array['alimentos','funcionarios','motivos','registros','pratos','prato_ingredientes']
  loop
    foreach pol in array array[
      'anon_acesso_total','tmp_auth_total',
      'reg_select','reg_insert','reg_update','reg_delete','reg_all',
      'mot_select','mot_insert','mot_update','mot_delete','mot_all',
      'ali_select','ali_write','ali_update','ali_delete','ali_all',
      'fun_select','fun_write','fun_insert','fun_update','fun_delete',
      'pra_gestor','prai_gestor'
    ]
    loop
      execute format('drop policy if exists %I on public.%I', pol, t);
    end loop;
  end loop;
end $$;


-- ── registros, motivos, alimentos: todo autenticado faz tudo ─────────────────
create policy "reg_all" on registros
  for all to authenticated using (true) with check (true);

create policy "mot_all" on motivos
  for all to authenticated using (true) with check (true);

create policy "ali_all" on alimentos
  for all to authenticated using (true) with check (true);


-- ── funcionarios (equipe): todos leem; só gestor escreve ────────────────────
create policy "fun_select" on funcionarios
  for select to authenticated using (true);
create policy "fun_insert" on funcionarios
  for insert to authenticated with check (auth_papel() = 'gestor');
create policy "fun_update" on funcionarios
  for update to authenticated
  using (auth_papel() = 'gestor') with check (auth_papel() = 'gestor');
create policy "fun_delete" on funcionarios
  for delete to authenticated using (auth_papel() = 'gestor');


-- ── pratos / prato_ingredientes: recurso exclusivo do gestor ────────────────
create policy "pra_gestor" on pratos
  for all to authenticated
  using (auth_papel() = 'gestor') with check (auth_papel() = 'gestor');
create policy "prai_gestor" on prato_ingredientes
  for all to authenticated
  using (auth_papel() = 'gestor') with check (auth_papel() = 'gestor');


-- ── Revogar o acesso do `anon` (a anon key deixa de acessar as tabelas) ─────
-- Depois desta migração, a anon key só serve para o /auth (login).
revoke all on public.alimentos          from anon;
revoke all on public.funcionarios       from anon;
revoke all on public.motivos            from anon;
revoke all on public.registros          from anon;
revoke all on public.pratos             from anon;
revoke all on public.prato_ingredientes from anon;
revoke execute on function public.salvar_prato(jsonb) from anon;

-- Garante os GRANTs de tabela ao papel autenticado (o RLS acima é quem filtra).
-- salvar_prato roda como SECURITY INVOKER → o RLS de pratos vale dentro dela:
-- um funcionário que a chame é barrado.
grant select, insert, update, delete on public.alimentos          to authenticated;
grant select, insert, update, delete on public.funcionarios       to authenticated;
grant select, insert, update, delete on public.motivos            to authenticated;
grant select, insert, update, delete on public.registros          to authenticated;
grant select, insert, update, delete on public.pratos             to authenticated;
grant select, insert, update, delete on public.prato_ingredientes to authenticated;
grant execute on function public.salvar_prato(jsonb)              to authenticated;


-- =====================================================================
-- Verificação (rodar no terminal, com as variáveis do HML)
--
-- 1) SEM login, com a anon key — deve falhar/vazio:
--    curl "$VITE_SUPABASE_URL/rest/v1/registros?select=*" \
--      -H "apikey: $VITE_SUPABASE_ANON_KEY"
--    Esperado: 401 permission denied — não os dados.
--
-- 2) No app:
--    - Funcionário: Monitor mostra dados; cria/edita/exclui registro; cria/edita/
--      exclui produto e motivo; NÃO consegue editar equipe (só vê); não vê Pratos.
--    - Gestor: tudo acima + CRUD de equipe + aba Pratos.
-- =====================================================================
