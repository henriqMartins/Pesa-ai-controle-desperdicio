-- =====================================================================
-- Dados de exemplo — Petiscaria
-- Execute APÓS o schema.sql (ou após a migração).
-- =====================================================================

-- ── Alimentos ─────────────────────────────────────────────────────────────────

INSERT INTO alimentos (nome, categoria, preco_por_unidade, unidade) VALUES
  ('Frango desfiado',   'Proteína',    32.00, 'kg'),
  ('Carne moída',       'Proteína',    38.50, 'kg'),
  ('Queijo muçarela',   'Laticínio',   45.00, 'kg'),
  ('Requeijão',         'Laticínio',   22.00, 'kg'),
  ('Farinha de trigo',  'Massa',        6.50, 'kg'),
  ('Óleo de soja',      'Gordura',      8.90, 'L'),
  ('Azeite',            'Gordura',     48.00, 'L'),
  ('Molho de tomate',   'Molho',       12.00, 'L'),
  ('Coxinha pronta',    'Salgado',      2.80, 'un'),
  ('Pastel',            'Salgado',      3.20, 'un'),
  ('Kibe',              'Salgado',      2.50, 'un'),
  ('Pão de queijo',     'Salgado',      1.80, 'un');

-- ── Motivos ───────────────────────────────────────────────────────────────────

INSERT INTO motivos (texto) VALUES
  ('Erro de montagem'),
  ('Queimou / estragou'),
  ('Caiu no chão'),
  ('Sobra'),
  ('Validade vencida');

-- ── Funcionários ──────────────────────────────────────────────────────────────

INSERT INTO funcionarios (nome, papel) VALUES
  ('Ana Souza',    'gestor'),
  ('Carlos Lima',  'funcionario'),
  ('Bruna Costa',  'funcionario'),
  ('Diego Matos',  'funcionario');

-- ── Registros de desperdício ──────────────────────────────────────────────────
-- Usa WITH para referenciar IDs por nome, evitando UUIDs hardcoded.

WITH
  a AS (SELECT id, nome, preco_por_unidade, unidade FROM alimentos),
  f AS (SELECT id, nome FROM funcionarios)
INSERT INTO registros (alimento_id, funcionario_id, quantidade, unidade_registro, preco_unitario_no_momento, motivo, criado_em)
VALUES
  -- Hoje
  ((SELECT id FROM a WHERE nome = 'Frango desfiado'),  (SELECT id FROM f WHERE nome = 'Bruna Costa'),  0.350, 'g',  32.00, 'Queimou / estragou', now() - interval '2 hours'),
  ((SELECT id FROM a WHERE nome = 'Queijo muçarela'),  (SELECT id FROM f WHERE nome = 'Carlos Lima'),  0.200, 'g',  45.00, 'Erro de montagem',   now() - interval '3 hours'),
  ((SELECT id FROM a WHERE nome = 'Coxinha pronta'),   (SELECT id FROM f WHERE nome = 'Diego Matos'),  5,     'un', 2.80,  'Caiu no chão',       now() - interval '1 hour'),
  ((SELECT id FROM a WHERE nome = 'Óleo de soja'),     (SELECT id FROM f WHERE nome = 'Carlos Lima'),  0.500, 'mL', 8.90,  'Sobra',              now() - interval '4 hours'),

  -- Ontem
  ((SELECT id FROM a WHERE nome = 'Carne moída'),      (SELECT id FROM f WHERE nome = 'Bruna Costa'),  0.420, 'g',  38.50, 'Validade vencida',   now() - interval '1 day' + interval '9 hours'),
  ((SELECT id FROM a WHERE nome = 'Requeijão'),        (SELECT id FROM f WHERE nome = 'Diego Matos'),  0.180, 'g',  22.00, 'Validade vencida',   now() - interval '1 day' + interval '11 hours'),
  ((SELECT id FROM a WHERE nome = 'Pastel'),           (SELECT id FROM f WHERE nome = 'Carlos Lima'),  8,     'un', 3.20,  'Sobra',              now() - interval '1 day' + interval '14 hours'),
  ((SELECT id FROM a WHERE nome = 'Pão de queijo'),    (SELECT id FROM f WHERE nome = 'Ana Souza'),    12,    'un', 1.80,  'Sobra',              now() - interval '1 day' + interval '16 hours'),

  -- Esta semana
  ((SELECT id FROM a WHERE nome = 'Frango desfiado'),  (SELECT id FROM f WHERE nome = 'Carlos Lima'),  0.500, 'g',  32.00, 'Queimou / estragou', now() - interval '3 days' + interval '10 hours'),
  ((SELECT id FROM a WHERE nome = 'Farinha de trigo'), (SELECT id FROM f WHERE nome = 'Bruna Costa'),  0.800, 'kg', 6.50,  'Sobra',              now() - interval '3 days' + interval '13 hours'),
  ((SELECT id FROM a WHERE nome = 'Molho de tomate'),  (SELECT id FROM f WHERE nome = 'Diego Matos'),  0.300, 'L',  12.00, 'Validade vencida',   now() - interval '4 days' + interval '9 hours'),
  ((SELECT id FROM a WHERE nome = 'Queijo muçarela'),  (SELECT id FROM f WHERE nome = 'Ana Souza'),    0.350, 'g',  45.00, 'Erro de montagem',   now() - interval '5 days' + interval '11 hours'),
  ((SELECT id FROM a WHERE nome = 'Kibe'),             (SELECT id FROM f WHERE nome = 'Carlos Lima'),  6,     'un', 2.50,  'Caiu no chão',       now() - interval '5 days' + interval '15 hours'),
  ((SELECT id FROM a WHERE nome = 'Azeite'),           (SELECT id FROM f WHERE nome = 'Bruna Costa'),  0.150, 'L',  48.00, NULL,                 now() - interval '6 days' + interval '12 hours'),

  -- Semana passada
  ((SELECT id FROM a WHERE nome = 'Carne moída'),      (SELECT id FROM f WHERE nome = 'Diego Matos'),  0.600, 'g',  38.50, 'Validade vencida',   now() - interval '10 days' + interval '10 hours'),
  ((SELECT id FROM a WHERE nome = 'Frango desfiado'),  (SELECT id FROM f WHERE nome = 'Bruna Costa'),  0.250, 'kg', 32.00, 'Sobra',              now() - interval '12 days' + interval '14 hours'),
  ((SELECT id FROM a WHERE nome = 'Coxinha pronta'),   (SELECT id FROM f WHERE nome = 'Carlos Lima'),  10,    'un', 2.80,  'Sobra',              now() - interval '14 days' + interval '11 hours'),
  ((SELECT id FROM a WHERE nome = 'Pão de queijo'),    (SELECT id FROM f WHERE nome = 'Diego Matos'),  20,    'un', 1.80,  'Validade vencida',   now() - interval '15 days' + interval '9 hours');
