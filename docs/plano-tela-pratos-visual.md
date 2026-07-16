# Plano Visual & Estrutural — Tela "Pratos" (Ficha Técnica / Precificação)

> **Escopo deste documento:** apenas a camada **visual e estrutural** (layout, tokens,
> componentes, responsividade, navegação, estados de UI). A **lógica de cadastro,
> cálculo, persistência e permissão de acesso** fica para outro agente — ver
> [plano-tela-pratos-logica.md](plano-tela-pratos-logica.md) (handoff no fim deste doc).
>
> Fontes: [README-tela-pratos.md](README-tela-pratos.md) §8, `Monitor de Desperdício.dc.html`
> (protótipo hi-fi) e `Wireframes — Monitor de Desperdício.dc.html`.
> Referências do projeto: [arquitetura.md](arquitetura.md), [src/index.css](../src/index.css),
> [src/pages/Produtos.tsx](../src/pages/Produtos.tsx), [src/pages/Monitor.tsx](../src/pages/Monitor.tsx),
> [src/App.tsx](../src/App.tsx).

---

## 1. Princípio de adaptação

Os três docs de handoff foram desenhados sobre uma **paleta azul/navy**
(`#1f2a5e → #0b1230`, cards `#0b1330`, modais `#141d45`). **O projeto real já
divergiu disso**: roda uma paleta **quente escura/laranja** ("uima FDD"),
100% dirigida por variáveis CSS em [src/index.css](../src/index.css), com **dois
temas** (claro/escuro) e primitivas reutilizáveis.

> **Regra de ouro:** seguimos a **estrutura e a hierarquia visual** dos docs, mas
> **toda cor vem de token do projeto** (`var(--…)`). Nenhum hex azul do protótipo
> entra no código. Nenhuma cor fixa nova é introduzida sem virar token antes.

### 1.1 Mapa de tradução (protótipo azul → token oficial)

| Papel no protótipo | Cor no doc (azul) | Token oficial a usar |
|---|---|---|
| Fundo da página | `#131c45` radial | `var(--bg-app)` (já é o fundo do `<main>`) |
| Card / painel / bloco | `#0b1330` | `.panel` (`var(--surface)` + `var(--bd-07)`) |
| Superfície de modal | `#141d45` | `var(--surface-2)` |
| Input elevado | `rgba(255,255,255,.06)` | classe `.field` (`var(--surface)` + `var(--bd-15)`) |
| Texto primário | `#fff` | `var(--tx)` / util `text-white` (remapeado no light) |
| Texto secundário | `rgba(255,255,255,.55)` | `var(--tx-55)` / `text-white/55` |
| Label uppercase | `rgba(255,255,255,.55)` | `var(--tx-50)` |
| Borda sutil | `rgba(255,255,255,.08)` | `var(--bd-07/08)` |
| CTA / gradiente accent | `linear-gradient(135deg,#f5a020,#c42208)` | `var(--accent-grad)` → classe `.btn-accent` |
| Badge "GESTOR" (destaque ativo) | verde/amarelo | `var(--live-green)` + fundo `rgba(52,211,153,.14)` (mesmo padrão do badge "ativo" da Equipe) |
| Custo calculado (verde ok) | verde | `var(--live-green)` |
| Preço de venda (hero card) | gradiente verde/teal | **`var(--accent-grad)`** (ver decisão §5.5) |
| Perda ≤ limiar | verde | `var(--live-green)` |
| Perda > limiar (alerta) | vermelho | `var(--red)` |
| Toggle ligado | accent | `var(--accent-grad)` (mesmo toggle do modal de Produto) |
| Toggle desligado | cinza | `var(--w-15)` |

Como todos os componentes leem `var(--…)`, o resultado nasce **compatível com os
dois temas** automaticamente — inclusive o comportamento do `.panel`, que no tema
claro vira laranja "cheio" e remapeia os textos para claro sem tocar em cada
elemento (ver [src/index.css](../src/index.css) l.150-208).

---

## 2. Estrutura de arquivos e rotas

Seguindo o padrão de `src/pages/*` + rota em [src/App.tsx](../src/App.tsx). A aba
tem **dois modos de exibição** (lista ↔ ficha), exatamente como o protótipo
(`pratosView: 'lista' | 'ficha'`).

```
src/
  pages/
    Pratos.tsx          # container da aba: alterna lista ↔ ficha (view-switch local)
  components/
    pratos/
      ListaPratos.tsx   # §3 — lista de fichas + estado vazio
      FichaPrato.tsx    # §4 — criar/editar (blocos 1–4 + rodapé)
      LinhaIngrediente.tsx  # §4.2 — uma linha da grade + faixa de perda expansível
      ResultadoPrato.tsx    # §4.4 — card hero de resultado
      BadgeGestor.tsx   # badge "GESTOR" reutilizável (lista e ficha)
```

> **Por que view-switch local e não rota nova para a ficha:** o resto do app usa
> react-router só para as abas de topo; modais e sub-telas são estado local
> (ver `RegistrarModal`, `ModoExibicao`). A ficha é uma sub-tela da aba Pratos,
> então mora em estado da própria `Pratos.tsx` (`view`, `editingDishId`),
> espelhando o `pratosView`/`editingDishId` do protótipo e do `AppState` do README.

### 2.1 Navegação (top bar + bottom nav)

Em [src/App.tsx](../src/App.tsx), o array `NAV` (l.33-38) hoje tem 4 abas
(Monitor, Produtos, Equipe, Motivos). **Pratos entra como 5ª aba**, com ícone
inline no mesmo padrão dos demais (`ic` spread, stroke `currentColor`):

```tsx
const IconPratos = (p: IconProps) => (
  // prato + talheres (24×24, stroke currentColor, strokeWidth 2)
  <svg {...ic} {...p}><path d="M4 3v7a3 3 0 0 0 6 0V3" /><path d="M7 10v11" />
    <path d="M17 3c-1.7 0-3 2-3 5s1 4 3 4 3-1 3-4-1.3-5-3-5z" /><path d="M17 12v9" /></svg>
)
```

- **Desktop:** o item entra na lista de tabs; só é **renderizado** quando o
  perfil ativo é gestor (gating — §2.2). Estilo idêntico ao dos outros `NavLink`
  (ativo = `var(--accent-grad)` + sombra; inativo = `text-white/55`).
- **Mobile (bottom nav):** hoje são 4 itens dividindo `flex-1`. Com Pratos vira 5
  — cabe, mas o rótulo encurta (padrão já usa `text-[10px]`). Para a gestora, o
  bottom nav mostra 5 ícones; para os demais, 4 (Pratos oculto).

> **Observação de largura:** 5 itens no bottom nav em telas ~360px ficam
> apertados. Recomendação visual: manter ícone + rótulo curto ("Pratos"), e não
> adicionar FAB novo (o FAB `＋ Registrar` continua o mesmo). Se ficar justo,
> alternativa é agrupar "Equipe/Motivos/Pratos" atrás de um item "Mais", mas
> **só se** os testes de uso mostrarem aperto — não implementar preventivamente.

### 2.2 Gating visual da aba (só estrutura)

- A aba e a rota `/pratos` **só existem** para o perfil gestor. Visualmente:
  - `NAV` filtra o item Pratos por `ehGestor`.
  - A `<Route path="/pratos">` é montada condicionalmente; acesso direto por URL
    sem ser gestor cai no `Navigate to="/monitor"` (fallback `path="*"` já existe).
- O sinal `ehGestor` vem de `funcionarios.papel === 'gestor'` cruzado com o
  `funcionarioId` do [useFuncionarioAtual](../src/hooks/useFuncionarioAtual.ts).
  **A regra de verdade (RLS/identificação real) é responsabilidade do outro
  agente** — aqui só descrevemos o que mostrar/esconder. Esconder no front **não
  é** segurança; é UX.

---

## 3. Tela 8.1 — Lista de pratos

Container: `mx-auto max-w-3xl space-y-5 px-4 py-8` (alinha com `max-width:900px`
do doc e com o padrão das outras páginas).

### 3.1 Header

```
┌───────────────────────────────────────────────────────────┐
│ Pratos prontos                           [GESTOR]  [＋ Novo prato] │
│ N pratos cadastrados · ficha técnica e precificação             │
└───────────────────────────────────────────────────────────┘
```

- Título: `text-[26px] font-extrabold tracking-tight` cor `var(--tx)`.
- Subtítulo/contador: `text-[13px] font-medium` cor `var(--tx-50)`.
- **Badge GESTOR** (`BadgeGestor`): `text-[11px] font-extrabold tracking-[.08em]
  rounded-full px-3.5 py-1.5`, fundo `rgba(52,211,153,.14)`, borda
  `1px solid rgba(52,211,153,.4)`, texto `var(--live-green)` — **mesmo padrão do
  badge "ativo" da Equipe** (consistência com o resto do sistema).
- **Botão "＋ Novo prato":** classe `.btn-accent`, `rounded-xl px-4 h-10
  font-extrabold` (gradiente accent do projeto, **não** o `#f5a020→#c42208` do
  protótipo).

### 3.2 Lista de linhas

`flex flex-col gap-2`. Cada card usa `.panel rounded-2xl px-4 py-3.5` (o doc pede
`14px/14-16px`; arredondamos para o raio 2xl padrão das superfícies do app):

```
┌──────────────────────────────────────────────────────────┐
│ Costela com Requeijão                    R$ 42,90   ✎  🗑 │
│ Custo R$ 17,16 · markup 2,5x                              │
└──────────────────────────────────────────────────────────┘
```

- Nome do prato: `text-[15px] font-bold` `var(--tx)`.
- Linha secundária "Custo R$ X · markup Yx": `text-xs font-medium` `var(--tx-50)`.
- **Preço de venda** (destaque à direita): `text-[17px] font-extrabold
  tabular-nums` cor `var(--orange)` (é o "valor monetário em destaque" do
  sistema — mesmo tratamento dos valores no Monitor/Produtos).
- Botões `✎` e `🗑`: `36×36`, `rounded-lg`, `border 1px solid var(--bd-08)`,
  ícone `var(--tx-30)`; hover → editar tende a `var(--orange)`, excluir a
  `var(--red)` — **exatamente o par de botões da lista "Últimos lançamentos"** do
  Monitor ([Monitor.tsx](../src/pages/Monitor.tsx) l.343-364). Reaproveitar esses
  SVGs (lápis e lixeira).
- A linha inteira (fora dos botões) é clicável e abre a edição (`role="button"`,
  foco por teclado).

### 3.3 Estado vazio

Card centralizado `.panel rounded-2xl p-8 text-center`:
- Ícone de prato `var(--tx-25)`, texto "Nenhum prato cadastrado ainda."
  `text-sm text-white/40`, e um "＋ Novo prato" secundário abaixo.
- Segue o tom dos vazios já usados (`text-white/30`, mensagem curta).

### 3.4 Loading

Skeletons `h-16 animate-pulse rounded-2xl` com `background: var(--surface)`,
igual ao padrão de Produtos/Monitor (l.153-156 / l.220-230).

---

## 4. Tela 8.2 — Ficha (criar / editar prato)

Container: `mx-auto max-w-2xl space-y-4 px-4 py-8` (doc: `max-width:820px`).
Blocos empilhados; cada bloco é um `.panel rounded-2xl p-5`.

### 4.1 Header da ficha

```
[←]  🍽  Ficha Técnica / Precificação                     [GESTOR]
         pratos prontos
```

- Botão voltar `←`: `36×36 rounded-lg border var(--bd-10)`, ícone `var(--tx-65)`
  → volta para a lista **sem salvar** (mesma semântica do "Cancelar").
- Ícone de seção: quadradinho `40×40 rounded-xl` com `background:
  var(--accent-grad)` e o ícone de prato em branco — **mesmo tratamento do logo/
  ícones de seção** (ver o quadrado do logo em App.tsx l.173).
- Título `text-xl font-extrabold`, subtítulo "pratos prontos" `text-xs
  text-white/45`. Badge GESTOR à direita (`BadgeGestor`).

### 4.2 Bloco 1 — Nome do prato

`.panel`, label uppercase (`text-[11px] font-bold uppercase tracking-wider
text-white/50`) + `input.field` grande (`text-base font-bold`). Reusa a classe
`.field` — placeholder "ex: Costela com Requeijão".

### 4.3 Bloco 2 — Ingredientes

Cabeçalho do bloco: título "Ingredientes" (`text-[15px] font-extrabold`) à
esquerda + **toggle "Calcular perda"** à direita.

**Toggle "Calcular perda"** — reaproveitar **exatamente** o toggle do modal de
Produto ([Produtos.tsx](../src/pages/Produtos.tsx) l.100-109):
- trilha `h-6 w-11 rounded-full`, ligado `background: var(--accent-grad)`,
  desligado `var(--w-15)`; knob `h-5 w-5 rounded-full bg-white`, `left: 22px`
  (on) / `2px` (off). É **global da ficha** (não por ingrediente).

**Grade de colunas** — linha de cabeçalho uppercase `text-[10px] font-bold
tracking-[.1em] text-white/40`:

```
grid-template-columns: 1.6fr 1fr .8fr .7fr 1.1fr auto;  gap: 8px
Ingrediente │ Tipo │ Valor │ Qtd │ Custo │ (ações)
```

**Uma linha por ingrediente** (`LinhaIngrediente`):
- Nome — `input.field` compacto (`py-2 text-sm`).
- Tipo — `select.field` (já estilizado no projeto com a setinha laranja custom):
  opções `custo fixo · por kg · por grama · por litro · por mL · unidade`.
- Valor — `input.field` `inputMode="decimal"`, mesma máscara de decimal usada em
  Produtos (`replace(/[^0-9.,]/g,'')`).
- Qtd — `input.field` `inputMode="decimal"`.
- **Custo** (somente leitura) — `text-sm font-extrabold tabular-nums` cor
  `var(--live-green)` (verde = valor calculado/ok, como no doc).
- Ações: botão de perda `▾/▴` (`28×28`, **só aparece com o toggle ligado**) +
  botão `🗑` (`28×28`) — estilo secundário (`border var(--bd-10)`), hover excluir
  → `var(--red)`.

**Linha expandida de perda** (quando o `▾` está aberto) — faixa com fundo
levemente destacado (`background: var(--surface-3)` ou `var(--w-05)`,
`rounded-xl p-3 mt-2`), 3 campos lado a lado:
- **Peso bruto (kg)** — `input.field`.
- **Peso líquido (kg)** — `input.field`.
- **Perda %** (somente leitura) — `text-sm font-extrabold`; cor condicional:
  `var(--live-green)` se ≤ limiar, `var(--red)` se acima; "—" enquanto os dois
  pesos não estiverem preenchidos. (O cálculo e o limiar são do outro agente;
  aqui só o tratamento visual dos dois estados.)

**Botão "＋ Adicionar ingrediente"** abaixo da lista: estilo **secundário**
(`border 1px solid var(--bd-15)`, `rounded-xl px-4 py-2.5 text-sm font-bold` cor
`var(--tx-72)`) — não é o accent (evita competir com "Salvar prato").

> **Responsivo (mobile):** a grade de 6 colunas não cabe em ~360px. Padrão
> visual: abaixo de `sm`, cada ingrediente vira um **mini-card** empilhado
> (`.panel`-interno `rounded-xl p-3`) com os campos em 2 colunas
> (Nome largo; Tipo/Valor/Qtd/Custo em grid 2×2) e as ações no topo direito. A
> faixa de perda continua expansível abaixo. A visão em grade só vale de `sm` pra
> cima.

### 4.4 Bloco 3 — Embalagem e margem

Dois cards lado a lado (`grid grid-cols-1 sm:grid-cols-2 gap-4`), cada um
`.panel rounded-2xl p-5`:
- **Embalagem (R$):** label uppercase + `input.field` `inputMode="decimal"`.
- **Margem sobre o custo (%):** idem.

### 4.5 Bloco 4 — Resultado (card hero)

Card de destaque, no padrão dos cards "cheios" do sistema:

```
┌──────────────────────────────────────────────────────────┐
│  Custo dos ingredientes                       R$ 15,16    │
│  + Embalagem                                  R$  2,00    │
│  ───────────────────────────────────────────────────────  │
│  Total custo                                  R$ 17,16    │
│  ───────────────────────────────────────────────────────  │
│  PREÇO DE VENDA SUGERIDO                                  │
│  R$ 42,90                     Markup: 2,50x               │
│                              Margem s/venda: 60%          │
└──────────────────────────────────────────────────────────┘
```

- Linhas de detalhe: `flex justify-between text-sm font-semibold py-1.5`, texto
  em `var(--tx-85)`; divisórias `border-top: 1px solid var(--bd-10)`.
- Label "PREÇO DE VENDA SUGERIDO": `text-[11px] font-bold uppercase
  tracking-[.1em]`.
- Preço hero: `text-4xl font-extrabold tabular-nums`.
- À direita: "Markup: N,NNx" e "Margem s/venda: N%" `text-xs font-semibold`.

### 4.6 Rodapé da ficha

`flex gap-3 pt-1`:
- **Cancelar** — secundário (`border var(--bd-15) text-white/60`), volta à lista.
- **Salvar prato** — `.btn-accent flex-1` (primário). Desabilita
  (`disabled:opacity-35`, já no `.btn-accent`) enquanto o nome estiver vazio.

---

## 5. Decisões de design (divergências conscientes do protótipo)

| # | Ponto | Protótipo | Decisão neste projeto | Motivo |
|---|---|---|---|---|
| 5.1 | Cor do botão "Novo prato" | `#f5a020→#c42208` | `.btn-accent` (accent oficial) | O próprio README §8.1 pede "ajustar para o gradiente accent já usado". |
| 5.2 | Badge GESTOR | verde/amarelo | verde `var(--live-green)` (padrão do badge "ativo") | Consistência com Equipe. |
| 5.3 | Custo/Perda ok | verde | `var(--live-green)` | Já é o verde semântico do sistema. |
| 5.4 | Raio dos cards de lista | `14px` | `rounded-2xl` (22px) | Alinha com as superfícies do app (KPIs/painéis). |
| **5.5** | **Card Resultado** | **gradiente verde/teal** | **`var(--accent-grad)` (laranja/vermelho) — ✅ DECIDIDO** | O sistema **não tem** paleta teal; o hero monetário do app é sempre accent laranja. Verde fica reservado a "valor calculado/ok" em pontos menores. Mantém a tela coesa com Monitor/Registrar. |

> **5.5 — DECIDIDO (accent laranja).** O card de Resultado usa `var(--accent-grad)`
> com o preço de venda em branco sobre o gradiente. A alternativa "verde de lucro"
> foi descartada em favor da coesão com o hero monetário do app.

---

## 6. Novos estilos a adicionar em `index.css`

O grosso reaproveita `.panel`, `.field`, `.btn-accent`, `.anim-pop`. Só é preciso
formalizar **um** utilitário novo (para não repetir inline):

```css
/* Badge de perfil / status verde (GESTOR, ativo) — já existe o padrão inline;
   opcional extrair p/ classe se for reusar em Equipe também */
.badge-live {
  color: var(--live-green);
  background: rgba(52, 211, 153, .14);
  border: 1px solid rgba(52, 211, 153, .40);
  border-radius: 30px;
}
```

Nada mais é necessário: toggle, inputs, selects, botões e superfícies já têm
token/classe. **Não introduzir hex novos** — se algo faltar, criar token em
ambos os temas (`dark` e `light`) primeiro.

---

## 7. Responsividade — resumo

| Faixa | Lista (8.1) | Ficha (8.2) |
|---|---|---|
| `< sm` (mobile) | 1 coluna, cards full-width; header empilha (título → contador → ações) | Ingredientes viram mini-cards empilhados (§4.3); blocos 100% largura; Embalagem/Margem 1 coluna |
| `≥ sm` (tablet) | mesma lista, mais respiro | grade de 6 colunas nos ingredientes; Embalagem/Margem 2 colunas |
| `≥ lg` / TV | `max-w-3xl` / `max-w-2xl` centralizado | idem |

Bottom nav ganha o 5º item **só para gestora**; top bar idem.

---

## 8. Acessibilidade

- Toggle "Calcular perda": `role="switch"` + `aria-checked`.
- Botões de ícone (voltar, editar, excluir, expandir perda): `aria-label`
  explícito (padrão já seguido no projeto).
- Campos somente leitura (Custo, Perda %, Total, Preço): `readOnly` +
  `aria-live="polite"` para anunciar recálculo (o recálculo em si é do outro agente).
- Contraste: todos os pares texto/fundo saem de tokens já validados nos dois temas.
- Ordem de foco: Nome → toggle → linhas de ingrediente (campos → perda → excluir)
  → adicionar → embalagem → margem → cancelar → salvar.

---

## 9. Checklist de entrega (camada visual/estrutural)

- [x] `IconPratos` + item em `NAV` (App.tsx), com gating `ehGestor` (via `useEhGestor`)
- [x] `<Route path="/pratos">` condicional + fallback
- [x] `pages/Pratos.tsx` (view-switch lista ↔ ficha, estado local)
- [x] `components/pratos/ListaPratos.tsx` (header, lista, vazio, loading)
- [x] `components/pratos/FichaPrato.tsx` (blocos 1–4 + rodapé)
- [x] `components/pratos/LinhaIngrediente.tsx` (grade desktop + mini-card mobile + faixa perda)
- [x] `components/pratos/ResultadoPrato.tsx` (card hero — `var(--accent-grad)`, preço em branco — decisão 5.5)
- [x] `components/pratos/BadgeGestor.tsx` + classe `.badge-live` em `index.css`
- [x] Compila: `tsc` limpo · `npm run build` ok · eslint limpo · 42 testes passando
- [ ] Verificação visual manual nos **dois temas** (claro/escuro) e em mobile/desktop (`npm run dev`)

### Seams para o agente de lógica (arquivos-stub a substituir)

- `src/components/pratos/calculo.stub.ts` — fórmulas do README §8; mover p/ `src/lib` + testes.
- `src/components/pratos/dadosExemplo.ts` — mock; remover e ligar a `usePratos` (Supabase).
- `src/pages/Pratos.tsx` — bloco marcado `TODO(lógica)` (estado em memória → `usePratos`).
- `src/hooks/useEhGestor.ts` — stub `return true`; ligar à identificação real + RLS.
- `src/components/pratos/tipos.ts` — view-models; alinhar com os tipos canônicos de `src/types/`.

---

## 10. Fronteira — o que NÃO é deste doc (handoff p/ o outro agente)

Fica para [plano-tela-pratos-logica.md](plano-tela-pratos-logica.md):

- Modelo de dados (`dishes` / `dish_ingredients`), tipos TS e schema SQL.
- Fórmulas: `baseCost`, `finalCost` (efeito da perda), `totalCost`,
  `suggestedPrice`, `markup`, `marginOnSale`, conversão kg/L ÷ 1000, limiar de
  alerta de perda.
- Estado do formulário, validação, salvar/editar/excluir.
- Persistência no Supabase + **RLS/permissão real** da gestora (não só ocultar a
  aba) e a identificação/seleção de perfil gestor.
- Realtime (se aplicável) e integração com os hooks existentes.

Os componentes visuais acima devem receber dados/handlers **por props**, mantendo
a UI "burra" e testável — o outro agente conecta os cálculos e a persistência sem
mexer no layout.
