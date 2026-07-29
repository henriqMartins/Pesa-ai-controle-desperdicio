# Plano de segurança

> **Status: implementado.** As Fases 0 a 4 foram executadas (o que sobrou está
> marcado como *não feito* na seção [Situação atual](#situação-atual)). Este
> documento continua sendo a **explicação do modelo** — por que cada medida
> existe e o que foi descartado —, não uma lista de tarefas pendentes. Veja
> também [arquitetura](arquitetura.md), [modelo-dados](modelo-dados.md#rls-e-permissões)
> e [infraestrutura](infraestrutura.md).

## Situação atual

| Fase | O que era | Situação |
|---|---|---|
| 0 | Separar prod × hml | ✅ feito |
| 1 | Auth real por PIN | ✅ feito — [`src/lib/auth.ts`](../src/lib/auth.ts), `TelaPin`, `ProtectedRoute` |
| 2 | RLS por papel | ✅ feito — [`migrate_v2_rls_auth.sql`](../supabase/migrate_v2_rls_auth.sql) |
| 3 | Lock e lockout | ✅ feito — `LockOverlay`, `useLock`, `useLockout` |
| 3 | Bloqueio por horário | ❌ **não feito** (não houve demanda da operação) |
| 4 | CSP e headers na Vercel | ✅ feito — [`vercel.json`](../vercel.json) |
| 4 | Backup fora do Supabase | ✅ feito — workflow semanal com artefato |
| 4 | MFA no gestor · Leaked Password Protection | ❌ **não feito** (toggles do painel) |
| — | Autoria pelo `auth.uid()` | ❌ **não feito** — ver [Decisão pendente](#decisão-pendente--autoria-do-registro) |

## Contexto (o problema que originou o plano)

O sistema **nasceu aberto**: sem login e com RLS permissivo
(`for all to anon using (true)`, ainda visível em
[schema.sql](../supabase/schema.sql), que é o script de banco do zero). Como a
`anon key` e a URL **sempre** vão no bundle do navegador (prefixo `VITE_`, é por
design), qualquer pessoa que abrisse o DevTools tinha a chave e podia chamar a API
REST do Supabase **direto, pulando o frontend React**.

A consequência prática disso guia todo o plano:

> **Qualquer proteção feita só no React (PIN, lock, tela de login "de fachada") é
> contornável.** A segurança de verdade precisa estar no servidor — ou seja, no
> Postgres via RLS, amarrado ao Supabase Auth.

Decisões já tomadas para este plano:
- **Modelo de autenticação:** por papel — uma conta **gestor** (acesso total) e
  uma conta **funcionário** (só registrar desperdício).
- **Credencial:** **PIN** (não email+senha na cara do usuário). O login é um
  teclado numérico; o email é uma constante escondida e o PIN é a senha real do
  Supabase Auth. Ver Fase 1 e o box "PIN é credencial, não enfeite".
- **Acesso:** inclui celulares pessoais e 4G → restrição por IP fica fora.

---

## Avaliação das ideias levantadas

### 1. VPN / privatizar a URL por rede — ❌ descartado

O app é um PWA na Vercel (CDN público) rodando em navegadores. Esconder atrás de
VPN exigiria **todos** os dispositivos na VPN — inviável para a operação da
petiscaria. O equivalente real seria o **Network Restrictions** (allowlist de IP)
do Supabase, mas ele não sobrevive a rede móvel:

- No 4G/5G o IP público é **da operadora (CGNAT)**, é compartilhado, rotaciona e
  muda por torre/região — não há IP estável para cadastrar.
- Liberar o celular exigiria cadastrar faixas inteiras da operadora → libera
  milhões de pessoas, proteção inútil.
- Wi-Fi da loja normalmente tem IP **dinâmico** (muda sozinho), salvo IP fixo
  contratado — e ainda quebra quando o funcionário sai para o 4G.

**Só faria sentido** no cenário "tablets fixos, sempre no Wi-Fi da loja, com IP
fixo contratado". Não é o nosso caso. **Não usar.**

### 2. PIN leve + lock / horários — ✅ válido, mas como camada 2

Sozinho é "teatro de segurança": protege a tela, não o banco. Vira proteção real
**em cima do Auth**: depois que o RLS exige `authenticated`, o PIN/lock/horário
passa a ser uma camada de conveniência (re-bloqueio rápido no balcão, esconder a
tela entre usos). Implementar **depois** da fundação (item 4).

### 3. Separar prod × hml + esquema de usuários — ✅ recomendado

- **Dois projetos Supabase** (produção da loja e homologação/testes) é prática
  excelente e **gratuita** no free tier. Evita que um teste seu apague dados
  reais da dona.
- "Esquema de usuários": já existe a coluna `papel` (funcionario/gestor) em
  `funcionarios`. Com Auth + RLS por papel isso vira separação de acesso real.

### 4. A fundação que faltava — ✅ prioridade máxima

Nenhuma das ideias acima protege o banco sozinha. A base é:

- **Supabase Auth + RLS travado para `authenticated`** (com regras por papel).
- Vincular cada registro ao `auth.uid()` real, em vez do dropdown salvo no
  localStorage (hoje [useFuncionarioAtual.ts](../src/hooks/useFuncionarioAtual.ts)).

---

## Plano por fases (explicação de cada ponto)

### Fase 0 — Separar ambientes (prod × hml)

**O quê:** criar um segundo projeto Supabase para homologação. O `.env.local`
aponta para hml em desenvolvimento; a Vercel (produção) aponta para o projeto da
loja via variáveis de ambiente do painel.

**Por quê:** isola seus testes dos dados reais. É o primeiro passo porque tudo que
vier a seguir (mexer em RLS, migrar schema) deve ser testado em hml antes de ir
para a loja.

**Arquivos/pontos envolvidos:** `.env.local`, `.env.example`, variáveis na Vercel,
`supabase/schema.sql` (aplicado nos dois projetos).

### Fase 1 — Autenticação real por PIN (a fundação)

**O quê:** ativar **Supabase Auth** e criar duas contas com emails "fantasma" que
ninguém digita — `gestor@petiscaria.local` e `funcionario@petiscaria.local`. A
tela de login é um **teclado numérico de PIN**; por baixo, o app chama
`supabase.auth.signInWithPassword({ email, password: pin })`, onde o email é uma
constante escondida e **o PIN é a senha**.

```
// esboço da intenção — o usuário só vê o PIN
supabase.auth.signInWithPassword({
  email: 'funcionario@petiscaria.local',   // fixo, embutido no código
  password: pinDigitado,                     // 6 dígitos
})
```

**Por quê:** é o que transforma toda proteção de cosmética em real. O
`signInWithPassword` gera uma **sessão autenticada (JWT)** — sem ela, o RLS da
Fase 2 não tem em que se apoiar. Usar Auth por baixo (em vez de inventar
verificação de PIN no cliente) reaproveita rate limiting, expiração de sessão e
refresh de token prontos.

> **PIN é credencial, não enfeite.** O PIN só protege porque ele *é* a senha que
> abre a sessão do Supabase. Um PIN checado só no React (ex.: `if (pin === '1234')`)
> é inútil: o atacante ignora a tela e usa a `anon key` direto na API. Nunca
> guarde nem compare o PIN no cliente.

**Escolha do PIN — trade-off:** PIN de 4 dígitos = 10.000 combinações (fácil de
chutar por robô). **Usar 6 dígitos** (1 milhão). O Supabase já aplica rate
limiting nativo no login; o **lockout após X tentativas** entra na Fase 3.

**Como o papel é descoberto:** a conta logada (gestor/funcionário) define o que a
UI mostra e o que o RLS permite. O papel vem do **`app_metadata`** do Auth
(`{ papel: 'gestor' }`), gravado na criação da conta.

> **Correção em relação ao esboço original deste plano:** o papel **não** pode
> ficar em `user_metadata`. O próprio usuário logado consegue reescrever
> `user_metadata` via `auth.updateUser` — ou seja, um funcionário se promoveria a
> gestor com uma chamada. `app_metadata` só é gravável pela `service_role`. É de
> lá que leem tanto `papelDaSessao` (front) quanto `auth_papel()` (RLS).

**Arquivos/pontos envolvidos:** novo `TelaPin` (teclado numérico), `ProtectedRoute`,
constante com os emails/papéis, ajuste em [App.tsx](../src/App.tsx), uso do
`supabase.auth` em [supabase.ts](../src/lib/supabase.ts).

### Fase 2 — RLS por papel (fechar o banco)

**O quê:** trocar as políticas `to anon using (true)` por políticas `to
authenticated` com regras por papel, e revogar o `grant ... to anon`.

O esboço inicial era mais restritivo do que o que foi implementado. O **modelo
final**, calibrado com a operação real (funcionário precisa corrigir o próprio
lançamento e cadastrar um produto/motivo no meio do serviço, sem depender da dona):

| Tabela | Funcionário | Gestor |
|---|---|---|
| `registros`, `motivos`, `alimentos` | tudo | tudo |
| `funcionarios` (equipe) | só leitura | tudo |
| `pratos`, `prato_ingredientes` | — | tudo |

O SQL canônico é [`migrate_v2_rls_auth.sql`](../supabase/migrate_v2_rls_auth.sql);
o DDL comentado está em [modelo-dados.md](modelo-dados.md#rls-e-permissões).

> **Detalhe que quebra na prática:** revogar o `anon` não basta — a
> `service_role` (backup e keep-alive no GitHub Actions) *bypassa o RLS mas não o
> `GRANT`* de tabela. Sem `grant ... to service_role`, os workflows recebem
> `42501 permission denied`. A migração já concede.

**Por quê:** este é o ponto que **realmente fecha a porta** que estava aberta.
Depois disso, a `anon key` no bundle não dá mais acesso aos dados.

**Arquivos/pontos envolvidos:** [`migrate_v2_rls_auth.sql`](../supabase/migrate_v2_rls_auth.sql).
O [schema.sql](../supabase/schema.sql) **não** foi reescrito: ele segue sendo o
script de "banco do zero" com o RLS aberto, e a migração é aplicada depois.

### Decisão pendente — autoria do registro

**Não implementado.** A intenção original era trocar o `funcionario_id` vindo da
lista pelo `auth.uid()` do usuário logado, o que daria uma **trilha de auditoria
confiável** — não daria mais para "se passar" por outro funcionário só escolhendo
o nome.

Isso não foi feito porque **as duas contas são compartilhadas**: várias pessoas
usam o mesmo PIN de funcionário. Amarrar a autoria ao `auth.uid()` hoje faria
todos os lançamentos aparecerem como "funcionario@petiscaria.local" — pior do que
o nome escolhido na lista, que ao menos identifica quem registrou (mesmo sem
garantia). O caminho real é **uma conta por pessoa**; enquanto isso não for
decidido com a dona, a autoria segue vindo de
[useFuncionarioAtual.ts](../src/hooks/useFuncionarioAtual.ts) + `funcionarios`.

**Consequência aceita:** a autoria é *declarada*, não *autenticada*. Serve para
organizar a operação, não para responsabilizar ninguém.

### Fase 3 — Lock, lockout e horários (camada de conveniência)

**O quê:** sobre a sessão já autenticada por PIN (Fase 1):
- **Re-lock rápido:** botão de "lockar agora" que volta ao teclado de PIN sem
  derrubar a sessão do Supabase — reentra só validando o PIN.
- **Lockout:** após X tentativas erradas de PIN, bloquear por alguns minutos
  (contador no cliente + o rate limit nativo do Supabase como rede de proteção).
- **Horário:** bloquear uso fora do expediente. O ideal é reforçar **também no
  RLS** (política que compara o horário no servidor), para não ser só client-side.

**Por quê:** é o conforto operacional que você descreveu — esconder/recuperar a
tela no balcão sem refazer login completo — agora apoiado em algo real, já que a
sessão por trás é autenticada.

### Fase 4 — Extras de "100%" (boas práticas)

- **MFA na conta de gestor:** segundo fator no login com mais poder.
- **Leaked Password Protection:** o Supabase checa a senha contra a base do
  HaveIBeenPwned no cadastro/login. É um toggle no painel.
- **CSP e headers de segurança na Vercel:** `Content-Security-Policy`,
  `X-Frame-Options`, etc., via `vercel.json` — reduz risco de injeção/clickjacking.
- **Backup:** como o PITR é pago, agendar um `pg_dump` periódico (a base já tem um
  início disso no commit recente de backup semanal) e guardar fora do Supabase.
- **Não expor a `service_role` key:** mantém a regra atual — nunca no frontend.
- **Rotacionar a `anon key`** *não* é prioridade: ela é pública por design; o que
  a torna inofensiva é o RLS da Fase 2, não escondê-la.

---

## Ordem recomendada e racional

1. **Fase 0** (prod × hml) — base segura para testar o resto.
2. **Fase 1 + 2** (Auth + RLS) — resolvem o risco **crítico**; são inseparáveis.
3. **Fase 3** (PIN/lock/horário) — conveniência sobre uma base sólida.
4. **Fase 4** (extras) — polimento de "100%".

> O ponto central: **Fases 1 e 2 são as únicas que mudam o risco real.** As outras
> agregam, mas sem elas qualquer cadeado é decorativo.

---

## Plano de implementação — o que foi entregue

Registro do que foi executado (e onde), para auditoria futura. Tudo foi testado no
projeto **hml** antes de ir para produção.

### Etapa 0 — Ambientes prod × hml

- [x] Segundo projeto no painel do Supabase (hml).
- [x] Scripts do banco aplicados no hml.
- [x] `.env.local` apontando para o hml; `.env.example` conferido.
- [x] Vercel (produção) usando as variáveis do projeto da **loja**.

### Etapa 1 — Auth por PIN + gating do app

- [x] Dois usuários no Auth com email fantasma e o papel em **`app_metadata`**
      (não `user_metadata` — ver a correção na Fase 1):
  - `gestor@petiscaria.local` → `{ "papel": "gestor" }`
  - `funcionario@petiscaria.local` → `{ "papel": "funcionario" }`
  - senha = PIN de 6 dígitos (guardado com a dona, fora do repositório).
- [x] [`src/lib/auth.ts`](../src/lib/auth.ts) — emails/papéis + `entrarComPin`,
      `verificarPin`, `sair` e `papelDaSessao` (lê `app_metadata.papel`).
- [x] [`src/hooks/useSessao.ts`](../src/hooks/useSessao.ts) — sessão reativa via
      `getSession` + `onAuthStateChange`, com `carregando` para não piscar a `TelaPin`.
- [x] [`src/components/TelaPin.tsx`](../src/components/TelaPin.tsx) +
      [`TecladoPin.tsx`](../src/components/TecladoPin.tsx) — perfil + 6 dígitos,
      com envio automático ao completar.
- [x] [`src/components/ProtectedRoute.tsx`](../src/components/ProtectedRoute.tsx)
      envolvendo o `Layout` em [App.tsx](../src/App.tsx); gating da aba/rota
      `/pratos` por [`useEhGestor`](../src/hooks/useEhGestor.ts).
- [ ] ~~Aposentar o dropdown de funcionário~~ — **descartado por ora**; ver
      [Decisão pendente](#decisão-pendente--autoria-do-registro).

### Etapa 2 — RLS por papel

- [x] [`supabase/migrate_v2_rls_auth.sql`](../supabase/migrate_v2_rls_auth.sql):
  - `drop policy` de todos os nomes já usados, nas 6 tabelas (idempotente).
  - `revoke all ... from anon` nas 6 tabelas e na função `salvar_prato`.
  - Função `auth_papel()` lendo `auth.jwt() -> 'app_metadata' ->> 'papel'`.
  - Políticas `to authenticated` no modelo final da tabela da Fase 2.
  - `grant` para `authenticated` **e** `service_role` (bypass de RLS não dispensa
    o `GRANT`).
- [x] Aplicado em hml, validado com o `curl` da seção Verificação, e então em prod.

### Etapa 3 — Lock e lockout

- [x] Botão "Bloquear" no [Layout](../src/App.tsx) →
      [`LockOverlay`](../src/components/LockOverlay.tsx) por cima do app, com a
      sessão viva; estado em [`useLock`](../src/hooks/useLock.ts) (persistido, e
      limpo no `SIGNED_OUT`).
- [x] O desbloqueio confere o PIN **no servidor** por um cliente Supabase isolado
      (`verificarPin`) — re-autenticar no cliente principal com sessão ativa
      travava o `signInWithPassword`.
- [x] [`useLockout`](../src/hooks/useLockout.ts) — 5 erros → 1 min de bloqueio,
      persistido em `localStorage` (recarregar não zera).
- [ ] Bloqueio por horário — **não feito**; sem demanda da operação. Se entrar,
      precisa ser também no RLS (comparação de horário no servidor) para não ser
      só client-side.

### Etapa 4 — Extras

- [x] [`vercel.json`](../vercel.json) com CSP e headers de segurança.
- [x] Backup semanal apontando para produção
      ([`backup-dados.yml`](../.github/workflows/backup-dados.yml), artefato com
      90 dias de retenção).
- [ ] MFA na conta de gestor — **não feito**.
- [ ] Leaked Password Protection — **não feito** (nota: sendo a senha um PIN de 6
      dígitos, a checagem contra o HaveIBeenPwned tende a rejeitar PINs comuns;
      vale ativar junto com a escolha do PIN definitivo).

### Testes

- [ ] Cobrir `entrarComPin` (sucesso, PIN errado, lockout) e o `ProtectedRoute`
      (redireciona sem sessão) — seguindo o padrão de testes já existente no
      projeto.

## Verificação

Rode isto após qualquer mexida no banco — inclusive após re-rodar `schema.sql`,
`criar_tabela_motivos.sql` ou `criar_tabelas_pratos.sql`, que reabrem o acesso
`anon` e exigem a migração de RLS em seguida.

O teste decisivo é acessar **sem login**, simulando um atacante com a `anon key`:

```bash
# Esperado: 401 / permission denied — NÃO os dados.
curl "$VITE_SUPABASE_URL/rest/v1/registros?select=*" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY"
```

Repita para `alimentos`, `funcionarios`, `motivos` e `pratos` — todas devem negar.

Demais checagens (login com cada papel mostra só o que deveria, funcionário não
edita a Equipe nem vê Pratos, lock/desbloqueio, lockout que sobrevive a reload)
estão no roteiro de [teste-aceitacao.md](teste-aceitacao.md), que é o checklist
oficial antes de liberar uma versão.
