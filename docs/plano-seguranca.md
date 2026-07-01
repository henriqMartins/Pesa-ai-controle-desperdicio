# Plano de segurança

> Documento de avaliação e planejamento. Não é implementação — explica cada
> medida, por que ela importa e em que ordem fazer. Veja também
> [arquitetura](arquitetura.md) e [infraestrutura](infraestrutura.md).

## Contexto

Hoje o sistema é **aberto**: não há login e o RLS está permissivo
(`for all to anon using (true)` em [schema.sql](../supabase/schema.sql)). Como a
`anon key` e a URL **sempre** vão no bundle do navegador (prefixo `VITE_`, é por
design), qualquer pessoa que abra o DevTools tem a chave e pode chamar a API REST
do Supabase **direto, pulando o frontend React**.

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
UI mostra e o que o RLS permite. O papel vem do `user_metadata` do Auth
(`{ papel: 'gestor' }`), gravado na criação da conta.

**Arquivos/pontos envolvidos:** novo `TelaPin` (teclado numérico), `ProtectedRoute`,
constante com os emails/papéis, ajuste em [App.tsx](../src/App.tsx), uso do
`supabase.auth` em [supabase.ts](../src/lib/supabase.ts).

### Fase 2 — RLS por papel (fechar o banco)

**O quê:** trocar as políticas `to anon using (true)` por políticas `to
authenticated` com regras por papel. Esboço da intenção:

| Tabela | Funcionário | Gestor |
|---|---|---|
| `registros` | inserir (e ler os próprios) | tudo |
| `alimentos`, `motivos`, `funcionarios` | só leitura | tudo (CRUD) |

Revogar os `grant ... to anon` e o acesso da `anon key` às tabelas.

**Por quê:** este é o ponto que **realmente fecha a porta** que estava aberta.
Depois disso, a `anon key` no bundle não dá mais acesso aos dados.

**Por que vincular ao `auth.uid()`:** trocar o `funcionario_id` vindo do dropdown
pelo identificador do usuário logado dá uma **trilha de auditoria confiável** —
não dá mais para "se passar" por outro funcionário só escolhendo o nome na lista.

**Arquivos/pontos envolvidos:** [schema.sql](../supabase/schema.sql) (políticas e
grants), nova migração em `supabase/`, ajuste no fluxo de registro que hoje usa
[useFuncionarioAtual.ts](../src/hooks/useFuncionarioAtual.ts).

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

## Plano de implementação

Passo a passo executável. Cada item começa como `[ ]` e vira `[x]` conforme for
concluído. Tudo é testado no projeto **hml** antes de aplicar no de produção.

### Etapa 0 — Ambientes prod × hml

- [ ] Criar um segundo projeto no painel do Supabase (nome sufixo `-hml`).
- [ ] Aplicar [schema.sql](../supabase/schema.sql) no projeto hml.
- [ ] Apontar `.env.local` para o hml; conferir `.env.example` atualizado.
- [ ] Confirmar que a Vercel (produção) usa as variáveis do projeto da **loja** no
      painel, não as de hml.

### Etapa 1 — Auth por PIN + gating do app

- [ ] No Supabase (hml e depois prod), criar 2 usuários no Auth com email fantasma
      e `user_metadata` de papel:
  - `gestor@petiscaria.local` → `{ "papel": "gestor" }`
  - `funcionario@petiscaria.local` → `{ "papel": "funcionario" }`
  - senha = PIN de 6 dígitos (guardada com a dona, fora do repositório).
- [ ] `src/lib/auth.ts` — constantes dos emails/papéis + helpers:
      `entrarComPin(papel, pin)` (chama `signInWithPassword`), `sair()`,
      `sessaoAtual()`, `papelAtual()` (lê `user_metadata.papel`).
- [ ] `src/hooks/useSessao.ts` — estado reativo da sessão via
      `supabase.auth.onAuthStateChange` + `getSession`.
- [ ] `src/components/TelaPin.tsx` — teclado numérico; escolha de perfil
      (gestor/funcionário) e campo de 6 dígitos; chama `entrarComPin`.
- [ ] `src/components/ProtectedRoute.tsx` — sem sessão → renderiza `TelaPin`;
      com sessão → renderiza as rotas. Envolver `<Routes>` em [App.tsx](../src/App.tsx).
- [ ] Aposentar o dropdown de funcionário do fluxo de registro: passar a usar o
      usuário logado (substituindo o uso de
      [useFuncionarioAtual.ts](../src/hooks/useFuncionarioAtual.ts)).

### Etapa 2 — RLS por papel

- [ ] Nova migração `supabase/migrate_v2_rls_auth.sql`:
  - `drop policy "anon_acesso_total"` nas 4 tabelas.
  - `revoke ... from anon` (tirar o acesso da anon key às tabelas).
  - Função `auth_papel()` que lê o papel do JWT (`auth.jwt()->'user_metadata'`).
  - Políticas `to authenticated`:
    - `registros`: funcionário faz `insert`/`select`; gestor faz tudo.
    - `alimentos`, `motivos`, `funcionarios`: `select` para todos; `insert/update/
      delete` só para gestor.
  - `registros.funcionario_id` passa a referenciar o `auth.uid()` do logado.
- [ ] Aplicar em hml, rodar o teste de `curl` da seção Verificação (deve falhar
      sem login), e só então aplicar em prod.

### Etapa 3 — Lock, lockout e horário

- [ ] Botão "Lockar agora" no [Layout](../src/App.tsx) → volta à `TelaPin` sem
      derrubar a sessão (re-valida só o PIN).
- [ ] Lockout: contador de tentativas erradas na `TelaPin` (bloqueio temporário
      após N erros).
- [ ] (Opcional) Política RLS com checagem de horário para reforçar o bloqueio de
      expediente no servidor.

### Etapa 4 — Extras

- [ ] Ativar MFA na conta de gestor.
- [ ] Ativar Leaked Password Protection no painel do Supabase.
- [ ] `vercel.json` com CSP e headers de segurança.
- [ ] Validar o backup periódico (já iniciado no backup semanal) apontando também
      para o projeto de produção.

### Testes

- [ ] Cobrir `entrarComPin` (sucesso, PIN errado, lockout) e o `ProtectedRoute`
      (redireciona sem sessão) — seguindo o padrão de testes já existente no
      projeto.

## Verificação (quando implementar)

Para confirmar que o banco está realmente fechado após a Fase 2, o teste decisivo
é tentar acessar **sem login**, simulando um atacante com a `anon key`:

```bash
# Deve retornar erro/lista vazia DEPOIS da Fase 2 (hoje retorna todos os dados):
curl "$VITE_SUPABASE_URL/rest/v1/registros?select=*" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY"
```

Demais checagens: login com cada papel mostra só o que deveria; funcionário não
consegue editar produtos; registro fica amarrado ao `auth.uid()` correto.
