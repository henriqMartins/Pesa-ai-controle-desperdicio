-- =====================================================================
-- Reset completo (DEV): apaga TODAS as tabelas do projeto.
-- Use isto APENAS se não houver dados para preservar (ambiente de dev/hml).
-- Para migrar dados existentes, use migrate_v1_to_v2.sql.
-- Para preparar PRODUÇÃO para a entrega, use reset_prod_entrega.sql — ele
-- preserva as tabelas, só zera os dados e tem trava contra execução acidental.
--
-- Antes: `motivos`, `pratos` e `prato_ingredientes` não eram dropadas aqui e
-- sobreviviam ao "reset", deixando o banco num estado meio novo, meio antigo.
--
-- Depois deste script, recrie na ordem:
--   schema.sql → criar_tabelas_pratos.sql → seed.sql (opcional)
--   → migrate_v2_rls_auth.sql  ← OBRIGATÓRIO, fecha o banco
--
-- A ordem abaixo respeita as FKs (registros → alimentos/funcionarios,
-- prato_ingredientes → pratos); o CASCADE cobre dependências residuais.
-- =====================================================================

DROP TABLE IF EXISTS registros          CASCADE;
DROP TABLE IF EXISTS prato_ingredientes CASCADE;
DROP TABLE IF EXISTS pratos             CASCADE;
DROP TABLE IF EXISTS alimentos          CASCADE;
DROP TABLE IF EXISTS funcionarios       CASCADE;
DROP TABLE IF EXISTS motivos            CASCADE;

-- A RPC de pratos e o helper de papel são recriados pelos respectivos scripts;
-- dropar aqui deixa o estado previsível num reset manual.
DROP FUNCTION IF EXISTS public.salvar_prato(jsonb);
DROP FUNCTION IF EXISTS public.auth_papel();
