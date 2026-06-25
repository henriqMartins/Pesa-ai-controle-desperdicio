-- =====================================================================
-- Reset completo: apaga e recria as tabelas do zero.
-- Use isto APENAS se não houver dados para preservar (ambiente de dev).
-- Para migrar dados existentes, use migrate_v1_to_v2.sql.
-- =====================================================================

DROP TABLE IF EXISTS registros    CASCADE;
DROP TABLE IF EXISTS alimentos    CASCADE;
DROP TABLE IF EXISTS funcionarios CASCADE;
