# Arquitetura

> Veja também [produto](produto.md), [modelo de dados](modelo-dados.md) e
> [setup](setup.md). Planejamento original (congelado):
> [historico/base.md](historico/base.md).

## Stack e decisões técnicas

| Camada | Tecnologia | Versão | Por quê |
|---|---|---|---|
| Linguagem | TypeScript | 5.x+ | Tipagem reduz erros. |
| UI | React | **19** | Versão estável atual. |
| Build/dev server | Vite | última estável | Leve e rápido; não precisa de SSR. |
| Estilo | Tailwind CSS | 3.x | UI limpa e rápida de montar. |
| Backend / Banco | Supabase | (nuvem) | Postgres + API + auth + tempo real, sem servidor próprio. |
| Cliente do banco | @supabase/supabase-js | **v2** | Conversa do React com o Supabase. |
| PWA | vite-plugin-pwa | última | Permite "instalar" no tablet. |
| Relatórios | SheetJS (xlsx) + jsPDF | últimas | Gera Excel e PDF no navegador. |
| Hospedagem do front | Vercel | — | Deploy automático a cada push. |
| Controle de versão | Git + GitHub | — | Histórico e backup do código. |

> Nota de implementação: o scaffold atual usa Vite 8, React 19.2 e TypeScript 6
> (versões estáveis no momento da inicialização) — mais novas que as mínimas
> previstas na base, sem mudança de arquitetura.

**Por que não um back-end próprio (Node/NestJS):** o Supabase já entrega banco,
API, autenticação e tempo real. Construir um servidor seria mais código para
manter, sem ganho real neste cenário (um único local, equipe pequena).

---

## Como o Supabase funciona como "backend"

Mudança de mentalidade em relação a um back-end tradicional:

- **Não existe servidor escrito por você.** O React fala direto com o Supabase.
- O **banco Postgres é o coração.** Você modela as tabelas e o Supabase gera
  automaticamente a API para ler/gravar nelas.
- **Controle de acesso = RLS (Row Level Security):** regras escritas no próprio
  banco definindo quem pode ler/escrever cada linha. É o equivalente aos
  *guards*/middleware de um back-end tradicional.
- **Tempo real é nativo:** ao "assinar" uma tabela, o front recebe as mudanças
  automaticamente. É o que mantém o painel atualizado na hora.
- **Edge Functions** existem para lógica pesada — não necessárias neste projeto.

### Chaves de acesso (importante)

- `anon key` (chave pública): vai no app; é segura de expor **desde que** o RLS
  esteja configurado, pois o RLS é quem realmente protege os dados. No código,
  é lida de `VITE_SUPABASE_ANON_KEY` (veja `src/lib/supabase.ts`).
- `service_role key` (chave secreta): **nunca** colocar no front. Só em ambiente
  de servidor/admin.

---

## Fluxo no front-end

- `src/lib/supabase.ts` cria o cliente único do Supabase a partir das variáveis
  de ambiente. `src/lib/unidades.ts` faz a conversão de unidades (kg/L/un) e
  `src/lib/exportar.ts` gera Excel/PDF.
- **Navegação (IA)** em `src/App.tsx` (react-router): quatro abas —
  **Monitor** (dashboard ao vivo), **Produtos**, **Equipe** e **Motivos**.
  "Registrar" não é uma rota: é um **modal** aberto pelo botão `＋ Registrar`
  (desktop) ou pelo **FAB** (celular). No celular há bottom-nav + FAB; no
  desktop, top bar com relógio AO VIVO. Não há login — o funcionário seleciona
  o próprio nome ao registrar.
- `src/pages/` contém as telas: `Monitor`, `Produtos`, `Equipe`, `Motivos`.
- `src/components/` contém `RegistrarModal` (entrada rápida no desktop;
  bottom-sheet em 3 passos no celular) e `TecladoNumerico` (teclado próprio na
  paleta do tema, para digitar em tablet/balcão sem o teclado do SO).
- `src/hooks/` contém os hooks de dados e UI: `useAlimentos`, `useFuncionarios`,
  `useMotivos`, `useRegistros` (com Realtime), `useMonitor` (KPIs do dashboard
  ao vivo, com Realtime), `useFuncionarioAtual` (persiste a seleção no
  localStorage), `useIsMobile` (breakpoint) e `useTheme` (tema claro/escuro).
- `src/types/` define os tipos espelhando as tabelas do banco.

## Tema (claro / escuro)

O design system vive em variáveis CSS (`src/index.css`) com dois conjuntos:
`:root[data-theme='dark']` (padrão, paleta aprovada) e `:root[data-theme='light']`.
O tema é aplicado no `<html>` (atributo `data-theme`), persistido em
`localStorage` e inicializado por um script inline em `index.html` (evita flash).
O botão sol/lua na barra superior alterna via `useTheme`. Os acentos
(laranja/vermelho) e superfícies, bordas e níveis de texto são todos tokens —
componentes referenciam `var(--…)`, nunca cores fixas.
