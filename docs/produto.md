# Produto — visão, escopo e decisões

> Fonte de verdade sobre **o que** o sistema faz e **por quê**. Para *como* é
> construído, veja [arquitetura](arquitetura.md) e [modelo de dados](modelo-dados.md).

## Visão

PWA para registrar e acompanhar o **desperdício de alimentos** de uma petiscaria
(Petiscaria Aquino), substituindo o controle feito em papel.

**Quem usa:**
- **Funcionários** — registram o que foi desperdiçado (rápido, no balcão/tablet).
- **Dona** — acompanha o custo em tempo real no Monitor e exporta relatórios.

**Princípio que guia o projeto:** registrar tem que ser **muito rápido**. Se der
trabalho, ninguém usa e os dados ficam furados. Facilidade de uso é tão
importante quanto qualquer funcionalidade.

**Decisão de negócio — acesso por PIN e por papel.** O sistema **nasceu aberto**
(sem login, apoiado só no acesso físico ao tablet), mas isso foi **revertido**: a
`anon key` vai no bundle por design, então "sistema aberto" significava banco
aberto na internet para quem abrisse o DevTools. Hoje há **duas contas
compartilhadas** — *Funcionário* e *Gestor* —, cada uma com um **PIN de 6
dígitos**, e a autorização é aplicada no banco (RLS por papel). Continua sendo
um login de 6 toques, sem email nem senha na cara de ninguém: a simplicidade de
uso foi preservada, o banco não. Racional completo em
[plano-seguranca.md](plano-seguranca.md).

## O que faz hoje (implementado)

- **Entrar** — teclado de PIN com escolha de perfil (Funcionário / Gestor),
  bloqueio temporário após 5 erros, **bloquear tela** sem perder a sessão e
  **sair** para trocar de conta.
- **Produtos** — cadastro de alimentos com preço por unidade base (kg, L ou un),
  com busca.
- **Equipe** — cadastro de funcionários (papel funcionário/gestor, ativo/inativo).
  Escrita **restrita ao gestor**.
- **Motivos** — catálogo editável de motivos (viram chips reutilizáveis no registro).
- **Registrar** (modal) — funcionário + alimento + quantidade + unidade + motivo;
  o **custo é calculado pelo banco** a partir do preço congelado no momento.
- **Monitor** ao vivo — 3 KPIs (dia / mês / média com projeção) + 3 painéis
  (últimos lançamentos, mais desperdiçados, principais motivos), cada painel com
  **mini-filtro de período** (hoje / ontem / mês / total / data escolhida),
  atualizando em tempo real a cada novo registro.
- **Filtros avançados** (modal) — três modos de análise (mais registrados, maior
  valor, por produto) sobre 7 dias / 30 dias / mês / total / intervalo personalizado.
- **Modo de exibição** — tela cheia para uma TV ou tablet no balcão, com números
  grandes e relógio AO VIVO; no celular sugere/tenta a orientação paisagem.
- **Pratos** (só gestor) — ficha técnica e precificação: ingredientes, embalagem,
  margem, cálculo de perda, custo total e preço sugerido.
- **Relatórios** — exportação em Excel (3 abas) e PDF do mês.
- **Tema** claro/escuro e **teclado numérico** próprio para tablet.
- **Correção de lançamento** — excluir (com confirmação) ou editar um registro
  errado pelo próprio Monitor. Detalhes em [registro-correcao.md](registro-correcao.md).
- **Proteção do histórico** — produto/funcionário com lançamentos não pode ser
  excluído; o app orienta a desativar.
- **PWA instalável** com ícones da marca, e datas ancoradas no fuso de São Paulo
  (não no relógio do aparelho).

## Próximos passos (backlog)

- **Autoria real do lançamento** — hoje o autor vem do nome escolhido na lista;
  amarrar ao usuário logado (`auth.uid()`) daria trilha de auditoria confiável.
  Depende de decidir se cada pessoa terá a própria conta ou se as duas contas
  seguem compartilhadas.
- **Ranking de funcionários no Monitor** — já existe nos relatórios exportados,
  mas não é exibido na tela: exposição fica a critério da dona (numa equipe
  pequena, expor "quem mais desperdiça" pode gerar clima ruim).
- **Modo offline** — segurar o registro local e sincronizar quando a internet
  voltar (só se houver necessidade real).
- **Soft delete / auditoria** de lançamentos, se um dia for preciso saber o que
  foi apagado.

## Custos

| Item | Custo |
|---|---|
| Supabase (free) | R$ 0 |
| Vercel (hobby) | R$ 0 |
| GitHub | R$ 0 |
| Domínio próprio (opcional) | ~R$ 40/ano |

Nesse volume de dados, o projeto roda no plano gratuito por anos. O custo real é
o tempo de desenvolvimento.

---

> Histórico: o planejamento original está em
> [historico/base.md](historico/base.md) e o handoff de design em
> [historico/design-original.md](historico/design-original.md) — ambos
> **congelados** (referência, não fonte de verdade).
