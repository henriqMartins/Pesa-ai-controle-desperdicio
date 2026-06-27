# Atualizações — redesign, motivos, teclado e tema

> Resumo das mudanças mais recentes. Referências canônicas:
> [arquitetura](arquitetura.md) · [modelo de dados](modelo-dados.md).

## 0. Correção de lançamento (exclusão e edição)

- No Monitor, cada lançamento de "Últimos lançamentos" agora tem botões de
  **editar** (✎) e **excluir** (🗑, com confirmação).
- `useMonitor` expõe `excluir`/`recarregar`; `useRegistros` ganhou `atualizar`.
- Realtime passou a escutar `*` (INSERT/UPDATE/DELETE) — correções refletem ao
  vivo entre abas/aparelhos. Sem migração de banco. Detalhes:
  [registro-correcao.md](registro-correcao.md).

## 1. Nova navegação (IA do wireframe)

- Abas **Monitor / Produtos / Equipe / Motivos**. "Registrar" virou **modal**
  (botão `＋ Registrar` no desktop; **FAB** no celular).
- Celular: top bar enxuta + **bottom-nav** + FAB. Desktop: top bar com relógio
  **AO VIVO** (atualiza a cada segundo).
- Páginas antigas (`Registro`, `Painel`, `Configuração`) e hooks órfãos
  (`useTotais`, `useRegistrosFiltro`) foram removidos.

## 2. Monitor (dashboard ao vivo)

- **3 KPIs**: desperdício do dia, do mês e média por dia (com projeção).
- **3 painéis**: últimos lançamentos, + desperdiçados e principais motivos
  (com barras). Paleta **monocromática laranja**.
- Recalcula ao vivo via Realtime (`useMonitor`). Exportação Excel/PDF do mês.

## 3. Motivos cadastráveis

- Nova tabela **`motivos`** (texto + ativo) com RLS e grants.
- Aba **Motivos**: cadastrar, ativar/desativar. Aparecem como chips no registro.
- No registro, o campo "escrever outro motivo" tem botão **＋ salvar** que
  cadastra na hora para reutilização.
- O registro guarda o **texto** do motivo (não FK) — preserva histórico.

## 4. Teclado numérico e inputs

- Componente **`TecladoNumerico`** na paleta do tema (dígitos, vírgula, apagar),
  usado no registro de quantidade — ideal para tablet/balcão.
- **Setinhas nativas** dos inputs `number` removidas (CSS global). Preço usa
  `inputMode="decimal"`.
- **Selects** agora usam a classe `.field`: fundo escuro consistente com os
  inputs e seta própria (sem o branco nativo).

## 5. Tema claro / escuro

- Botão **sol/lua** na barra superior; persiste em `localStorage`; sem flash
  (script inline em `index.html`).
- Design system tokenizado em `src/index.css`: `:root[data-theme='dark']`
  (padrão) e `:root[data-theme='light']`. Todos os componentes usam `var(--…)`.
- Utilitários `text-white/*` do Tailwind recebem cor escura no tema claro via
  override escopado, sem editar cada uso.

## 6. Banco de dados — o que rodar no Supabase

Escolha **um** caminho no SQL Editor:

| Situação | Passos |
|---|---|
| Banco do zero / dev | `reset_e_recriar.sql` → `schema.sql` → `seed.sql` |
| Banco com dados (schema antigo) | `migrate_v1_to_v2.sql` |
| Já migrou antes, falta só motivos | seção 4 do `migrate_v1_to_v2.sql` |

> Sem a tabela `motivos`, a aba Motivos e os chips do registro vêm vazios.

## Arquivos principais

- `src/App.tsx` — navegação, top bar, bottom-nav/FAB, modal, toast, botão de tema.
- `src/components/RegistrarModal.tsx`, `src/components/TecladoNumerico.tsx`
- `src/pages/Monitor.tsx`, `Produtos.tsx`, `Equipe.tsx`, `Motivos.tsx`
- `src/hooks/useMonitor.ts`, `useMotivos.ts`, `useIsMobile.ts`, `useTheme.ts`
- `src/index.css` — tokens dual-theme. `src/types/motivo.ts` — tipos de motivo.
- `supabase/schema.sql`, `migrate_v1_to_v2.sql`, `seed.sql`, `reset_e_recriar.sql`
