# Correção de registro — exclusão e edição

> Como corrigir um lançamento errado **pela própria interface**: excluir ou
> editar. Este documento descreve o problema, as decisões e **a implementação**
> (ambas já no sistema).

## O problema

O princípio do produto é "registrar tem que ser rápido, senão os dados ficam
furados". Mas registrar rápido também gera **erro**: alguém lança `5000 g` em vez
de `500 g`, escolhe o alimento errado ou o motivo trocado.

Antes, **não havia como corrigir isso dentro do app** — a única saída era a dona
abrir o painel do Supabase e mexer na linha à mão, o que gera dependência do
desenvolvedor e desconfiança no número do mês.

> O banco **já permitia** apagar/editar (`grant ... delete, update on registros
> to anon` no `schema.sql`) — **não foi preciso migração**; faltava só a interface
> e as funções no front.

## Decisões

1. **Exclusão + edição, as duas.** Excluir resolve "esse lançamento não devia
   existir"; editar resolve "o valor/motivo está errado" sem perder a hora original.
2. **Proteção contra toque acidental.** Como o sistema é aberto (sem login),
   qualquer pessoa no balcão pode mexer. A exclusão pede **confirmação**; isso
   basta para evitar engano, sem precisar de autenticação.
3. **Hard delete** (apaga de vez), não soft delete. Ferramenta interna, equipe
   pequena — simplicidade vale mais que trilha de auditoria. (Soft delete via
   coluna `cancelado` fica como evolução futura, se um dia for preciso auditar.)
4. **Snapshot de preço na edição:** se a quantidade/unidade/motivo muda mas o
   alimento é o mesmo, **mantém-se o preço congelado original** (editar quantidade
   não deve recalcular com o preço de hoje). Se o **alimento** for trocado, aí sim
   adota-se o preço atual do novo alimento — o snapshot antigo não faz sentido.

## Implementação — Exclusão

- [`useMonitor`](../src/hooks/useMonitor.ts): a função de carga virou reutilizável
  (`carregar` via `useCallback`) e o hook passou a expor **`excluir(id)`** (faz
  `delete().eq('id', id)` + recarrega) e **`recarregar`**.
- **Realtime** mudou de `event: 'INSERT'` para `event: '*'` em
  [`useMonitor`](../src/hooks/useMonitor.ts) e [`useRegistros`](../src/hooks/useRegistros.ts),
  cobrindo INSERT/UPDATE/DELETE — assim apagar/editar em outro aparelho também
  atualiza o Monitor ao vivo.
- [`Monitor`](../src/pages/Monitor.tsx): cada linha de **"Últimos lançamentos"**
  ganhou botões de **editar** (✎) e **excluir** (🗑). Excluir abre uma confirmação
  com contexto (`Excluir o lançamento de {alimento} ({custo}) de {funcionário}?`)
  antes de apagar.

## Implementação — Edição

- [`useRegistros`](../src/hooks/useRegistros.ts) ganhou **`atualizar(id, dados)`**
  (faz `update().eq('id', id)`).
- O **`RegistrarModal`** foi reaproveitado em **modo edição**: recebe um
  `registro` (e o `alimentoInicial` já resolvido pelo Monitor) e **pré-preenche**
  o formulário via inicializadores `useState` (sem efeito de prefill, evitando
  re-render desnecessário). Em modo edição o título e o botão mudam ("Salvar
  alterações") e o `confirmar()` chama `atualizar` em vez de `inserir`.
- O **funcionário** virou estado local do modal (`funcId`): na edição começa no
  funcionário original do registro; no fluxo de novo registro continua
  persistindo a seleção no `localStorage` (comportamento de antes).
- O Monitor abre o modal de edição a partir do botão ✎ e, ao salvar, recarrega
  os KPIs.

## Testes

- **Automatizados** (ver [testes.md](testes.md)): a lógica pura continua coberta;
  exclusão/edição são efeitos de I/O (chamam o Supabase) e ficam no checklist
  manual. Um teste de hook com `vi.mock('../lib/supabase')` pode ser adicionado
  se a regressão exigir.
- **Manuais:** casos adicionados ao [plano-testes.md](plano-testes.md), seção
  "Correção de lançamentos" (excluir, cancelar a confirmação, editar quantidade
  mantendo o snapshot, trocar o alimento atualizando o preço, refletir ao vivo
  em outra aba).

## Futuro

- **Soft delete / auditoria:** trocar `DELETE` por uma coluna `cancelado` e
  filtrar nas consultas, caso um dia seja preciso saber o que foi apagado.
- **Restrição por papel:** se a equipe crescer, limitar exclusão/edição a `gestor`.
