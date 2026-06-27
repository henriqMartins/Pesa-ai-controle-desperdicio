# Testes

Como o projeto é testado e **como rodar os testes** você mesmo. A estratégia tem
duas camadas que se complementam:

| Camada | O que cobre | Quando roda | Onde |
|---|---|---|---|
| **Automatizada** (Vitest) | Lógica pura onde um bug silencioso corromperia os números | A cada `npm test` / antes de cada commit | `src/**/*.test.ts` |
| **Manual** (checklist) | Telas, tempo real, PWA, UX no tablet | Antes de entregar à cliente / após mudanças grandes | [plano-testes.md](plano-testes.md) |

> **Por que esse desenho?** Sendo um projeto pequeno e mantido por uma pessoa,
> automatizar tudo (cada clique, cada tela) custaria mais do que entrega. Então
> automatizamos **onde o erro é invisível e caro** — cálculo de custo, conversão
> de unidades, agregação dos KPIs e montagem dos relatórios — e deixamos o resto
> (visual, realtime, instalação no tablet) num checklist manual rápido.

---

## Como rodar

```bash
npm test            # roda todos os testes uma vez (use antes de commitar)
npm run test:watch  # fica observando: re-roda só o que mudou ao salvar
npm run test:coverage  # roda + mostra quanto do código está coberto
```

Saída esperada: `Test Files  3 passed (3)` e `Tests  20 passed (20)`.

---

## O que está coberto hoje

| Arquivo de teste | O que valida | Por que importa |
|---|---|---|
| [`src/lib/unidades.test.ts`](../src/lib/unidades.test.ts) | Conversão de unidade digitada → unidade base, e a reexibição (`500 g` ⇄ `0,5 kg`) | Se converter errado, **todo custo e relatório** fica errado |
| [`src/hooks/useMonitor.test.ts`](../src/hooks/useMonitor.test.ts) | Agregação dos KPIs: totais dia/mês, média, top alimentos, top motivos, ranking | É o número que a dona usa para decidir — não pode estar errado |
| [`src/lib/exportar.test.ts`](../src/lib/exportar.test.ts) | Montagem das linhas do Excel/PDF e disparo do download | Garante que o relatório exportado bate com a tela |

---

## Como escrever um novo teste

1. Crie um arquivo ao lado do código, com o sufixo `.test.ts`
   (ex.: `src/lib/algo.test.ts` testa `src/lib/algo.ts`).
2. Importe as funções do Vitest explicitamente e a função a testar:

   ```ts
   import { describe, it, expect } from 'vitest'
   import { minhaFuncao } from './algo'

   describe('minhaFuncao', () => {
     it('faz o esperado', () => {
       expect(minhaFuncao(2)).toBe(4)
     })
   })
   ```
3. Rode `npm run test:watch` e veja passar/falhar enquanto edita.

**Dica de design:** o jeito mais fácil de testar é extrair a lógica em uma
**função pura** (recebe dados, devolve resultado, sem ler banco nem estado). Foi
o que fizemos com `agregar` no `useMonitor` — testável sem simular o Supabase.

### Testando código que usa o Supabase

`src/lib/supabase.ts` exige as variáveis `VITE_SUPABASE_*` e lança erro se faltarem.
Nos testes isso é resolvido de duas formas:
- A config de teste define valores fake dessas variáveis (ver `vite.config.ts` →
  `test.env`), então importar o módulo não quebra.
- Para controlar o que o banco "responde", use `vi.mock('../lib/supabase', ...)`
  — exemplo de mock de módulo está em [`exportar.test.ts`](../src/lib/exportar.test.ts)
  (lá mockamos `xlsx` e `jspdf`).

---

## Configuração (para referência)

- **Runner:** [Vitest](https://vitest.dev) — integra com o Vite que já usamos.
- **Ambiente:** `jsdom` (simula o navegador), configurado em `vite.config.ts`.
- **Setup global:** [`src/test/setup.ts`](../src/test/setup.ts) carrega os matchers
  do `@testing-library/jest-dom` (ex.: `toBeInTheDocument()`).
- **Build:** os arquivos `*.test.ts` são excluídos do `tsc -b` (build de
  produção) — eles não entram no bundle do app.

---

## O que **não** é testado automaticamente (de propósito)

Estes itens vivem no [plano de testes manual](plano-testes.md) porque automatizá-los
é frágil ou tem baixo retorno neste projeto:

- **Cálculo do `custo`** — é uma *coluna gerada pelo PostgreSQL*, não roda em
  JavaScript; validado manualmente (testes D1/D2) e protegido pelo snapshot de preço.
- **Tempo real (Realtime)** — depende de WebSocket do Supabase; validado abrindo
  duas abas.
- **Visual, tema e responsividade no tablet** — inspeção visual.
- **Instalação do PWA** — específico de cada dispositivo.
