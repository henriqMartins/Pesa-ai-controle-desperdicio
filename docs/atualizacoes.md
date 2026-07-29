# Atualizações — changelog do projeto

> Resumo das mudanças, das mais recentes para as mais antigas. Referências
> canônicas: [arquitetura](arquitetura.md) · [modelo de dados](modelo-dados.md) ·
> [plano de segurança](plano-seguranca.md).

## Marcos (do mais recente ao mais antigo)

### A. Entrega e ajustes de produção
- **Reset de produção para a entrega:** [`reset_prod_entrega.sql`](../supabase/reset_prod_entrega.sql)
  zera os dados de teste, recria os 5 motivos padrão, grava o `papel` em
  `app_metadata`, redefine os PINs e derruba as sessões abertas. Destrutivo, com
  trava explícita (`set app.confirmo = 'SIM'`).
- **SPA fallback na Vercel:** `rewrites` no [`vercel.json`](../vercel.json) —
  recarregar `/pratos` ou `/monitor` deixou de dar 404.
- **Escala do dashboard em telas grandes:** fontes e espaçamentos ampliados no
  Monitor e no modo de exibição; título do header maior.
- **Modo de exibição:** corrigido o giro infinito no celular — a decisão de travar
  a orientação passou a olhar o **menor lado** da viewport (`useEhCelular`), não a
  largura, que a própria trava alterava.

### B. Segurança (Fases 1 a 4 do [plano](plano-seguranca.md))
- **Login por PIN** (`TelaPin`/`TecladoPin`): duas contas do Supabase Auth com
  email fantasma e o PIN de 6 dígitos como senha; `ProtectedRoute` como portão.
- **RLS por papel** ([`migrate_v2_rls_auth.sql`](../supabase/migrate_v2_rls_auth.sql)):
  acesso do `anon` revogado, políticas para `authenticated` e papel lido de
  `app_metadata` (nunca de `user_metadata`). **Fecha o banco.**
- **Bloqueio de tela** (`LockOverlay`) sem derrubar a sessão, com o PIN conferido
  no servidor por um **cliente Supabase isolado**; **lockout** de 5 tentativas
  (`useLockout`), persistido em `localStorage`.
- **CSP e headers de segurança** no `vercel.json`; por causa da CSP, o script de
  tema virou arquivo externo (`public/theme-init.js`) e o service worker passou a
  ser registrado por arquivo (`injectRegister: 'script'`).
- **`grant` para `service_role`** — bypass de RLS não dispensa `GRANT`; sem isso os
  workflows recebiam `42501`.
- **Gating de UI por papel:** aba/rota Pratos só para gestor; escrita na Equipe só
  para gestor (`useEhGestor`, a partir do papel da sessão).

### C. Automação e robustez
- **CI** ([`ci.yml`](../.github/workflows/ci.yml)): lint + typecheck + testes +
  build a cada push/PR — ver [ci.md](ci.md).
- **Backup semanal** das 6 tabelas como artefato ([`backup-dados.yml`](../.github/workflows/backup-dados.yml)).
- **Keep-alive** do projeto Supabase a cada 2 dias ([`keep-supabase-alive.yml`](../.github/workflows/keep-supabase-alive.yml)).
- **`ErrorBoundary`** global: erro de render vira tela amigável com "Recarregar".
- **Estado de erro + retry** no Monitor: falha de carga não é mostrada como
  "R$ 0,00".

### D. Pratos (ficha técnica / precificação)
- Tabelas relacionais `pratos` + `prato_ingredientes` e a **RPC transacional**
  `salvar_prato` ([`criar_tabelas_pratos.sql`](../supabase/criar_tabelas_pratos.sql)).
- Cálculo puro em [`calculoPrato.ts`](../src/lib/calculoPrato.ts) (custo, perda por
  bruto ÷ líquido, embalagem, margem, preço sugerido) e o mapeamento
  banco ⇄ view-model em [`mapPrato.ts`](../src/lib/mapPrato.ts).
- Aba **Pratos** (lista ↔ ficha), exclusiva do gestor. Planos:
  [lógica](plano-tela-pratos-logica.md) · [visual](plano-tela-pratos-visual.md).

### E. Análise e apresentação
- **Filtros avançados** (`FiltrosModal`): 3 modos (mais registrados, maior valor,
  por produto) × períodos (7d, 30d, mês, total, intervalo), sobre lógica pura em
  [`filtros.ts`](../src/lib/filtros.ts).
- **Mini-filtros de período** por painel no Monitor (hoje/ontem/mês/total/data),
  com carga sob demanda via [`useRegistrosPeriodo`](../src/hooks/useRegistrosPeriodo.ts)
  quando o recorte ultrapassa o mês corrente.
- **Modo de exibição** para TV/balcão: fullscreen real, KPIs em `clamp()`, relógio
  com segundos, layout responsivo e trava de orientação no celular.

### F. Fuso e PWA
- **Fuso de São Paulo** em [`lib/fuso.ts`](../src/lib/fuso.ts) (sem dependências,
  resistente a horário de verão): "hoje" e "este mês" deixaram de depender do
  relógio do tablet.
- **PWA completo:** manifest com nome/cores da marca, ícones 192/512 + maskable +
  apple-touch-icon (gerados por [`scripts/gerar-icones.mjs`](../scripts/gerar-icones.mjs)),
  meta tags de iOS, zoom travado e respeito às safe-areas.
- **Responsividade endurecida:** troca de shell em `lg` (1024px), menu de três
  pontos no mobile, `pb-nav`/`safe-*` para bottom-nav e barra de gestos.

### G. Correção de lançamento (exclusão e edição)

- No Monitor, cada lançamento de "Últimos lançamentos" agora tem botões de
  **editar** (✎) e **excluir** (🗑, com confirmação).
- `useMonitor` expõe `excluir`/`recarregar`; `useRegistros` ganhou `atualizar`.
- Realtime passou a escutar `*` (INSERT/UPDATE/DELETE) — correções refletem ao
  vivo entre abas/aparelhos. Sem migração de banco. Detalhes:
  [registro-correcao.md](registro-correcao.md).

---

## Redesign inicial (histórico detalhado)

### H. Nova navegação (IA do wireframe)

- Abas **Monitor / Produtos / Equipe / Motivos**. "Registrar" virou **modal**
  (botão `＋ Registrar` no desktop; **FAB** no celular).
- Celular: top bar enxuta + **bottom-nav** + FAB. Desktop: top bar com relógio
  **AO VIVO** (atualiza a cada segundo).
- Páginas antigas (`Registro`, `Painel`, `Configuração`) e hooks órfãos
  (`useTotais`, `useRegistrosFiltro`) foram removidos.

### I. Monitor (dashboard ao vivo)

- **3 KPIs**: desperdício do dia, do mês e média por dia (com projeção).
- **3 painéis**: últimos lançamentos, + desperdiçados e principais motivos
  (com barras). Paleta **monocromática laranja**.
- Recalcula ao vivo via Realtime (`useMonitor`). Exportação Excel/PDF do mês.

### J. Motivos cadastráveis

- Nova tabela **`motivos`** (texto + ativo) com RLS e grants.
- Aba **Motivos**: cadastrar, ativar/desativar. Aparecem como chips no registro.
- No registro, o campo "escrever outro motivo" tem botão **＋ salvar** que
  cadastra na hora para reutilização.
- O registro guarda o **texto** do motivo (não FK) — preserva histórico.

### K. Teclado numérico e inputs

- Componente **`TecladoNumerico`** na paleta do tema (dígitos, vírgula, apagar),
  usado no registro de quantidade — ideal para tablet/balcão.
- **Setinhas nativas** dos inputs `number` removidas (CSS global). Preço usa
  `inputMode="decimal"`.
- **Selects** agora usam a classe `.field`: fundo escuro consistente com os
  inputs e seta própria (sem o branco nativo).

### L. Tema claro / escuro

- Botão **sol/lua** na barra superior; persiste em `localStorage`; sem flash.
  (O script anti-flash era inline no `index.html`; virou o arquivo externo
  `public/theme-init.js` quando a CSP passou a exigir `script-src 'self'`.)
- Design system tokenizado em `src/index.css`: `:root[data-theme='dark']`
  (padrão) e `:root[data-theme='light']`. Todos os componentes usam `var(--…)`.
- Utilitários `text-white/*` do Tailwind recebem cor escura no tema claro via
  override escopado, sem editar cada uso.

---

## Banco de dados — o que rodar no Supabase

Escolha **um** caminho no SQL Editor e **termine sempre pela migração de RLS**:

| Situação | Passos |
|---|---|
| Banco do zero / dev | `reset_e_recriar.sql` → `schema.sql` → `criar_tabelas_pratos.sql` → `seed.sql` → **`migrate_v2_rls_auth.sql`** |
| Banco com dados (schema antigo) | `migrate_v1_to_v2.sql` → `criar_tabelas_pratos.sql` → **`migrate_v2_rls_auth.sql`** |
| Já migrou antes, falta só `motivos` | `criar_tabela_motivos.sql` → **`migrate_v2_rls_auth.sql`** |
| Preparar produção para a entrega | `reset_prod_entrega.sql` (destrutivo, com trava) |

> ⚠️ `schema.sql`, `criar_tabela_motivos.sql` e `criar_tabelas_pratos.sql` criam
> políticas **abertas** para o role `anon` (herança do sistema original sem
> login). Rodar qualquer um deles num banco já fechado **reabre o acesso** — daí a
> migração de RLS ao final de todo caminho. Confira com o `curl` da
> [verificação](plano-seguranca.md#verificação).

> Sem a tabela `motivos`, a aba Motivos e os chips do registro vêm vazios.

## Onde as coisas moram

A lista completa e comentada está em [README.md](README.md#estrutura-de-pastas)
(estrutura de pastas) e em [README.md](README.md#camadas-do-código) (camadas do
código). Manter aquele documento é o suficiente — esta seção não repete a árvore
para não haver duas versões divergindo.
