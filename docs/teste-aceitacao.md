# Teste de aceitação — ponta a ponta

Roteiro **manual** para validar a v1 antes de liberar para o cliente. Rode tudo
no ambiente **hml** (nunca em produção). Marque cada item como `[x]` ao passar.

> Não há automação de e2e (Playwright/Cypress) no projeto. Este roteiro cumpre o
> papel com verificação manual. Se um dia valer automatizar, os fluxos abaixo são
> o roteiro pronto para virar scripts.

**Pré-requisitos:** `.env.local` apontando para o hml; `migrate_v2_rls_auth.sql`
(versão atual) já aplicado no hml; 2 usuários criados (gestor e funcionário) com
PIN de 6 dígitos; `npm run dev` rodando.

---

## 1. Segurança do banco (o mais importante)

- [ ] **Sem login, a anon key não lê nada.** No terminal:
  ```bash
  curl "$VITE_SUPABASE_URL/rest/v1/registros?select=*" -H "apikey: $VITE_SUPABASE_ANON_KEY"
  ```
  Esperado: `401` / `permission denied` — **não** os dados. (Se as variáveis não
  estiverem no shell, use os valores do `.env.local`.)
- [ ] Repetir para `alimentos`, `funcionarios`, `motivos`, `pratos` — todas devem negar.

## 2. Login por PIN

- [ ] Abrir o app deslogado → cai na **tela de PIN** (não no Monitor).
- [ ] PIN **errado** → mostra "PIN incorreto" e limpa o campo.
- [ ] Errar o PIN 5 vezes → **bloqueia** com contagem regressiva; o teclado
  desabilita; ao zerar, libera.
- [ ] Recarregar a página durante o bloqueio → **continua bloqueado** (não zera).
- [ ] PIN correto de **funcionário** → entra no Monitor.
- [ ] PIN correto de **gestor** → entra no Monitor.

## 3. Permissões — perfil FUNCIONÁRIO

- [ ] **Monitor** mostra os dados (KPIs, rankings) e atualiza ao vivo.
- [ ] **Registrar** um desperdício → salva e aparece no Monitor.
- [ ] Editar e **excluir** um registro no Monitor → funciona.
- [ ] "Escrever outro motivo → + salvar" no registro → salva o motivo.
- [ ] **Produtos:** criar, editar e excluir um produto → funciona.
- [ ] **Motivos:** criar, editar e excluir → funciona.
- [ ] **Equipe:** vê a lista, mas **sem** "+ Novo" e **sem** botão de editar.
- [ ] A aba **Pratos** **não** aparece.

## 4. Permissões — perfil GESTOR

- [ ] Tudo do funcionário, **mais**:
- [ ] **Equipe:** criar, editar e excluir funcionário → funciona.
- [ ] Aba **Pratos** aparece; criar/editar/excluir prato → funciona.

## 5. Exclusão com histórico (bloqueio por FK)

- [ ] Tentar **excluir um produto que já tem lançamentos** → **não** apaga;
  mostra "tem lançamentos vinculados, desative-o".
- [ ] Desativar esse produto pelo toggle → some das listas ativas, histórico intacto.
- [ ] Mesmo teste para **funcionário** com lançamentos.

## 6. Bloquear / desbloquear / sair

- [ ] Botão **Bloquear** → cobre a tela com o PIN; o app continua por baixo.
- [ ] Digitar o PIN correto → **desbloqueia na hora** (testar gestor e funcionário).
- [ ] PIN errado no desbloqueio → "PIN incorreto", deixa tentar de novo.
- [ ] Recarregar a página bloqueada → continua bloqueada.
- [ ] "Sair e trocar de conta" na tela bloqueada → volta ao login.
- [ ] Botão **Sair** → volta ao login; relogar com o outro papel funciona.

## 7. Robustez

- [ ] Forçar um erro (ex.: derrubar a rede e navegar) → o app não trava em tela
  branca; o Monitor mostra estado de erro/retry e o ErrorBoundary cobre falhas de render.
- [ ] Instalar como PWA (add à tela inicial) → abre em tela cheia, com ícone.
- [ ] Testar em **celular** e em **tablet/desktop** (layout responsivo).

## 8. Fechamento

- [ ] `npm run lint && npm run typecheck && npm test && npm run build` — tudo verde.
- [ ] Conferir que produção (Vercel) aponta para o Supabase da **loja**, não o hml.

---

Só depois de tudo marcado, seguir para o rollout de produção (ver
[plano-seguranca.md](plano-seguranca.md)).
