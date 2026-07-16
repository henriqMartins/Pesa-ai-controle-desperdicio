# Plano de Cadastro & Lógica — Tela "Pratos" (HANDOFF / A FAZER)

> **Status:** stub de escopo. Esta parte é de **outro agente**. O plano
> **visual e estrutural** está pronto em
> [plano-tela-pratos-visual.md](plano-tela-pratos-visual.md) e **não deve ser
> refeito** — os componentes de UI recebem dados e handlers por props; conecte a
> lógica sem alterar o layout.

## Objetivo

Definir dados, cálculo, validação, persistência e controle de acesso da tela de
pratos prontos (ficha técnica + precificação), integrando ao Supabase e aos
padrões de hooks já existentes em [src/hooks/](../src/hooks/).

## Escopo a especificar (checklist para o agente de lógica)

### Dados
- [ ] Tabelas `dishes` e `dish_ingredients` (ou `dishes` + coluna JSONB de
      ingredientes) — DDL idempotente em `supabase/`, espelhado em
      [modelo-dados.md](modelo-dados.md).
- [ ] Tipos TS em `src/types/` (`Dish`, `DishIngredient`) espelhando o schema,
      base no modelo do [README §8](README-tela-pratos.md) ("Modelo de dados").
- [ ] Hook `usePratos` (listar/criar/editar/excluir), no padrão de
      [useAlimentos](../src/hooks/useAlimentos.ts).

### Cálculo (fonte: README §8 "Cálculo de custo por ingrediente / do prato")
- [ ] `baseCost = value * qty / (type ∈ {kg,L} ? 1000 : 1)`
- [ ] `finalCost = trackLoss && bruto>0 && liquido>0 ? baseCost*(bruto/liquido) : baseCost`
- [ ] `ingredientsCost`, `totalCost`, `suggestedPrice`, `markup`, `marginOnSale`
- [ ] Perda `%` = `((bruto - liquido)/bruto)*100`; limiar de alerta (default 15%,
      ajustável) — a UI já trata as cores verde/vermelho por prop.
- [ ] Reutilizar a lógica de unidades existente onde fizer sentido
      ([src/lib/unidades.ts](../src/lib/unidades.ts)).

### Formulário e validação
- [ ] Estado do form (nome, toggle perda global, lista de ingredientes,
      embalagem, margem), espelhando `AppState`/`Dish` do README.
- [ ] Validação mínima: nome obrigatório (botão Salvar já desabilita por prop).
- [ ] Máscara decimal (vírgula) coerente com Produtos/Registrar.

### Acesso (gestora)
- [ ] Identificação/seleção do perfil gestor (hoje só há
      [useFuncionarioAtual](../src/hooks/useFuncionarioAtual.ts) em localStorage;
      a aba Pratos é o **primeiro** ponto que exige identificação real).
- [ ] **RLS/regra no backend** restringindo `dishes`/`dish_ingredients` ao papel
      gestor — **não** basta ocultar a aba no front. Ver
      [plano-seguranca.md](plano-seguranca.md).

### Integração
- [ ] Ligar os componentes de [plano-tela-pratos-visual.md](plano-tela-pratos-visual.md)
      (`Pratos`, `ListaPratos`, `FichaPrato`, `LinhaIngrediente`, `ResultadoPrato`)
      aos dados/handlers por props.
- [ ] Testes no padrão do projeto (Vitest) para os cálculos e o hook.

> **Decisão de UI já fechada:** o card de Resultado usa o gradiente accent laranja
> (`var(--accent-grad)`), preço de venda em branco — ver §5.5 do plano visual.
> Não é ponto em aberto.
