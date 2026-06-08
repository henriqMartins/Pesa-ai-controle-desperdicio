# Modelo de dados

> Derivado de [base.md](base.md) (seção 5). O SQL canônico vive em
> [`supabase/schema.sql`](../supabase/schema.sql) e os tipos correspondentes em
> [`src/types/`](../src/types/).

Três tabelas resolvem quase tudo. Totais e rankings são **consultas** sobre a
tabela de registros — não precisam de tabela própria.

## Tabelas

### `alimentos`
Alimentos cadastrados pela dona.

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()`. |
| `nome` | text | Obrigatório. |
| `categoria` | text | Opcional. |
| `valor_por_kg` | numeric(10,2) | Obrigatório, `>= 0`. |
| `ativo` | boolean | Default `true`. |
| `criado_em` | timestamptz | Default `now()`. |

### `funcionarios`
Usados para login simples e atribuição do registro.

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()`. |
| `nome` | text | Obrigatório. |
| `pin` | text | PIN de 4 dígitos (controle leve, não segurança forte). |
| `papel` | text | `'funcionario'` ou `'gestor'`; default `'funcionario'`. |
| `ativo` | boolean | Default `true`. |
| `criado_em` | timestamptz | Default `now()`. |

### `registros`
Registros de desperdício.

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()`. |
| `alimento_id` | uuid | FK → `alimentos(id)`. |
| `funcionario_id` | uuid | FK → `funcionarios(id)`. |
| `peso_g` | numeric(10,2) | Obrigatório, `> 0`. |
| `preco_kg_no_momento` | numeric(10,2) | **Snapshot** do preço no instante do registro. |
| `custo` | numeric(10,2) | **Coluna gerada** pelo banco; não é enviada pelo cliente. |
| `motivo` | text | Opcional. |
| `criado_em` | timestamptz | Default `now()`. Indexada (`idx_registros_criado_em`). |

**Detalhe importante:** `preco_kg_no_momento` guarda o preço **no momento do
registro**. Como o preço dos alimentos muda, sem isso os relatórios antigos
seriam recalculados com o preço de hoje e ficariam errados. O campo `custo` é
calculado pelo próprio banco (coluna gerada), garantindo consistência:

```sql
custo numeric(10,2)
  generated always as
  (round((peso_g / 1000.0) * preco_kg_no_momento, 2)) stored
```

## Consultas (totais e rankings)

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

-- Ranking de funcionários (só para a gestão)
select f.nome, sum(r.custo) as total
from registros r join funcionarios f on f.id = r.funcionario_id
group by f.nome
order by total desc;
```

## RLS (ponto de partida pragmático)

Para começar, ative o RLS e crie políticas permitindo leitura/escrita ao usuário
autenticado do app. Refine depois (ex.: só `gestor` enxerga o ranking).
Mantenha simples no início — é um ambiente confiável (um único local). Os
comandos `enable row level security` estão comentados no `schema.sql`, prontos
para a etapa de controle de acesso.
