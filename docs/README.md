# Sistema de Controle de Desperdício — Petiscaria

Aplicativo web (PWA) para registrar e acompanhar o desperdício de alimentos de
uma petiscaria, substituindo o controle feito hoje em papel.

> Esta documentação foi derivada de [base.md](base.md), que permanece como
> referência original do projeto. Documentos relacionados:
> [arquitetura](arquitetura.md) · [modelo de dados](modelo-dados.md) ·
> [setup](setup.md).

---

## Visão geral

**Quem usa:** os próprios funcionários (registram o desperdício) e a dona
(acompanha relatórios e configura os itens).

**O que faz, no essencial:**

- A dona cadastra os alimentos e o valor de cada um por quilo (R$/kg).
- O funcionário registra o peso desperdiçado (ex.: 500 g de arroz). O sistema
  calcula o custo automaticamente, com base no valor já cadastrado.
- Ao registrar, atualiza em **tempo real**: lista dos últimos registros, total
  desperdiçado no dia e no mês (em R$), tabela dos alimentos mais desperdiçados
  e ranking de funcionários.
- A dona pode baixar relatórios (Excel/PDF) por período.

**Princípio que guia o projeto:** registrar tem que ser **muito rápido**. Se der
trabalho, ninguém usa e os dados ficam furados. A facilidade de uso é tão
importante quanto qualquer funcionalidade.

---

## Escopo

### MVP (primeira entrega — o que faz a dona largar o caderno)
- Cadastro de alimentos (nome, categoria, valor por kg).
- Login simples por funcionário (toca no nome + PIN de 4 dígitos).
- Tela de registro de desperdício (escolhe o item, digita o peso, confirma).
- Cálculo automático do custo.
- Painel com: últimos registros, total do dia, total do mês.

### Em seguida (camada 2)
- Tabela de alimentos mais desperdiçados.
- Ranking de funcionários (visível **apenas para a dona**).
- Exportar relatório por período (Excel e PDF).
- Filtros por data e por alimento.

### Futuro (só se houver necessidade real)
- Modo offline (segura o registro local e sincroniza quando a internet volta).
- Integração com balança.
- Motivo/categoria do desperdício (sobra, queima, validade etc.).

> **Sobre o ranking de funcionários:** numa equipe pequena, expor "quem mais
> desperdiça" para todos pode gerar clima ruim. Recomenda-se manter visível só
> para a gestão.

---

## Como rodar

Pré-requisitos: Node.js LTS (22+) e uma conta no Supabase. Passo a passo
detalhado em [setup.md](setup.md).

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
#    Copie .env.example para .env.local e preencha com a URL e a anon key
#    do seu projeto Supabase.

# 3. Rodar em desenvolvimento
npm run dev
```

Scripts disponíveis:

| Script | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento (Vite). |
| `npm run build` | Type-check + build de produção. |
| `npm run preview` | Serve localmente o build de produção. |
| `npm run lint` | Roda o ESLint. |
| `npm run typecheck` | Verifica os tipos sem gerar build. |

---

## Estrutura do projeto

```
.
├── docs/            # esta documentação
├── supabase/        # schema.sql (tabelas do banco)
├── src/
│   ├── lib/         # cliente do Supabase
│   ├── types/       # tipos TypeScript (Alimento, Funcionario, Registro)
│   ├── hooks/       # hooks de dados (próxima etapa)
│   ├── components/  # peças de UI reutilizáveis
│   └── pages/       # telas: Login, Registro, Painel, Configuração
├── .env.example
└── vite.config.ts
```

## Estado atual

Etapa de **estruturação e documentação** concluída: projeto inicializado, stack
configurada, schema e tipos definidos, telas em esqueleto. As funcionalidades
(cálculo, tempo real, relatórios) ficam para a próxima etapa.
