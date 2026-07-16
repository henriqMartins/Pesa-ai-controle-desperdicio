# Plano de Cadastro & Lógica — Tela "Pratos" (IMPLEMENTADO)

> **Status:** implementado (dados, cálculo, formulário, hook e integração). Ficam
> **deferidas** as duas medidas de acesso real (identificação da gestora via Auth
> e RLS por papel), por decisão "permissivo agora, segurança depois" — ver
> [plano-seguranca.md](plano-seguranca.md). O plano **visual e estrutural** está em
> [plano-tela-pratos-visual.md](plano-tela-pratos-visual.md) e não foi alterado —
> os componentes de UI recebem dados e handlers por props.

## Objetivo

Definir dados, cálculo, validação, persistência e controle de acesso da tela de
pratos prontos (ficha técnica + precificação), integrando ao Supabase e aos
padrões de hooks já existentes em [src/hooks/](../src/hooks/).

## Escopo a especificar (checklist para o agente de lógica)

### Dados
- [x] Tabelas relacionais `pratos` e `prato_ingredientes` (FK `on delete cascade`)
      — DDL idempotente em [`supabase/criar_tabelas_pratos.sql`](../supabase/criar_tabelas_pratos.sql),
      espelhado em [modelo-dados.md](modelo-dados.md). (Escolhido relacional em vez de JSONB.)
- [x] Tipos TS em [`src/types/prato.ts`](../src/types/prato.ts) (`Prato`,
      `PratoIngrediente`, `PratoPayload`) espelhando o schema; base no [README §8](README-tela-pratos.md).
- [x] Hook [`usePratos`](../src/hooks/usePratos.ts) (listar/criar/editar/excluir),
      no padrão de [useAlimentos](../src/hooks/useAlimentos.ts). Salvar via RPC `salvar_prato`.

### Cálculo (fonte: README §8 "Cálculo de custo por ingrediente / do prato")
Implementado em [`src/lib/calculoPrato.ts`](../src/lib/calculoPrato.ts) + testes
[`calculoPrato.test.ts`](../src/lib/calculoPrato.test.ts).
- [x] `baseCost = value * qty / (type ∈ {kg,L} ? 1000 : 1)`
- [x] `finalCost = trackLoss && bruto>0 && liquido>0 ? baseCost*(bruto/liquido) : baseCost`
- [x] `ingredientsCost`, `totalCost`, `suggestedPrice`, `markup`, `marginOnSale`
- [x] Perda `%` = `((bruto - liquido)/bruto)*100`; limiar de alerta (default 15%,
      `LIMIAR_PERDA`) — a UI já trata as cores verde/vermelho por prop.
- [x] Conversão kg/L ÷1000 coerente com a lógica de unidades do projeto
      ([src/lib/unidades.ts](../src/lib/unidades.ts)).

### Formulário e validação
- [x] Estado do form (nome, toggle perda global, lista de ingredientes,
      embalagem, margem) em `FichaPrato`; view-models em
      [`components/pratos/tipos.ts`](../src/components/pratos/tipos.ts) e conversão
      de/para o banco em [`src/lib/mapPrato.ts`](../src/lib/mapPrato.ts) (+ testes).
- [x] Validação mínima: nome obrigatório (botão Salvar desabilita por prop).
- [x] Máscara decimal (vírgula) coerente com Produtos/Registrar (`num`/`replace`).

### Acesso (gestora)
- [x] Gating de UX: [`useEhGestor`](../src/hooks/useEhGestor.ts) deriva do papel
      `gestor` do funcionário selecionado ([useFuncionarioAtual](../src/hooks/useFuncionarioAtual.ts)).
- [ ] **Identificação real** da gestora (Supabase Auth + PIN) — **DEFERIDO** para a
      fase de segurança (decisão: "permissivo agora, segurança depois").
- [ ] **RLS/regra no backend** restringindo `pratos`/`prato_ingredientes` ao papel
      gestor — **DEFERIDO**; hoje o RLS é permissivo como as demais tabelas. Ver
      [plano-seguranca.md](plano-seguranca.md).

### Integração
- [x] Componentes de [plano-tela-pratos-visual.md](plano-tela-pratos-visual.md)
      (`Pratos`, `ListaPratos`, `FichaPrato`, `LinhaIngrediente`, `ResultadoPrato`)
      ligados aos dados/handlers por props via [`usePratos`](../src/hooks/usePratos.ts).
- [x] Testes Vitest para os cálculos e o mapeamento (a lógica do hook); o wrapper
      Supabase do hook em si não tem teste unitário (thin wrapper).

> **Decisão de UI já fechada:** o card de Resultado usa o gradiente accent laranja
> (`var(--accent-grad)`), preço de venda em branco — ver §5.5 do plano visual.
> Não é ponto em aberto.
