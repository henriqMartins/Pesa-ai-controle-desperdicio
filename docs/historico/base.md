# Sistema de Controle de Desperdício — Petiscaria

> ⚠️ **DOCUMENTO HISTÓRICO — CONGELADO.** Este é o documento de *planejamento
> original* (handoff inicial). Ele descreve o projeto que foi **planejado**, não
> o que foi **construído** — partes estão desatualizadas de propósito (ex.: telas
> Login/Registro/Painel/Config e o schema antigo com `valor_por_kg`/`peso_g`).
> **Não use como fonte de verdade.** O estado real do sistema vive em:
> [produto.md](../produto.md) · [arquitetura.md](../arquitetura.md) ·
> [modelo-dados.md](../modelo-dados.md). Mantido apenas como registro de decisão.

---

## 1. Visão geral

Aplicativo web (PWA) para registrar e acompanhar o desperdício de alimentos de
uma petiscaria, substituindo o controle feito hoje em papel.

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

## 2. Escopo

### MVP (primeira entrega — o que faz a dona largar o caderno)
- Cadastro de alimentos (nome, categoria, valor por kg).
- Seleção de funcionário (toca no nome para se identificar — sem senha nem PIN).
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
> desperdiça" para todos pode gerar clima ruim. O sistema não tem controle de
> acesso por senha; a decisão de exibir o ranking fica a critério da dona.

---

## 3. Stack e decisões técnicas

| Camada | Tecnologia | Versão | Por quê |
|---|---|---|---|
| Linguagem | TypeScript | 5.x | Tipagem reduz erros; você já trabalha com isso |
| UI | React | **19** | Versão estável atual |
| Build/dev server | Vite | última estável (6/7) | Leve e rápido; não precisa de SSR |
| Estilo | Tailwind CSS | 3.x/4.x | UI limpa e rápida de montar |
| Backend / Banco | Supabase | (nuvem) | Postgres + API + auth + tempo real, sem servidor próprio |
| Cliente do banco | @supabase/supabase-js | **v2** | Conversa do React com o Supabase |
| PWA | vite-plugin-pwa | última | Permite "instalar" no tablet |
| Relatórios | SheetJS (xlsx) + jsPDF | últimas | Gera Excel e PDF no navegador |
| Hospedagem do front | Vercel | — | Deploy automático a cada push |
| Controle de versão | Git + GitHub | — | Histórico e backup do código |

**Por que não um back-end próprio (Node/NestJS):** O Supabase já entrega banco,
API, autenticação e tempo real. Construir um servidor seria mais código para
manter, sem ganho real neste cenário (um único local, equipe pequena).

---

## 4. Como o Supabase funciona como "backend"

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
  esteja configurado, pois o RLS é quem realmente protege os dados.
- `service_role key` (chave secreta): **nunca** colocar no front. Só em ambiente
  de servidor/admin.

---

## 5. Modelo de dados

Três tabelas resolvem quase tudo. Totais e rankings são **consultas** sobre a
tabela de registros — não precisam de tabela própria.

### SQL (cola no SQL Editor do Supabase)

```sql
-- Alimentos cadastrados pela dona
create table alimentos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  categoria   text,
  valor_por_kg numeric(10,2) not null check (valor_por_kg >= 0),
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

-- Funcionários (identificação na tela — sem senha nem PIN)
create table funcionarios (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  papel     text not null default 'funcionario'
              check (papel in ('funcionario','gestor')),
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Registros de desperdício
create table registros (
  id                   uuid primary key default gen_random_uuid(),
  alimento_id          uuid not null references alimentos(id),
  funcionario_id       uuid not null references funcionarios(id),
  peso_g               numeric(10,2) not null check (peso_g > 0),
  -- snapshot do preço no momento do registro (preço muda com o tempo)
  preco_kg_no_momento  numeric(10,2) not null,
  -- custo calculado automaticamente pelo banco
  custo                numeric(10,2)
                         generated always as
                         (round((peso_g / 1000.0) * preco_kg_no_momento, 2)) stored,
  motivo               text,
  criado_em            timestamptz not null default now()
);

-- Índice para acelerar consultas por data
create index idx_registros_criado_em on registros (criado_em);
```

**Detalhe importante:** `preco_kg_no_momento` guarda o preço **no momento do
registro**. Como o preço dos alimentos muda, sem isso os relatórios antigos
seriam recalculados com o preço de hoje e ficariam errados. O campo `custo` é
calculado pelo próprio banco (coluna gerada), garantindo consistência.

### Exemplos de consultas (totais e rankings)

```sql
-- Total desperdiçado hoje (R$)
select coalesce(sum(custo),0) as total_hoje
from registros
where criado_em >= date_trunc('day', now());

-- Top alimentos mais desperdiçados (por valor)
select a.nome, sum(r.custo) as total, sum(r.peso_g) as peso_total
from registros r join alimentos a on a.id = r.alimento_id
group by a.nome
order by total desc;

-- Ranking de funcionários
select f.nome, sum(r.custo) as total
from registros r join funcionarios f on f.id = r.funcionario_id
group by f.nome
order by total desc;
```

### RLS (ponto de partida pragmático)
O sistema usa a `anon key` sem autenticação de usuário — RLS desativado por
padrão (ambiente interno confiável). Os comandos `enable row level security`
estão comentados no `schema.sql` para uma eventual etapa futura.

---

## 6. Setup do ambiente — passo a passo

### Pré-requisitos
1. **Node.js LTS** (versão 22 ou superior). Baixe em nodejs.org.
   Confirme: `node -v` e `npm -v`.
2. **Git** instalado. Confirme: `git --version`.
3. Conta no **GitHub**, no **Supabase** (supabase.com) e na **Vercel**
   (vercel.com) — todas com plano gratuito.

### Criar o projeto React + Vite + TypeScript
```bash
npm create vite@latest desperdicio-petiscaria -- --template react-ts
cd desperdicio-petiscaria
npm install
```

### Instalar dependências
```bash
# Cliente do Supabase
npm install @supabase/supabase-js

# Estilo
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Relatórios
npm install xlsx jspdf

# PWA
npm install -D vite-plugin-pwa
```

### Configurar o Supabase (nuvem, sem Docker)
1. Crie um projeto novo no painel do Supabase.
2. Vá em **SQL Editor** e rode o SQL da seção 5.
3. Em **Project Settings → API**, copie a **Project URL** e a **anon key**.

### Variáveis de ambiente
Crie um arquivo `.env.local` na raiz (e adicione ao `.gitignore`):
```
VITE_SUPABASE_URL=...sua project url...
VITE_SUPABASE_ANON_KEY=...sua anon key...
```

### Cliente do Supabase no código
`src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Rodar localmente
```bash
npm run dev
```

---

## 7. Estrutura de pastas proposta

```
desperdicio-petiscaria/
├── docs/                     # documentação do projeto
│   ├── README.md
│   ├── arquitetura.md
│   ├── modelo-dados.md
│   └── setup.md
├── supabase/
│   └── schema.sql            # SQL das tabelas (seção 5)
├── src/
│   ├── lib/
│   │   └── supabase.ts       # cliente do Supabase
│   ├── types/                # tipos TypeScript (Alimento, Funcionario, Registro)
│   ├── hooks/                # ex.: useRegistrosRealtime, useTotais
│   ├── components/           # peças de UI reutilizáveis
│   ├── pages/                # telas: Login, Registro, Painel, Config
│   ├── App.tsx
│   └── main.tsx
├── .env.local                # NÃO versionar
├── .gitignore
├── package.json
└── vite.config.ts
```

---

## 8. Deploy e manutenção

- **Deploy:** conectar o repositório do GitHub à Vercel. A cada `push`, ela
  publica sozinha. Configurar as variáveis de ambiente no painel da Vercel.
- **Dispositivo na petiscaria:** abrir o site no tablet e "instalar" como app
  (graças ao PWA). Deixar fixo na tela de registro.
- **Backup:** o plano gratuito do Supabase tem backup limitado. O próprio botão
  de "exportar relatório" já serve como backup prático dos dados. Exportar de
  tempos em tempos.
- **Quem cuida:** definir desde já quem mantém o sistema caso o desenvolvedor
  não esteja disponível.

---

## 9. Custos

| Item | Custo |
|---|---|
| Supabase (free) | R$ 0 |
| Vercel (hobby) | R$ 0 |
| GitHub | R$ 0 |
| Domínio próprio (opcional) | ~R$ 40/ano |

Nesse volume de dados, o projeto roda no gratuito por anos. O custo real é o
tempo de desenvolvimento.
