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

**Decisão de negócio — sistema aberto:** sem login nem PIN. O acesso físico ao
tablet do estabelecimento é controle suficiente para uma equipe de 1–5 pessoas.
A simplicidade vale mais que o controle de acesso neste cenário.

## O que faz hoje (implementado)

- **Produtos** — cadastro de alimentos com preço por unidade base (kg, L ou un).
- **Equipe** — cadastro de funcionários (papel funcionário/gestor, ativo/inativo).
- **Motivos** — catálogo editável de motivos (viram chips reutilizáveis no registro).
- **Registrar** (modal) — funcionário + alimento + quantidade + unidade + motivo;
  o **custo é calculado pelo banco** a partir do preço congelado no momento.
- **Monitor** ao vivo — 3 KPIs (dia / mês / média com projeção) + 3 painéis
  (últimos lançamentos, mais desperdiçados, principais motivos), atualizando em
  tempo real a cada novo registro.
- **Relatórios** — exportação em Excel (3 abas) e PDF do mês.
- **Tema** claro/escuro e **teclado numérico** próprio para tablet.
- **Correção de lançamento** — excluir (com confirmação) ou editar um registro
  errado pelo próprio Monitor. Detalhes em [registro-correcao.md](registro-correcao.md).

## Próximos passos (backlog)

- **Filtros por período** no Monitor (hoje / 7 dias / mês / personalizado).
- **Modo offline** — segurar o registro local e sincronizar quando a internet
  voltar (só se houver necessidade real).
- **Ranking de funcionários** — exibição a critério da dona (numa equipe pequena,
  expor "quem mais desperdiça" pode gerar clima ruim).

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
