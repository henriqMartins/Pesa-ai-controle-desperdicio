# Plano de testes manual — Pesa Aí

> Checklist de testes **manuais** (funcionais, UX, dados, infra e aceite) a
> executar antes de entregar/atualizar o sistema. Os testes **automatizados**
> (lógica de cálculo, agregação e exportação) estão em [testes.md](testes.md) e
> rodam com `npm test` — não se repetem aqui.

## Como usar

- Execute cada teste e marque **✅ passou** ou **❌ falhou**.
- Em caso de falha, anote o comportamento observado vs. esperado.
- Rode na ordem (do básico ao avançado). As telas são: **Monitor**, **Produtos**,
  **Equipe**, **Motivos**, e o **modal Registrar** (botão `＋ Registrar` no
  desktop / **FAB** no celular).

---

## 1. Configuração do ambiente (pré-requisito)

| # | Teste | Passos | Esperado |
|---|---|---|---|
| C1 | App carrega sem erros | Abrir a URL | Monitor aparece; sem erros no console |
| C2 | Conexão com Supabase | DevTools → Console | Sem erro de `VITE_SUPABASE_URL` ausente |
| C3 | Variáveis de ambiente | Conferir URL do projeto Supabase | Status 200 |
| C4 | Realtime habilitado | Abrir 2 abas | Registro feito numa aba aparece na outra sem recarregar |

---

## 2. Produtos (alimentos)

| # | Teste | Passos | Esperado |
|---|---|---|---|
| A1 | Adicionar produto completo | `＋ Novo` → nome + categoria + unidade + preço → salvar | Card aparece na grade |
| A2 | Adicionar sem categoria | Só nome + unidade + preço | Funciona; categoria em branco |
| A3 | Unidades base | Cadastrar um item em `kg`, um em `L` e um em `un` | Cada um exibe a unidade certa |
| A4 | Bloquear sem nome | Nome vazio → salvar | Botão desabilitado / não submete |
| A5 | Editar preço | Clicar no card → mudar preço → salvar | Preço atualizado no card |
| A6 | Desativar produto | Toggle ativo → inativo | Card marcado como inativo |
| A7 | Produto inativo some do Registrar | Desativar → abrir Registrar | Não aparece entre os alimentos |
| A8 | Preço zero é válido | Cadastrar com preço 0 | Aceita e salva |
| A9 | Busca filtra a grade | Digitar parte do nome na busca | Mostra só os correspondentes |

---

## 3. Equipe (funcionários)

| # | Teste | Passos | Esperado |
|---|---|---|---|
| F1 | Adicionar funcionário | `＋ Novo` → nome → salvar | Aparece na lista |
| F2 | Adicionar gestor | Papel "Gestor" → salvar | Aparece com label de gestor |
| F3 | Bloquear sem nome | Nome vazio | Botão desabilitado |
| F4 | Desativar funcionário | Toggle ativo → inativo | Marcado como inativo |
| F5 | Inativo some do Registrar | Desativar → abrir Registrar | Não aparece entre os funcionários |

---

## 4. Motivos

| # | Teste | Passos | Esperado |
|---|---|---|---|
| M1 | Cadastrar motivo | Digitar texto → adicionar | Aparece na lista |
| M2 | Motivo vira chip no Registrar | Cadastrar → abrir Registrar | Aparece como chip clicável |
| M3 | Desativar motivo | Desativar na aba Motivos | Some dos chips do Registrar, sem apagar histórico |
| M4 | Salvar motivo na hora | No Registrar, digitar motivo novo → `＋ salvar` | Vira chip reutilizável |

---

## 5. Registrar desperdício (modal)

### 5.1 Fluxo feliz

| # | Teste | Passos | Esperado |
|---|---|---|---|
| R1 | Registro completo | Funcionário + alimento + quantidade + unidade + motivo → Confirmar | Toast "Registro salvo!"; modal fecha |
| R2 | Custo calculado ao vivo | Frango (R$ 22/kg) + digitar `500 g` | Mostra "≈ R$ 11,00" antes de confirmar |
| R3 | Funcionário persiste | Selecionar funcionário → fechar e reabrir o app (F5) | Mesmo funcionário pré-selecionado (localStorage) |
| R4 | Registrar sem motivo | Deixar motivo vazio → Confirmar | Funciona; entra como "Sem motivo" no Monitor |
| R5 | Teclado numérico | Digitar quantidade pelo teclado próprio | Aceita dígitos e vírgula; sem teclado do SO no tablet |
| R6 | Unidade pré-preenchida | Selecionar um alimento em `kg` | Unidade padrão do alimento já vem selecionada |

### 5.2 Validações

| # | Teste | Passos | Esperado |
|---|---|---|---|
| R7 | Sem funcionário | Faltando o funcionário | Confirmar desabilitado |
| R8 | Sem alimento | Faltando o alimento | Confirmar desabilitado |
| R9 | Sem quantidade / zero | Quantidade vazia ou 0 | Confirmar desabilitado |
| R10 | Sem alimentos cadastrados | Banco sem alimento ativo | Mensagem orientando cadastrar em Produtos |
| R11 | Sem funcionários cadastrados | Banco sem funcionário ativo | Mensagem orientando cadastrar em Equipe |
| R12 | Sem duplo registro | Tocar Confirmar duas vezes rápido | Cria **apenas um** registro |

### 5.3 Mobile (bottom-sheet)

| # | Teste | Passos | Esperado |
|---|---|---|---|
| R13 | 3 passos no celular | Abrir pelo FAB | Alimento → quantidade/motivo → confirmar, com indicador de progresso |
| R14 | Snapshot do preço | Registrar Frango a R$ 22 → mudar preço p/ R$ 30 → ver no Monitor | Registro antigo mantém o custo com R$ 22 |

---

## 6. Monitor (dashboard ao vivo)

| # | Teste | Passos | Esperado |
|---|---|---|---|
| P1 | KPI do dia | Fazer 2 registros hoje | "Desperdício do dia" = soma dos custos |
| P2 | KPI do mês | Ver card do mês | Total do mês e contagem corretos |
| P3 | Média e projeção | Ver card de média | `média = total do mês ÷ dias decorridos`; projeção coerente |
| P4 | Últimos lançamentos | Após registros | Lista mostra alimento, funcionário, hora e custo |
| P5 | Mais desperdiçados | Registrar alimentos diferentes | Painel ordena o de maior valor primeiro, com barra proporcional |
| P6 | Principais motivos | Registros com motivos variados | Painel agrupa por motivo e ordena por valor |
| P7 | Maior do dia | Ver subtexto do card do dia | Mostra o alimento de maior custo do dia |
| P8 | Estado vazio | Mês sem registros | Painéis mostram "Sem dados no mês"; botões de exportar **não** aparecem |

### 6.1 Realtime

| # | Teste | Passos | Esperado |
|---|---|---|---|
| P9 | Novo registro ao vivo | Monitor numa aba → registrar em outra | KPIs e listas atualizam sem F5 |
| P10 | Modo de exibição (TV) | Abrir "Exibição" → registrar em outra aba | Tela cheia atualiza ao vivo |

---

## 7. Exportação (mês corrente)

| # | Teste | Passos | Esperado |
|---|---|---|---|
| E1 | Exportar Excel | Monitor com registros → "Exportar Excel" | `.xlsx` com 3 abas: Registros, Top Alimentos, Ranking |
| E2 | Conteúdo do Excel | Abrir o arquivo | Dados batem com a tela; data/hora em formato BR |
| E3 | Exportar PDF | "Exportar PDF" | `.pdf` com cabeçalho, tabelas e lista |
| E4 | Nome do arquivo | Ver o arquivo baixado | Nome contém o mês/ano (ex.: `desperdicio-junho-de-2026`) |
| E5 | PDF longo | Mais de ~50 registros no mês | Quebra em páginas sem cortar conteúdo |

> A lógica de montagem do Excel/PDF tem **teste automatizado** ([testes.md](testes.md));
> aqui validamos o arquivo real aberto.

---

## 8. UX e desempenho

| # | Teste | Passos | Esperado |
|---|---|---|---|
| U1 | Tempo de registro | Do toque até o toast | Menos de ~30 s para usuário treinado |
| U2 | Tablet (7–10") | Abrir no tablet | Botões grandes, sem corte, sem scroll horizontal |
| U3 | Celular | Abrir no smartphone | Bottom-nav + FAB usáveis |
| U4 | Carregamento | Primeira abertura | Tela em < 3 s (rede normal) |
| U5 | Alvo de toque | Botões no tablet | Nenhum menor que ~44px |
| U6 | Feedback ao salvar | Tocar Confirmar | Botão indica "Salvando…" durante o envio |
| U7 | Tema claro/escuro | Alternar sol/lua | Troca aplicada e persiste após F5, sem flash |

---

## 9. Dados e integridade

| # | Teste | Passos | Esperado |
|---|---|---|---|
| D1 | Custo correto | Registrar 300 g de frango a R$ 22/kg | Custo = R$ 6,60 |
| D2 | Custo vem do banco | Ver registro no Supabase (Table Editor) | Coluna `custo` preenchida pelo banco, não pelo front |
| D3 | Snapshot preservado | Ver `preco_unitario_no_momento` | Valor do momento do registro, não o atual |
| D4 | Quantidade decimal | Registrar `1,5 kg` | Aceita e exibe corretamente |
| D5 | Total vs soma | Somar custos do Excel à mão | Igual ao total do Monitor |
| D6 | IDs únicos | Dois registros iguais | Dois registros, IDs diferentes |

---

## 10. Infraestrutura

| # | Teste | Passos | Esperado |
|---|---|---|---|
| I1 | Deploy automático | Push para `main` | Vercel reconstrói e publica em ~1 min |
| I2 | Variáveis na Vercel | Abrir a URL da Vercel | Funciona igual ao local; sem erro de Supabase |
| I3 | HTTPS | Conferir a URL | Cadeado válido (SSL) |
| I4 | PWA Android | Chrome → instalar | Ícone na tela inicial; abre sem barra de endereços |
| I5 | PWA iPad | Safari → Adicionar à Tela de Início | Idem ao I4 |
| I6 | Funciona instalado | Abrir pelo ícone | Todas as telas funcionam |

---

## 11. Regressão rápida (após qualquer mudança)

> Antes de commitar, rode também os testes automatizados: `npm test`.

| # | Teste rápido | O que verifica |
|---|---|---|
| REG1 | Registrar e ver no Monitor | Fluxo principal inteiro |
| REG2 | Cadastrar produto e usá-lo no Registrar | Integração Produtos → Registrar |
| REG3 | Exportar Excel | Exportação ainda funciona |
| REG4 | Abrir 2 abas e registrar | Realtime funcionando |
| REG5 | Trocar tema e dar F5 | Tema persiste (localStorage) |

---

## 12. Aceite (com a cliente)

| # | Cenário real | O que verificar |
|---|---|---|
| AC1 | Funcionária registra o desperdício do almoço | Fluxo intuitivo? Menos de 1 min? |
| AC2 | Dona vê o total do dia à noite | Número bate com o que ela acompanhou? |
| AC3 | Dona exporta o mês | Excel/PDF abrem no aparelho dela? |
| AC4 | Cadastrar os alimentos reais | Todos os itens do cardápio cabem? |
| AC5 | Instalar no tablet do estabelecimento | Ícone aparece? Abre rápido? |
| AC6 | Registrar em horário de pico | Rápido o bastante para não atrapalhar o serviço? |
