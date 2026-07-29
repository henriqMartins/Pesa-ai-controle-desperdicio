# Handoff: Monitor de Desperdício — Petiscaria Aquino

> ⚠️ **DOCUMENTO DE HANDOFF — PARCIALMENTE CONGELADO.**
>
> **Ainda vale:** a **§8** (fórmulas de custo, perda, markup e preço sugerido dos
> pratos) é a **fonte canônica** do cálculo implementado em
> [`src/lib/calculoPrato.ts`](../src/lib/calculoPrato.ts), e a estrutura/hierarquia
> visual descrita aqui foi seguida.
>
> **Não vale mais:**
> - **"Não há login — o sistema é aberto"** e a Decisão 6 ("Login: descartado").
>   O sistema tem **login por PIN** com dois papéis e **RLS por papel** no banco —
>   ver [plano-seguranca.md](plano-seguranca.md).
> - **A paleta azul/navy** (`#1f2a5e`, `#0b1330`, `#141d45`…) e qualquer cor fixa.
>   O projeto roda uma paleta **quente laranja** 100% tokenizada em
>   [`src/index.css`](../src/index.css), com temas claro e escuro. O mapa de
>   tradução protótipo → token está em
>   [plano-tela-pratos-visual.md](plano-tela-pratos-visual.md#11-mapa-de-tradução-protótipo-azul--token-oficial).
>
> Para o estado real do sistema: [produto.md](produto.md) ·
> [arquitetura.md](arquitetura.md) · [modelo-dados.md](modelo-dados.md).

## Visão Geral

Sistema web de controle de desperdício de alimentos para a **Petiscaria Aquino**. O sistema funciona como um **dashboard ao vivo** que atualiza automaticamente os indicadores a cada novo lançamento registrado. Não há login — o sistema é aberto.

## Sobre os Arquivos de Design

Os arquivos neste pacote são **protótipos de referência criados em HTML** — mockups de alta fidelidade mostrando aparência visual e comportamento pretendidos, **não código de produção para copiar diretamente**. A tarefa do desenvolvedor é **recriar estes designs no ambiente do projeto real** (React, Next.js, Vue, etc.) usando os padrões e bibliotecas já estabelecidos no codebase. Se nenhum ambiente existir, React + TypeScript + Tailwind é a recomendação natural para este tipo de dashboard.

## Fidelidade

**Alta fidelidade (hi-fi).** O protótipo tem cores finais, tipografia, espaçamentos e interações funcionando. O desenvolvedor deve recriar a UI pixel a pixel usando as bibliotecas do projeto existente.

## Decisões de Design Confirmadas

| # | Tela | Escolha |
|---|------|---------|
| 1 | Navegação | Barra superior (desktop/TV) + bottom nav + FAB no mobile |
| 2 | Dashboard | 3 KPIs + 3 painéis ao vivo |
| 3 | Registrar | Entrada rápida com chips (desktop/tablet) + passo a passo (mobile) |
| 4 | Produtos | Grade de cards + modal de cadastro |
| 5 | Equipe | Lista + modal com toggle ativo/inativo |
| 6 | Login | **Descartado** — sistema aberto, sem autenticação ⟵ *revertido: hoje há login por PIN, ver §7* |
| 7 | Pratos prontos | Nova aba "Pratos" — lista de fichas + tela de criação/edição (ficha técnica e precificação), acesso restrito à gestora |

---

## Telas / Views

### 1. Shell Geral (Layout Wrapper)

- Fundo: `radial-gradient(130% 100% at 50% -10%, #1f2a5e 0%, #131c45 42%, #0b1230 100%)`
- Cor de texto base: `#ffffff`
- Fonte: **Plus Jakarta Sans** (Google Fonts) — pesos 400, 500, 600, 700, 800
- `padding-bottom: 40px`
- Conteúdo interno com `max-width` variável por página

---

### 2. Top Bar — Barra Superior (Decisão 1-A)

**Aplicação:** desktop, tablet e TV (monitor ao vivo).  
**Mobile:** substituída por bottom nav + FAB (ver seção Mobile).

**Layout:** `position: sticky; top: 0; z-index: 30`  
`backdrop-filter: blur(12px); background: rgba(9,13,36,.78)`  
`border-bottom: 1px solid rgba(255,255,255,.08)`  
`display: flex; align-items: center; gap: 18px; padding: 11px 22px; flex-wrap: wrap`

**Elementos (da esquerda para direita):**

#### Logo / Marca
- Container: `width:38px; height:38px; border-radius:11px; background: linear-gradient(140deg,#ff8a4c,#f0464e); box-shadow: 0 6px 18px rgba(240,70,78,.4); flex:none`
- Ícone: SVG de lixeira (`24×24`, stroke `#fff`, stroke-width `2`)
- Nome: "Petiscaria Aquino" — `font-size:17px; font-weight:800; color:#ffb066; white-space:nowrap`
- Subtítulo: "Monitor de Desperdício" — `font-size:11px; font-weight:600; color:rgba(255,255,255,.5)`

#### Tabs de Navegação
- Container: `display:flex; gap:4px; margin-left:8px`
- Tab inativo: `padding:9px 15px; border-radius:11px; font-weight:700; font-size:14px; background:transparent; color:rgba(255,255,255,.58); border:none`
- Tab ativo: `padding:9px 15px; border-radius:11px; font-weight:800; font-size:14px; background:rgba(255,255,255,.12); color:#fff; border:none`
- 4 tabs: **Monitor**, **Produtos**, **Equipe**, **Pratos** (a aba "Pratos" só deve aparecer/ser acessível para o usuário com papel de gestora — ver seção 8)

#### Indicador AO VIVO
- Container: `background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); padding:7px 13px; border-radius:11px; display:flex; align-items:center; gap:8px`
- Bolinha pulsante: `width:9px; height:9px; border-radius:50%; background:#34d399; box-shadow:0 0 10px #34d399`
- Animação: `@keyframes livedot { 0%,100%{ opacity:1 } 50%{ opacity:.2 } }` — `1.4s ease-in-out infinite`
- Texto "AO VIVO": `color:#34d399; font-size:12px; font-weight:700; letter-spacing:.05em`
- Relógio: `font-variant-numeric:tabular-nums; font-size:14px; font-weight:700` — atualiza a cada segundo via `setInterval`

#### CTA "Registrar desperdício"
- `background: linear-gradient(135deg,#ff8a4c,#f0464e)`
- `color:#fff; border:none; border-radius:12px; padding:11px 17px; font-weight:800; font-size:14px`
- `box-shadow: 0 8px 22px rgba(240,70,78,.35)`
- Ícone SVG `+` (`17×17`) à esquerda
- Abre o **Modal de Registrar** ao clicar

#### Mobile — Bottom Nav + FAB
- Bottom nav fixo com 3 ícones: Monitor (ativo em `#d9542b`) · Produtos · Equipe
- FAB `＋` flutuante `position:absolute; right:14px; bottom:56px` — `width:46px; height:46px; border-radius:50%; background:#f7d9cd; border:2px solid #d9542b; color:#b8431f`
- Ao tocar o FAB abre o modal de registrar em bottom-sheet

---

### 3. Dashboard — Monitor ao vivo (Decisão 2-A)

`max-width: 1280px; margin: 0 auto; padding: 26px 22px 0`

#### Linha de KPIs (3 cards)

Grid: `display:grid; grid-template-columns:repeat(auto-fit,minmax(258px,1fr)); gap:18px`

**Card 1 — Desperdício do dia**
- Background: `linear-gradient(142deg,#ff8a4c,#ef4459)`
- `border-radius:22px; padding:22px 24px; box-shadow:0 18px 40px rgba(239,68,89,.28)`
- Label: `font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:.07em`
- Badge "HOJE": `background:rgba(255,255,255,.22); border-radius:30px; padding:4px 11px; font-size:11px; font-weight:800`
- Valor: `font-size:46px; font-weight:800; letter-spacing:-.02em; line-height:1; margin:16px 0 6px`
- Subtexto: contagem de lançamentos + nome do produto de maior valor hoje
- Ícone SVG decorativo: `position:absolute; right:-6px; bottom:-10px; opacity:.18`
- **Cálculo:** soma de `preço × quantidade` de todos os lançamentos do dia corrente

**Card 2 — Desperdício do mês**
- Background: `linear-gradient(142deg,#3b82f6,#1d4ed8)`
- `border-radius:22px; padding:22px 24px; box-shadow:0 18px 40px rgba(37,99,235,.28)`
- Badge "MÊS"
- Subtexto: quantidade de lançamentos no mês
- **Cálculo:** soma de todos os lançamentos do mês corrente

**Card 3 — Média por dia**
- Background: `linear-gradient(142deg,#14b8a6,#0e8e87)`
- `border-radius:22px; padding:22px 24px; box-shadow:0 18px 40px rgba(20,184,166,.26)`
- Badge "MÊS"
- Subtexto: "projeção do mês: R$ X,XX"
- **Cálculo:** `mediaDia = totalMes / diaAtualDoMes` · `projecao = mediaDia × totalDiasNoMes`

---

#### Linha de Painéis (3 cards)

Grid: `display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:18px; margin-top:18px`

**Painel 1 — Últimos lançamentos**
- Background: `#0b1330; border:1px solid rgba(255,255,255,.08); border-radius:22px; padding:22px; min-height:372px`
- Lista dos 6 lançamentos mais recentes (ordem timestamp desc)
- Cada linha: `display:flex; justify-content:space-between; align-items:center; padding:11px 12px; border-bottom:1px solid rgba(255,255,255,.06)`
- Nome: `font-size:15px; font-weight:700; color:#fff`
- Badge "NOVO": `background:#34d399; color:#063; font-size:9px; font-weight:800; padding:2px 6px; border-radius:20px` — exibido nos lançamentos criados na sessão atual
- Linha "NOVO": fundo `background:rgba(52,211,153,.1)`
- Motivo + hora: `font-size:12px; font-weight:500; color:rgba(255,255,255,.5)`
- Valor: `font-size:15px; font-weight:800; color:#ffb38a`

**Painel 2 — Produtos mais desperdiçados**
- Background: `linear-gradient(165deg,#7c3aed,#5a24c0); box-shadow:0 18px 40px rgba(124,58,237,.24)`
- Top 5 produtos do mês por valor total
- Cada item: posição + nome + valor (linha), barra proporcional ao 1º, contagem de lançamentos
- Barra trilha: `height:7px; border-radius:6px; background:rgba(255,255,255,.18)`
- Barra fill: `background:rgba(255,255,255,.92)` com `width` em %
- Rodapé: total do mês

**Painel 3 — Principais motivos**
- Background: `linear-gradient(165deg,#fb6a5a,#e0344a); box-shadow:0 18px 40px rgba(224,52,74,.24)`
- Top 5 motivos do mês por valor total (agrupados pelo campo de texto livre)
- Mesma estrutura do Painel 2
- Rodapé: total do mês

---

### 4. Registrar Desperdício (Decisão 3-B + Mobile)

#### Desktop / Tablet — Entrada rápida com chips

**Modal** — `width:min(450px,94vw); max-height:92vh; overflow:auto`  
Background: `#141d45; border:1px solid rgba(255,255,255,.1); border-radius:24px; padding:24px`  
Animação entrada: `@keyframes modalIn { from{transform:scale(.95) translateY(8px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }` — `0.22s ease`

**Campos:**

1. **Produto** — chips dos produtos mais usados (ordenados por frequência) + opção "＋ outro" que abre um `<select>` com todos os produtos. Chip selecionado: `background:#ffe04d; border:1.6px solid #33312e; border-radius:14px; padding:5px 11px; font-weight:700`
2. **Quantidade** — `<input inputmode="decimal">` aceita vírgula como separador
3. **Unidade** — chips: `unidade(s)` · `kg` · `gramas` · `litros`. Ao selecionar produto, pré-preenche com a unidade padrão do produto.
4. **Valor calculado** (somente leitura, exibido em destaque):
   - Container: `background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:14px; padding:14px 16px`
   - Fórmula exibida: `R$ preço × quantidade`
   - Valor: `font-size:24px; font-weight:800; color:#ffb38a`
   - Exibe "R$ —" se produto ou quantidade não preenchidos
5. **Motivo** — chips rápidos + campo de texto livre abaixo
   - Chips: `Erro de montagem` · `Queimou / estragou` · `Caiu no chão` · `Sobra` · `Validade vencida` · `Outro`
   - Chip inativo: `background:rgba(255,255,255,.07); border:1.5px solid rgba(255,255,255,.14); border-radius:30px; padding:7px 12px; font-size:12.5px; font-weight:600`
   - Chip ativo: `background:rgba(255,138,76,.25); border:1.5px solid #ff8a4c; color:#ffd9c2; border-radius:30px; padding:7px 12px; font-weight:700`
   - Clicar num chip preenche o texto; digitar no campo deseleciona o chip

#### Mobile — Passo a passo (bottom-sheet)

3 passos sequenciais em bottom-sheet que desliza de baixo:

**Passo 1 — Produto**
- Lista de produtos com busca
- Produto selecionado destacado em `background:#fffae0; border:1.5px solid #ffe04d`

**Passo 2 — Quantidade + Motivo**
- Input de quantidade + select de unidade
- Chips de motivo (os mesmos do desktop)
- Valor calculado exibido em destaque no rodapé do passo

**Passo 3 — Confirmar**
- Resumo: produto · quantidade · motivo · valor calculado
- Botão "✓ Confirmar" e link "Cancelar"

**Indicador de progresso:** 3 bolinhas no topo do sheet — bolinha ativa em `#d9542b`, inativas em `border:1.4px solid #b9b09c`

**Ao confirmar (ambos os fluxos):**
1. Cria `{ id, productId, qty, unit, motivo, ts: Date.now() }`
2. Fecha o modal / bottom-sheet
3. Navega para a aba Monitor
4. Recalcula KPIs e painéis imediatamente
5. Exibe toast de confirmação
6. Marca o novo lançamento com badge "NOVO"

**Validações:** produto obrigatório · quantidade > 0 · motivo usa "Outro" se vazio

---

### 5. Página Produtos — Grade de Cards (Decisão 4-B)

`max-width: 980px; margin: 0 auto; padding: 28px 22px 0`

**Header:**
- Título: `font-size:26px; font-weight:800`
- Campo de busca: filtra em tempo real por nome
- Botão "＋ Novo": abre modal de cadastro

**Grade:**
- `display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:11px`
- Cada card: `border:1.8px solid #33312e; border-radius:13px; background:#fffdf7; padding:11px; box-shadow:3px 4px 0 rgba(51,49,46,.10)` (no hi-fi: `background:#0b1330; border:1px solid rgba(255,255,255,.08); border-radius:16px`)
  - Placeholder de imagem: `height:38px; border:1.4px dashed rgba(255,255,255,.2); border-radius:8px; margin-bottom:7px`
  - Nome: `font-size:15px; font-weight:700`
  - Unidade + preço: `font-size:14px; font-weight:600; color:rgba(255,255,255,.65)`
  - Categoria: `font-size:12px; color:rgba(255,255,255,.45)`
  - Clicar no card abre o modal de edição pré-preenchido
- **Card "＋ novo produto"**: `border:2px dashed #d9542b; background:rgba(255,138,76,.08); color:#b8431f` — abre modal de cadastro

**Modelo de dados:**
```typescript
interface Product {
  id: string;
  name: string;
  unit: 'un' | 'kg' | 'g' | 'L';
  price: number; // R$ por unidade — base do cálculo automático
  cat?: string;  // categoria opcional
}
```

---

### 6. Página Equipe — Lista (Decisão 5-A)

`max-width: 780px; margin: 0 auto; padding: 28px 22px 0`

**Header:** título + contador "X ativos · Y no total" + botão "＋ Novo funcionário"

**Lista:** `display:flex; flex-direction:column; gap:10px`

Cada card: `display:flex; align-items:center; gap:14px; background:#0b1330; border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:13px 16px`
- Avatar `44×44` circular, cor varia por índice: `['#ff8a4c','#3b82f6','#14b8a6','#7c3aed','#fb6a5a','#f59e0b']`, exibe inicial do nome
- Nome: `font-size:16px; font-weight:700`
- Função: `font-size:12.5px; color:rgba(255,255,255,.55)`
- Badge ativo: `background:rgba(52,211,153,.16); color:#34d399; border:1px solid rgba(52,211,153,.4); border-radius:30px; padding:4px 11px; font-size:11px; font-weight:800`
- Badge inativo: `background:rgba(255,255,255,.08); color:rgba(255,255,255,.5); border:1px solid rgba(255,255,255,.16)`
- Botão "Ativar/Desativar" + botão ✎ editar

**Modelo de dados:**
```typescript
interface Employee {
  id: string;
  name: string;
  role: 'Atendente' | 'Cozinha' | 'Caixa' | 'Gerente';
  active: boolean;
}
```

---

### 7. Login — Descartado

Sistema aberto, sem autenticação. Não implementar tela de login.

> ❌ **DECISÃO REVERTIDA.** O sistema tem hoje **login por PIN de 6 dígitos** com
> dois perfis (funcionário/gestor) e **RLS por papel** no Postgres — a "abertura"
> significava, na prática, banco aberto na internet, já que a `anon key` vai no
> bundle. Ver [plano-seguranca.md](plano-seguranca.md).

---

### 8. Página Pratos — Ficha Técnica / Precificação (Nova)

**Acesso:** restrito à gestora. O usuário dela precisa estar autenticado/identificado como gestora para ver a aba "Pratos" na navegação e acessar as rotas dessa página — todo o resto do sistema continua aberto. Se o app ainda não tem nenhum tipo de identificação de usuário, este é o primeiro ponto que exige um (ex: um simples seletor de perfil ou um login mínimo só para a gestora).

Esta página cadastra **pratos prontos** (produtos compostos por vários ingredientes, ex: "Costela com Requeijão") calculando custo total e preço de venda sugerido — diferente da página **Produtos**, que cadastra itens/ingredientes individuais avulsos.

#### 8.1 Lista de pratos

`max-width: 900px; margin: 0 auto; padding: 32px 28px 0`

- Header: título "Pratos prontos" (`font-size:28px; font-weight:800; letter-spacing:-.02em`) + subtítulo contador "N pratos cadastrados · ficha técnica e precificação · acesso restrito à gestão" (`font-size:13px; font-weight:500`)
- Badge "GESTOR": `font-size:11px; font-weight:800; letter-spacing:.08em; border-radius:30px; padding:7px 14px` — mesma cor de destaque (accent) usada nos badges ativos do resto do sistema
- Botão "＋ Novo prato": mesmo gradiente do CTA principal (`linear-gradient(135deg,#f5a020,#c42208)` no protótipo — ajustar para o gradiente accent-orange/red já usado no restante do app), `border-radius:10px; height:40px; font-weight:800`
- Estado vazio: card centralizado com texto "Nenhum prato cadastrado ainda."
- Lista: `display:flex; flex-direction:column; gap:8px`. Cada linha (card `border-radius:14px; padding:14px 16px`):
  - Nome do prato (`font-size:15px; font-weight:700`)
  - Linha secundária: "Custo R$ X · markup Yx" (`font-size:12px; font-weight:500`, cor secundária)
  - Preço de venda em destaque à direita (`font-size:17px; font-weight:800`, cor accent-verde/laranja)
  - Botão ✎ editar e botão 🗑 excluir (ambos `36×36`, estilo botão secundário do resto do app)
  - Clicar na linha (fora dos botões) também pode abrir a edição

#### 8.2 Ficha (criar/editar prato)

`max-width: 820px; margin: 0 auto; padding: 28px 28px 40px`

**Header:** botão voltar (←) + ícone de prato (mesmo padrão dos ícones de seção do resto do app) + título "Ficha Técnica / Precificação" + subtítulo "pratos prontos" + badge "GESTOR" à direita.

**Bloco 1 — Nome do prato**
Card com label uppercase "Nome do prato" + input texto grande (`font-size:16px; font-weight:700`).

**Bloco 2 — Ingredientes**
Card contendo:

- Cabeçalho do bloco: título "Ingredientes" + **toggle "Calcular perda"** à direita.
  - Este toggle é **global para a ficha inteira** (não por ingrediente) — ao ativar, habilita o cálculo de perda em todos os ingredientes da lista.
  - Toggle: trilha `40×22px border-radius:30px`, ligado = cor accent, desligado = cinza neutro; knob `18×18px` circular branco que deslila de `left:2px` para `left:20px`.
- Grid de colunas (linha de cabeçalho, uppercase, `font-size:10px; font-weight:700; letter-spacing:.1em`): **Ingrediente · Tipo · Valor · Qtd · Custo**. Grid: `grid-template-columns: 1.6fr 1fr .8fr .7fr 1.1fr; gap:8px`.
- Uma linha por ingrediente:
  - Input texto — nome do ingrediente
  - Select — **Tipo**: `custo fixo` · `por kg` · `por grama` · `por litro` · `por mL` · `unidade`
  - Input numérico — **Valor** (preço unitário conforme o tipo: R$ fixo, R$/kg, R$/g, R$/L, R$/mL, R$/unidade)
  - Input numérico — **Qtd** (quantidade usada no prato, na mesma unidade do tipo — para `kg`/`L` a quantidade é digitada em **gramas/mL** e o sistema converte por 1000 internamente; para os demais tipos a quantidade é digitada na própria unidade)
  - Custo calculado (somente leitura, destacado em verde): `valor × qtd`, dividido por 1000 quando o tipo é `kg` ou `L`
  - Botão de perda (aparece **somente quando o toggle "Calcular perda" está ativo**): ícone ▾/▴ pequeno (`28×28px`) que expande/recolhe uma linha extra abaixo, por ingrediente
  - Botão 🗑 excluir a linha
  - **Linha expandida de perda** (quando o botão está aberto): 3 campos lado a lado dentro de uma faixa com fundo levemente destacado —
    - **Peso bruto (kg)** — peso comprado
    - **Peso líquido (kg)** — peso aproveitável após limpeza/preparo
    - **Perda** (somente leitura) — calculada como `((bruto - líquido) / bruto) × 100`, exibida em % com 1 decimal; cor verde se ≤15%, vermelha se >15% (limiar de alerta, ajustável); mostra "—" enquanto os dois pesos não estiverem preenchidos
    - **Efeito no custo:** quando a perda está preenchida (bruto e líquido > 0), o custo do ingrediente exibido/usado no cálculo do prato passa a ser `custoBase × (pesoBruto / pesoLíquido)` — ou seja, o sistema paga o ingrediente pelo peso bruto mas rende o peso líquido, encarecendo o custo proporcionalmente à perda. Sem perda preenchida, usa o custo base normal.
- Botão "＋ Adicionar ingrediente" abaixo da lista, mesmo estilo secundário do resto do app.

**Bloco 3 — Embalagem e margem** (dois cards lado a lado, `grid-template-columns: 1fr 1fr`)
- Card "Embalagem (R$)": input numérico, custo fixo de embalagem somado ao total
- Card "Margem sobre o custo (%)": input numérico, percentual de markup aplicado sobre o custo total

**Bloco 4 — Resultado** (card de destaque, gradiente verde/teal, mesmo padrão visual dos KPI cards do dashboard)
- "Custo dos ingredientes" — soma de todos os custos de ingrediente (já considerando perda, se ativa)
- "+ Embalagem"
- Linha divisória
- "Total custo" = ingredientes + embalagem
- Linha divisória
- "Preço de venda sugerido" em destaque (`font-size:36px; font-weight:800`) = `total custo × (1 + margem/100)`
- À direita do preço: "Markup: N,NNx" (`preço / custo`) e "Margem s/venda: N%" (`(preço - custo) / preço`)

**Rodapé:** botão "Cancelar" (secundário, volta para a lista sem salvar) + botão "Salvar prato" (primário, gradiente accent) — validação mínima: nome do prato obrigatório.

#### Modelo de dados

```typescript
interface DishIngredient {
  id: string;
  name: string;
  type: 'fixo' | 'kg' | 'g' | 'L' | 'mL' | 'un';
  value: number;      // preço unitário conforme "type"
  qty: number;        // quantidade usada (g/mL quando type é kg/L)
  grossWeightKg?: number;  // peso bruto, só relevante se perda ativa
  netWeightKg?: number;    // peso líquido, só relevante se perda ativa
}

interface Dish {
  id: string;
  name: string;
  trackLoss: boolean;         // estado do toggle "Calcular perda" (nível da ficha)
  ingredients: DishIngredient[];
  packagingCost: number;      // R$
  marginPct: number;          // % sobre o custo
}
```

**Cálculo de custo por ingrediente:**
```
baseCost = value * qty / (type === 'kg' || type === 'L' ? 1000 : 1)
finalCost = (trackLoss && grossWeightKg > 0 && netWeightKg > 0)
  ? baseCost * (grossWeightKg / netWeightKg)
  : baseCost
```

**Cálculo do prato:**
```
ingredientsCost = sum(finalCost de cada ingrediente)
totalCost = ingredientsCost + packagingCost
suggestedPrice = totalCost * (1 + marginPct / 100)
markup = suggestedPrice / totalCost
marginOnSale = (suggestedPrice - totalCost) / suggestedPrice
```

**Persistência:** lista de `Dish` associada à conta/perfil da gestora — apenas ela deve conseguir listar, criar, editar e excluir pratos. Recomenda-se uma tabela `dishes` (+ `dish_ingredients` relacionada ou coluna JSON) com RLS/regra de acesso restrita ao papel de gestora no backend (não apenas escondendo a aba no front-end).

---

## Modais

**Overlay:** `position:fixed; inset:0; z-index:50; background:rgba(5,8,22,.68); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center`  
Animação: `@keyframes overlayIn { from{opacity:0} to{opacity:1} }` — `0.2s ease`

**Container:** `background-color:#141d45; border:1px solid rgba(255,255,255,.1); border-radius:24px; padding:24px; box-shadow:0 30px 90px rgba(0,0,0,.55)`  
Animação: `@keyframes modalIn { from{transform:scale(.95) translateY(8px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }` — `0.22s ease`

**Fechar:** click no overlay · botão ✕ (`background:rgba(255,255,255,.08); border-radius:10px; width:34px; height:34px`)

**Campos (padrão):**
```css
background: rgba(255,255,255,.06);
border: 1.5px solid rgba(255,255,255,.16);
border-radius: 12px;
padding: 13px 14px;
color: #fff;
font-size: 15px;
font-weight: 600;
outline: none;
width: 100%;
```
Labels: `font-size:12px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:rgba(255,255,255,.55); display:block; margin-bottom:7px`

**Botão primário:** `background:linear-gradient(135deg,#ff8a4c,#f0464e); color:#fff; border:none; border-radius:14px; padding:13px; font-weight:800; font-size:15px; box-shadow:0 8px 22px rgba(240,70,78,.35)`

**Botão secundário:** `background:rgba(255,255,255,.08); color:#fff; border:1.5px solid rgba(255,255,255,.16); border-radius:14px; padding:13px; font-weight:700; font-size:15px`

### Modal — Produto

**Largura:** `min(430px, 94vw)` | Campos: Nome · Unidade padrão · Preço (R$/unidade) · Categoria (opcional)

### Modal — Funcionário

**Largura:** `min(410px, 94vw)` | Campos: Foto (upload) · Nome · Função (select) · Toggle Ativo

**Toggle Ativo:**
- Trilha ativa: `background:#34d399; width:46px; height:26px; border-radius:30px`
- Trilha inativa: `background:rgba(255,255,255,.18)`
- Knob: `width:20px; height:20px; border-radius:50%; background:#fff; left:23px` (ativo) / `left:3px` (inativo)

---

## Toast de Confirmação

- `position:fixed; left:50%; bottom:26px; transform:translateX(-50%); z-index:60`
- `background:#0e1638; border:1px solid rgba(255,255,255,.14); border-radius:16px; padding:14px 20px; box-shadow:0 18px 50px rgba(0,0,0,.5)`
- Animação: `@keyframes toastIn { from{transform:translateY(22px);opacity:0} to{transform:translateY(0);opacity:1} }` — `0.25s ease`
- Ícone ✓: `width:34px; height:34px; border-radius:50%; background:#34d399; color:#063; font-weight:800`
- **Auto-dismiss:** 2800ms

---

## Interações & Comportamento

| Ação | Resultado |
|------|-----------|
| Clicar/tocar "Registrar" (top bar / FAB) | Abre modal de registrar |
| Confirmar lançamento | Fecha modal → Monitor → recalcula KPIs → badge NOVO → toast |
| Clicar em tab | Troca a view mantendo estado |
| Clicar fora do modal | Fecha o modal |
| Clicar card de produto | Abre modal de edição pré-preenchido |
| Clicar card "＋ novo produto" | Abre modal de cadastro em branco |
| Clicar ✎ em funcionário | Abre modal de edição pré-preenchido |
| Ativar/Desativar funcionário | Toggle imediato |
| Digitar no campo de busca | Filtra a grade em tempo real |
| Relógio AO VIVO | Atualiza a cada 1 segundo |

---

## Estado da Aplicação

```typescript
interface AppState {
  page: 'monitor' | 'produtos' | 'equipe' | 'pratos';
  modal: 'registrar' | 'produto' | 'funcionario' | null;
  editProdId: string | null;
  editFuncId: string | null;

  // pratos (restrito à gestora)
  pratosView: 'lista' | 'ficha';
  editingDishId: string | null;
  dishes: Dish[];

  // form: registrar
  rProd: string;
  rQty: string;
  rUnit: string;
  rMotivo: string;

  // form: produto
  pName: string; pUnit: string; pPrice: string; pCat: string;

  // form: funcionário
  fName: string; fRole: string; fActive: boolean;

  // ui
  pSearch: string;
  toast: { msg: string; sub: string } | null;
  now: number; // timestamp p/ o relógio

  // dados
  products: Product[];
  employees: Employee[];
  launches: Launch[];
}

interface Launch {
  id: string;
  productId: string;
  qty: number;
  unit: string;
  motivo: string;
  ts: number;
}
```

**Persistência:** o protótipo usa estado em memória. Na produção, `products`, `employees` e `launches` devem vir de um banco de dados. **Supabase** (PostgreSQL + Realtime) é ideal — as subscriptions WebSocket tornam o dashboard verdadeiramente ao vivo entre múltiplas sessões/telas.

---

## Tokens de Design

### Cores

| Token | Valor | Uso |
|-------|-------|-----|
| Background app | `radial-gradient(130% 100% at 50% -10%, #1f2a5e, #131c45, #0b1230)` | Fundo global |
| Surface card dark | `#0b1330` | Cards de painel, linhas de tabela |
| Surface modal | `#141d45` | Background dos modais |
| Top bar | `rgba(9,13,36,.78)` | Navbar sticky |
| Accent orange | `#ff8a4c` | CTAs, destaques |
| Accent red | `#f0464e` / `#ef4459` | Gradiente CTA, card "hoje" |
| Accent blue | `#3b82f6` / `#1d4ed8` | Card "mês" |
| Accent teal | `#14b8a6` / `#0e8e87` | Card "média" |
| Accent purple | `#7c3aed` / `#5a24c0` | Painel produtos |
| Accent coral | `#fb6a5a` / `#e0344a` | Painel motivos |
| Green live | `#34d399` | Status ativo, badge NOVO, toast |
| Brand name | `#ffb066` | "Petiscaria Aquino" no header |
| Value color | `#ffb38a` | Valores monetários nos lançamentos |
| Text primary | `#ffffff` | |
| Text secondary | `rgba(255,255,255,.55)` | |
| Text muted | `rgba(255,255,255,.4)` | |
| Border subtle | `rgba(255,255,255,.08)` | |
| Border input | `rgba(255,255,255,.16)` | Inputs e selects |

### Tipografia

| Uso | Size | Weight |
|-----|------|--------|
| Valor KPI hero | 46px | 800 |
| Título de página | 26px | 800 |
| Título de modal | 20px | 800 |
| Nome produto/func. | 15–16px | 700 |
| Corpo / painel | 14px | 600–700 |
| Label de campo | 12px | 700 (uppercase) |
| Badge / tag | 9–11px | 800 |

### Border Radius

| Elemento | Valor |
|----------|-------|
| KPI cards, painéis, modais | `22–24px` |
| Cards de produto | `16px` |
| Card equipe | `16px` |
| Inputs e selects | `12px` |
| Botões principais | `12–14px` |
| Chips de produto/motivo | `30px` |
| Avatar | `50%` |

### Sombras

| Elemento | Sombra |
|----------|--------|
| Card "hoje" | `0 18px 40px rgba(239,68,89,.28)` |
| Card "mês" | `0 18px 40px rgba(37,99,235,.28)` |
| Card "média" | `0 18px 40px rgba(20,184,166,.26)` |
| Painel purple | `0 18px 40px rgba(124,58,237,.24)` |
| Painel coral | `0 18px 40px rgba(224,52,74,.24)` |
| Botão CTA | `0 8px 22px rgba(240,70,78,.35)` |
| Modal | `0 30px 90px rgba(0,0,0,.55)` |
| Toast | `0 18px 50px rgba(0,0,0,.5)` |

### Animações CSS

```css
@keyframes livedot {
  0%, 100% { opacity: 1; }
  50% { opacity: .2; }
}
@keyframes toastIn {
  from { transform: translateY(22px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes modalIn {
  from { transform: scale(.95) translateY(8px); opacity: 0; }
  to   { transform: scale(1)   translateY(0);   opacity: 1; }
}
@keyframes overlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

---

## Assets

- **Fonte:** Plus Jakarta Sans — `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800`
- **Ícones:** SVGs inline (sem biblioteca externa) — lixeira, lista, gráfico, alerta, relógio, lupa, `+`
- **Imagens:** nenhuma — avatares usam inicial + cor sólida por índice

---

## Arquivos neste Pacote

| Arquivo | Descrição |
|---------|-----------|
| `Monitor de Desperdício.dc.html` | Protótipo hi-fi completo e funcional — inclui Monitor, Produtos, Equipe e a nova aba Pratos |
| `Wireframes — Monitor de Desperdício.dc.html` | Board de wireframes com as decisões finais confirmadas (Monitor/Produtos/Equipe/Login — anterior à aba Pratos) |
| `README.md` | Este documento |

> **Nota:** Para abrir os `.dc.html` localmente você precisa do ambiente de preview do Anthropic Workbench (eles dependem de `support.js`). Use-os como **referência visual** abrindo no Workbench, e implemente o equivalente no seu framework.

---

## Prompt de Kickoff para o Claude Code

Cole este bloco no início da conversa com o Claude Code, junto com screenshots do protótipo:

```
Preciso implementar o sistema "Monitor de Desperdício" da Petiscaria Aquino.

Stack desejada: [Next.js 14 + Tailwind + Supabase] (ajuste conforme seu projeto)

O handoff completo está no README anexo. Resumo rápido:
- Dashboard ao vivo (3 KPIs + 3 painéis que recalculam a cada lançamento)
- Modal de registrar desperdício: produto (chips) + quantidade + unidade + motivo (chips) — valor calculado automaticamente pelo sistema (preço × qtd)
- Grade de cards de produtos + modal de cadastro
- Lista de equipe + modal com toggle ativo/inativo
- Aba "Pratos" (restrita à gestora): lista de pratos prontos + ficha técnica/precificação com ingredientes, toggle opcional "Calcular perda" (peso bruto/líquido por ingrediente), embalagem, margem e preço de venda sugerido
- Sem login geral — sistema aberto, exceto a aba Pratos que exige identificação da gestora

Comece criando o schema do banco de dados (tabelas: products, employees, launches, dishes, dish_ingredients) e os tipos TypeScript. Depois implemente o dashboard com as subscriptions Supabase Realtime para o update ao vivo. Para a aba Pratos, implemente a restrição de acesso no backend (RLS ou equivalente), não só escondendo a aba no front-end.
```

---

## Próximos Passos Sugeridos

1. **Schema do banco:** tabelas `products`, `employees`, `launches` (ver modelos TypeScript acima)
2. **Supabase Realtime:** subscription em `launches` → recalcula os KPIs no cliente sem polling
3. **Persistência do badge "NOVO":** comparar `ts` do lançamento com `lastVisit` do usuário (localStorage)
4. **Upload de foto:** Supabase Storage ou S3 para o campo de foto dos funcionários
5. **PWA / mobile:** manifesto + service worker para o uso no balcão como app instalado
