# Arquitetura

> Veja também [produto](produto.md), [modelo de dados](modelo-dados.md) e
> [setup](setup.md). Planejamento original (congelado):
> [historico/base.md](historico/base.md).

## Stack e decisões técnicas

| Camada | Tecnologia | Versão | Por quê |
|---|---|---|---|
| Linguagem | TypeScript | ~6.0 | Tipagem reduz erros. |
| UI | React | **19.2** | Versão estável atual. |
| Build/dev server | Vite | **8** | Leve e rápido; não precisa de SSR. |
| Estilo | Tailwind CSS | 3.4 | UI limpa e rápida de montar. |
| Roteamento | react-router-dom | 7 | Navegação por abas, sem framework de app. |
| Backend / Banco | Supabase | (nuvem) | Postgres + API + auth + tempo real, sem servidor próprio. |
| Cliente do banco | @supabase/supabase-js | **v2** | Conversa do React com o Supabase. |
| PWA | vite-plugin-pwa (Workbox) | 1.3 | Permite "instalar" no tablet. |
| Relatórios | SheetJS (xlsx) + jsPDF | — | Gera Excel e PDF no navegador. |
| Testes | Vitest + Testing Library + jsdom | 4 | Roda no mesmo pipeline do Vite. |
| Lint | ESLint 10 (flat) + typescript-eslint | — | Portão de qualidade no CI. |
| Hospedagem do front | Vercel | — | Deploy automático a cada push. |
| Automação | GitHub Actions | — | CI, backup semanal e keep-alive do Supabase. |
| Controle de versão | Git + GitHub | — | Histórico e backup do código. |

> Nota de implementação: as versões acima são as realmente instaladas
> (`package.json`) — mais novas que as mínimas previstas no planejamento
> original, sem mudança de arquitetura.

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
  é lida de `VITE_SUPABASE_ANON_KEY` (veja `src/lib/supabase.ts`). Depois da
  migração de RLS por papel, ela só serve para o endpoint `/auth` — o acesso
  direto às tabelas foi revogado.
- `service_role key` (chave secreta): **nunca** colocar no front. Só em ambiente
  de servidor/admin — aqui, apenas como secret do GitHub Actions (backup e
  keep-alive), onde precisa ignorar o RLS.

---

## Autenticação e autorização

Duas contas do Supabase Auth (uma por papel) com **email "fantasma" embutido no
código** e o **PIN de 6 dígitos como senha real**. O usuário só vê um teclado
numérico. Isso reaproveita rate limiting, expiração e refresh de token nativos e,
principalmente, gera a **sessão autenticada (JWT)** em que o RLS se apoia.

- `src/lib/auth.ts` — `entrarComPin`, `verificarPin` (cliente isolado, para o
  desbloqueio não disputar o lock de auth do cliente principal), `sair` e
  `papelDaSessao`.
- O **papel** vem de `app_metadata.papel` no JWT — que só a `service_role`
  escreve. Nunca de `user_metadata`, que o próprio usuário poderia editar via
  `auth.updateUser` para se promover a gestor. A mesma leitura acontece no banco,
  na função `auth_papel()`.
- `useSessao` mantém a sessão reativa; `ProtectedRoute` decide entre `TelaPin`,
  o app, ou o `LockOverlay` (bloqueio de tela sem derrubar a sessão).
- Esconder a aba Pratos ou o botão "+ Novo" da Equipe é **UX**, não segurança:
  quem fecha a porta é o RLS. Ver [plano-seguranca.md](plano-seguranca.md).

---

## Fluxo no front-end

- `src/lib/supabase.ts` cria o cliente único do Supabase a partir das variáveis
  de ambiente. As libs auxiliares: `unidades.ts` (conversão kg/L/un), `fuso.ts`
  (datas ancoradas em `America/Sao_Paulo`), `filtros.ts` (lógica pura dos
  filtros), `calculoPrato.ts` + `mapPrato.ts` (pratos) e `exportar.ts`
  (Excel/PDF).
- **Navegação (IA)** em `src/App.tsx` (react-router): **Monitor** (dashboard ao
  vivo), **Produtos**, **Equipe**, **Motivos** e **Pratos** — esta última só
  aparece (e só roteia) para o perfil gestor. "Registrar" não é uma rota: é um
  **modal** aberto pelo botão `＋ Registrar` (desktop) ou pelo **FAB** (celular).
  O shell troca em `lg` (1024px): acima, top bar completa com relógio AO VIVO e
  as ações (Exibição, Tema, Filtrar, Bloquear, Sair); abaixo, top bar enxuta +
  bottom-nav + FAB, com as ações secundárias num menu de três pontos.
- `src/pages/` contém as telas: `Monitor`, `Produtos`, `Equipe`, `Motivos`,
  `Pratos`. Nenhuma faz query direta — todas consomem hooks.
- `src/components/` contém `RegistrarModal` (entrada rápida no desktop;
  bottom-sheet em 3 passos no celular; reaproveitado em modo edição),
  `TecladoNumerico` (teclado próprio na paleta do tema), `FiltrosModal` (filtros
  avançados), `ModoExibicao` (tela cheia para TV), `TelaPin`/`TecladoPin`/
  `LockOverlay`/`ProtectedRoute` (acesso) e `ErrorBoundary` (erro de render sem
  tela branca), além de `pratos/` com a ficha técnica.
- `src/hooks/` contém os hooks de dados (`useAlimentos`, `useFuncionarios`,
  `useMotivos`, `usePratos`, `useRegistros`, `useRegistrosPeriodo`, `useMonitor`
  — os dois últimos com Realtime) e de sessão/UI (`useSessao`, `useEhGestor`,
  `useLock`, `useLockout`, `useFuncionarioAtual`, `useIsMobile`/`useEhCelular`,
  `useOrientation`, `useTheme`).
- `src/types/` define os tipos espelhando as tabelas do banco.

### Padrões que a estrutura mantém

- **I/O só em hooks.** Página que precisa de dado recebe por props/hook.
- **Número é função pura e testada:** `agregar()` (KPIs), `filtros.ts`,
  `unidades.ts`, `calculoPrato.ts`, `exportar.ts`. É o que permite testar cálculo
  sem simular o Supabase — ver [testes.md](testes.md).
- **Toda data passa por `lib/fuso`**, nunca pelo relógio local do aparelho.
- **Nenhuma cor fixa em componente** — sempre token `var(--…)`.

---

## Robustez e borda

- **`ErrorBoundary`** global em `src/main.tsx`: erro de render mostra tela
  amigável com "Recarregar" em vez de tela branca.
- **Estado de erro com retry** no Monitor: falha de carga não é exibida como
  "R$ 0,00" (que pareceria "sem desperdício").
- **`vercel.json`** faz o *SPA fallback* (`rewrites` → `index.html`, para
  recarregar `/pratos` funcionar) e envia os headers de segurança: CSP restritiva
  (`script-src 'self'`, `connect-src` só para o Supabase), HSTS,
  `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
  A CSP é o motivo de o registro do service worker e o script de tema serem
  **arquivos externos**, não inline.
- **CI** (`.github/workflows/ci.yml`) roda lint + typecheck + testes + build a
  cada push/PR — ver [ci.md](ci.md). Há ainda backup semanal das tabelas e um
  keep-alive do projeto Supabase, descritos em
  [infraestrutura.md](infraestrutura.md).

## Tema (claro / escuro)

O design system vive em variáveis CSS (`src/index.css`) com dois conjuntos:
`:root[data-theme='dark']` (padrão, paleta aprovada) e `:root[data-theme='light']`.
O tema é aplicado no `<html>` (atributo `data-theme`), persistido em
`localStorage` e inicializado por um script inline em `index.html` (evita flash).
O botão sol/lua na barra superior alterna via `useTheme`. Os acentos
(laranja/vermelho) e superfícies, bordas e níveis de texto são todos tokens —
componentes referenciam `var(--…)`, nunca cores fixas.
