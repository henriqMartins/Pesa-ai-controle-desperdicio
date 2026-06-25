-- =====================================================================
-- Migração v1 → v2: unidades de medida + RLS + GRANTs
--
-- Execute no SQL Editor do Supabase caso o banco tenha sido criado com
-- o schema original (valor_por_kg, peso_g, preco_kg_no_momento).
--
-- Se o banco ainda não tem dados, é mais simples usar o schema.sql direto:
--   1. Abra o SQL Editor
--   2. Execute esta migração OU apague e recrie as tabelas com schema.sql
-- =====================================================================

-- ── 1. alimentos: renomear valor_por_kg → preco_por_unidade, adicionar unidade ──

ALTER TABLE alimentos
  RENAME COLUMN valor_por_kg TO preco_por_unidade;

ALTER TABLE alimentos
  ADD COLUMN IF NOT EXISTS unidade TEXT NOT NULL DEFAULT 'kg'
  CHECK (unidade IN ('kg','L','un'));

-- ── 2. funcionarios: remover coluna pin (não usada) ──────────────────────────

ALTER TABLE funcionarios
  DROP COLUMN IF EXISTS pin;

-- ── 3. registros: migrar colunas ─────────────────────────────────────────────
--
--  Passo a passo necessário porque custo é GENERATED (depende de peso_g):
--  a) adicionar novas colunas (nullable por enquanto)
--  b) popular com dados migrados
--  c) tornar NOT NULL
--  d) dropar custo (gerado a partir das colunas antigas)
--  e) dropar colunas antigas
--  f) recriar custo com a nova fórmula

-- a) novas colunas
ALTER TABLE registros ADD COLUMN IF NOT EXISTS quantidade          NUMERIC(10,4);
ALTER TABLE registros ADD COLUMN IF NOT EXISTS unidade_registro    TEXT;
ALTER TABLE registros ADD COLUMN IF NOT EXISTS preco_unit_tmp      NUMERIC(10,2);

-- b) popular — peso_g estava em gramas; base nova é kg
UPDATE registros SET
  quantidade       = peso_g / 1000.0,
  unidade_registro = 'g',
  preco_unit_tmp   = preco_kg_no_momento
WHERE quantidade IS NULL;

-- c) NOT NULL + constraint
ALTER TABLE registros ALTER COLUMN quantidade       SET NOT NULL;
ALTER TABLE registros ALTER COLUMN unidade_registro SET NOT NULL;
ALTER TABLE registros ALTER COLUMN preco_unit_tmp   SET NOT NULL;
ALTER TABLE registros ADD CONSTRAINT registros_quantidade_pos CHECK (quantidade > 0);

-- d) dropar coluna gerada (depende de peso_g e preco_kg_no_momento)
ALTER TABLE registros DROP COLUMN IF EXISTS custo;

-- e) dropar colunas antigas
ALTER TABLE registros DROP COLUMN IF EXISTS peso_g;
ALTER TABLE registros DROP COLUMN IF EXISTS preco_kg_no_momento;

-- f) renomear tmp e recriar coluna gerada
ALTER TABLE registros RENAME COLUMN preco_unit_tmp TO preco_unitario_no_momento;

ALTER TABLE registros
  ADD COLUMN custo NUMERIC(10,2)
  GENERATED ALWAYS AS (ROUND(quantidade * preco_unitario_no_momento, 2)) STORED;

-- ── 4. Motivos (nova tabela: catálogo editável) ──────────────────────────────

CREATE TABLE IF NOT EXISTS motivos (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  texto     text NOT NULL,
  ativo     boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Popular com os motivos que antes eram fixos no front-end (idempotente)
INSERT INTO motivos (texto)
SELECT m FROM (VALUES
  ('Erro de montagem'),
  ('Queimou / estragou'),
  ('Caiu no chão'),
  ('Sobra'),
  ('Validade vencida')
) AS v(m)
WHERE NOT EXISTS (SELECT 1 FROM motivos WHERE motivos.texto = v.m);

-- ── 5. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE alimentos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_acesso_total" ON alimentos;
DROP POLICY IF EXISTS "anon_acesso_total" ON funcionarios;
DROP POLICY IF EXISTS "anon_acesso_total" ON motivos;
DROP POLICY IF EXISTS "anon_acesso_total" ON registros;

CREATE POLICY "anon_acesso_total" ON alimentos
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_acesso_total" ON funcionarios
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_acesso_total" ON motivos
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_acesso_total" ON registros
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── 6. GRANTs ─────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alimentos    TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funcionarios TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.motivos      TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros    TO anon, authenticated;

-- ── 7. Realtime ───────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'registros'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE registros;
  END IF;
END $$;
