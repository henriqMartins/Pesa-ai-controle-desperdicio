-- =====================================================================
-- Reset de PRODUÇÃO para a entrega ao cliente
--
-- Apaga os dados de teste que ficaram em prod (de antes do ambiente HML) e
-- deixa o banco no estado de "primeiro dia": sem lançamentos, sem produtos,
-- sem equipe, sem pratos — e com os 5 motivos padrão já cadastrados, para a
-- dona conseguir registrar desde o primeiro uso.
--
-- ⚠️  DESTRUTIVO E IRREVERSÍVEL. Antes de rodar:
--     1. Faça o backup (GitHub → Actions → "Backup dos dados" → Run workflow)
--        e BAIXE o artefato. Confira que o secret SUPABASE_URL aponta para o
--        projeto de PRODUÇÃO.
--     2. Confirme no topo do SQL Editor que o projeto selecionado é o de
--        produção — e não o de HML.
--
-- Como usar: cole no SQL Editor do projeto de PRODUÇÃO, edite os PINs na
-- Parte 3 e descomente a linha `set app.confirmo` logo abaixo. Sem ela o
-- script aborta de propósito — é a trava contra execução acidental.
-- =====================================================================

-- ⬇⬇ DESCOMENTE ESTA LINHA PARA AUTORIZAR A EXECUÇÃO ⬇⬇
-- set app.confirmo = 'SIM';

do $$
begin
  if current_setting('app.confirmo', true) is distinct from 'SIM' then
    raise exception
      'Execução bloqueada: descomente `set app.confirmo = ''SIM'';` no topo do script.';
  end if;
end $$;


-- ── Parte 1 — Zerar as tabelas de dados ──────────────────────────────────────
-- TRUNCATE numa única instrução com todas as tabelas envolvidas: as FKs
-- (registros → alimentos/funcionarios, prato_ingredientes → pratos) são
-- satisfeitas sem precisar de CASCADE, que poderia alcançar tabelas fora
-- da lista. As tabelas de pratos podem ainda não existir em prod — por isso
-- a lista é montada dinamicamente com o que realmente está lá.

do $$
declare
  alvo      text;
  alvos     text[] := array[
    'registros', 'prato_ingredientes', 'pratos',
    'alimentos', 'funcionarios', 'motivos'
  ];
  presentes text[] := '{}';
begin
  foreach alvo in array alvos loop
    if to_regclass('public.' || alvo) is not null then
      presentes := presentes || alvo;
    end if;
  end loop;

  if cardinality(presentes) = 0 then
    raise exception 'Nenhuma das tabelas esperadas existe neste projeto — projeto errado?';
  end if;

  execute 'truncate table public.' || array_to_string(presentes, ', public.');
  raise notice 'Tabelas zeradas: %', array_to_string(presentes, ', ');
end $$;


-- ── Parte 2 — Recriar os motivos padrão ──────────────────────────────────────
-- Mesmos textos do seed. Sem motivo cadastrado, a tela de Registrar abre sem
-- opções; estes cinco cobrem o dia a dia e a dona edita depois.

insert into motivos (texto) values
  ('Erro de montagem'),
  ('Queimou / estragou'),
  ('Caiu no chão'),
  ('Sobra'),
  ('Validade vencida');


-- ── Parte 3 — Contas de acesso (papel + PIN de entrega) ──────────────────────
-- O papel PRECISA estar em `app_metadata`: é de lá que o front (papelDaSessao)
-- e o RLS (auth_papel()) leem. `user_metadata` não vale — o próprio usuário
-- logado poderia editá-lo via auth.updateUser e se promover a gestor.

update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                           || jsonb_build_object('papel', 'gestor'),
       updated_at = now()
 where email = 'gestor@petiscaria.local';

update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                           || jsonb_build_object('papel', 'funcionario'),
       updated_at = now()
 where email = 'funcionario@petiscaria.local';

-- ⬇⬇ TROQUE OS DOIS PINs ABAIXO (6 dígitos cada) ANTES DE RODAR ⬇⬇
-- Bcrypt via pgcrypto — mesmo algoritmo que o GoTrue usa no login.
-- Qualifique com `extensions.` porque é lá que o Supabase instala a extensão.
-- (Se der "function extensions.crypt does not exist", rode antes:
--  create extension if not exists pgcrypto with schema extensions;)

update auth.users
   set encrypted_password = extensions.crypt('000000', extensions.gen_salt('bf')),
       updated_at = now()
 where email = 'gestor@petiscaria.local';

update auth.users
   set encrypted_password = extensions.crypt('000000', extensions.gen_salt('bf')),
       updated_at = now()
 where email = 'funcionario@petiscaria.local';

-- Derruba as sessões abertas (a sua de teste, e qualquer tablet esquecido
-- logado). Sem isto, um navegador com sessão salva continuaria dentro com o
-- PIN antigo até o refresh token expirar, e ainda com o JWT sem o `papel`.
delete from auth.sessions
 where user_id in (
   select id from auth.users
    where email in ('gestor@petiscaria.local', 'funcionario@petiscaria.local')
 );


-- ── Parte 4 — Conferência ────────────────────────────────────────────────────
-- Rode este bloco separadamente após o script. Esperado: motivos = 5 e todo o
-- resto = 0; papel preenchido nas duas contas.
--
-- select 'alimentos'          as tabela, count(*) from alimentos
-- union all select 'funcionarios',       count(*) from funcionarios
-- union all select 'motivos',            count(*) from motivos
-- union all select 'registros',          count(*) from registros
-- union all select 'pratos',             count(*) from pratos
-- union all select 'prato_ingredientes', count(*) from prato_ingredientes;
--
-- select email, raw_app_meta_data ->> 'papel' as papel from auth.users order by email;
