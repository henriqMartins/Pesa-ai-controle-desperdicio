# Arquitetura

> Derivado de [base.md](base.md) (seções 3 e 4). Veja também
> [modelo de dados](modelo-dados.md) e [setup](setup.md).

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
  de ambiente.
- `src/pages/` contém as três telas (Registro, Painel, Configuração), ligadas
  por roteamento em `src/App.tsx` (react-router). Não há tela de login — o
  sistema é aberto; o funcionário seleciona o próprio nome na tela de Registro.
- `src/hooks/` contém os hooks de dados: `useAlimentos`, `useFuncionarios`,
  `useRegistros` (com Realtime), `useTotais` (com Realtime) e
  `useFuncionarioAtual` (persiste a seleção no localStorage).
- `src/types/` define os tipos espelhando as tabelas do banco.
