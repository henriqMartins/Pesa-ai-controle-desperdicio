# Plano de Testes — Pesa Aí

> Testes funcionais, de regressão, UX, dados e infraestrutura que devem ser
> executados manualmente antes de entregar o sistema à cliente.
> Testes unitários automatizados são responsabilidade do desenvolvedor e não
> constam aqui.

---

## Como usar este documento

- Execute cada teste e marque **✅ passou** ou **❌ falhou**
- Em caso de falha, anote o comportamento observado vs. esperado
- Recomendado: rodar na ordem apresentada (do básico ao avançado)

---

## 1. Testes de Configuração (pré-requisito)

> Valida que o ambiente está corretamente configurado.

| # | Teste | Passos | Esperado |
|---|---|---|---|
| C1 | App carrega sem erros | Abrir a URL no navegador | Tela de Registro aparece, sem erros no console |
| C2 | Conexão com Supabase | Abrir DevTools → Console | Sem erros de `VITE_SUPABASE_URL` ausente |
| C3 | Variáveis de ambiente | Verificar se a URL da Supabase responde | Status 200 na URL do projeto Supabase |
| C4 | Realtime habilitado | Abrir 2 abas do app | Registro feito em uma aba aparece na outra sem recarregar |

---

## 2. Testes da Tela de Configuração

### 2.1 Cadastro de Alimentos

| # | Teste | Passos | Esperado |
|---|---|---|---|
| A1 | Adicionar alimento completo | Preencher nome + categoria + R$/kg → Adicionar | Item aparece na lista com os dados corretos |
| A2 | Adicionar alimento sem categoria | Preencher só nome + R$/kg → Adicionar | Funciona; categoria fica em branco |
| A3 | Bloquear alimento sem nome | Deixar nome vazio → Adicionar | Botão fica desabilitado / não submete |
| A4 | Bloquear R$/kg sem valor | Deixar R$/kg vazio → Adicionar | Botão fica desabilitado / não submete |
| A5 | Editar preço de alimento | Clicar "Editar preço" → novo valor → Salvar | Preço atualizado na lista |
| A6 | Desativar alimento | Clicar "Desativar" | Alimento aparece riscado na lista |
| A7 | Reativar alimento | Clicar "Reativar" em item desativado | Alimento volta ao normal |
| A8 | Alimento desativado some do Registro | Desativar um alimento → ir para Registro | Alimento não aparece mais na tela de Registro |
| A9 | Preço zero é válido | Cadastrar alimento com R$/kg = 0 | Aceita e salva |

### 2.2 Cadastro de Funcionários

| # | Teste | Passos | Esperado |
|---|---|---|---|
| F1 | Adicionar funcionário | Preencher nome → Adicionar | Aparece na lista |
| F2 | Adicionar gestor | Selecionar papel "Gestor" → Adicionar | Aparece com label "Gestor" |
| F3 | Bloquear sem nome | Deixar nome vazio → Adicionar | Botão desabilitado |
| F4 | Desativar funcionário | Clicar "Desativar" | Nome riscado na lista |
| F5 | Funcionário desativado some do Registro | Desativar → ir para Registro | Não aparece mais nos botões de funcionário |

---

## 3. Testes da Tela de Registro

### 3.1 Fluxo feliz (caminho principal)

| # | Teste | Passos | Esperado |
|---|---|---|---|
| R1 | Registrar desperdício completo | Selecionar funcionário + alimento + peso → Confirmar | Mensagem "Registro salvo com sucesso!" por 3 segundos |
| R2 | Formulário reseta após confirmação | Após sucesso do R1 | Alimento e peso limpos; funcionário mantido |
| R3 | Funcionário persiste após recarregar | Selecionar funcionário → F5 na página | Mesmo funcionário já selecionado |
| R4 | Preview de custo calcula corretamente | Selecionar Frango (R$ 22/kg) + digitar 500g | Exibe "≈ R$ 11,00" em tempo real |
| R5 | Registrar com motivo | Preencher campo motivo → Confirmar | Registro salvo; motivo aparece no banco |
| R6 | Registrar sem motivo | Deixar motivo em branco → Confirmar | Funciona normalmente |

### 3.2 Validações

| # | Teste | Passos | Esperado |
|---|---|---|---|
| R7 | Sem funcionário selecionado | Selecionar alimento + peso, sem funcionário | Botão "Confirmar" desabilitado |
| R8 | Sem alimento selecionado | Selecionar funcionário + peso, sem alimento | Botão "Confirmar" desabilitado |
| R9 | Sem peso | Selecionar funcionário + alimento, peso vazio | Botão "Confirmar" desabilitado |
| R10 | Peso zero | Digitar 0 no campo peso | Botão "Confirmar" desabilitado |
| R11 | Peso negativo | Digitar -100 | Botão desabilitado (campo min=1) |

### 3.3 Estados especiais

| # | Teste | Passos | Esperado |
|---|---|---|---|
| R12 | Sem alimentos cadastrados | Banco sem nenhum alimento ativo | Mensagem "Nenhum alimento cadastrado. Vá em Configuração." |
| R13 | Sem funcionários cadastrados | Banco sem nenhum funcionário ativo | Mensagem "Nenhum funcionário cadastrado. Vá em Configuração." |
| R14 | Snapshot do preço | Registrar frango a R$ 22/kg → alterar preço para R$ 30/kg → ver registro no Painel | Registro antigo continua mostrando o custo calculado com R$ 22/kg |

---

## 4. Testes do Painel

### 4.1 Totais e dados

| # | Teste | Passos | Esperado |
|---|---|---|---|
| P1 | Total no período calcula corretamente | Fazer 2 registros conhecidos → ver Painel | Soma dos custos bate com o total exibido |
| P2 | Lista de registros aparece | Após registros feitos | Lista exibe alimento, peso, funcionário, custo e data |
| P3 | Top alimentos ordenado por custo | Registrar vários alimentos diferentes | Top alimentos mostra o mais caro primeiro |
| P4 | Ranking ordenado por total | Registros de diferentes funcionários | Funcionário com maior total aparece primeiro |

### 4.2 Filtros

| # | Teste | Passos | Esperado |
|---|---|---|---|
| P5 | Filtro "Hoje" | Clicar "Hoje" | Só registros do dia atual aparecem |
| P6 | Filtro "Últimos 7 dias" | Clicar "Últimos 7 dias" | Registros dos últimos 7 dias (inclusive hoje) |
| P7 | Filtro "Este mês" | Clicar "Este mês" | Registros desde o dia 1 do mês atual |
| P8 | Filtro personalizado | Selecionar "Personalizado" → datas → Aplicar | Apenas registros no intervalo selecionado |
| P9 | Filtro sem resultado | Selecionar período sem registros | Mensagem "Nenhum registro no período selecionado." |
| P10 | Total vira zero com filtro vazio | Filtrar período sem dados | Total exibe "R$ 0,00" e lista de registros vazia |
| P11 | Botões de export somem com período vazio | Filtrar período sem registros | Botões "Exportar Excel" e "Exportar PDF" não aparecem |

### 4.3 Realtime

| # | Teste | Passos | Esperado |
|---|---|---|---|
| P12 | Novo registro aparece ao vivo | Abrir Painel em uma aba → registrar em outra | Registro aparece na lista sem recarregar a página |
| P13 | Total atualiza ao vivo | Mesmas abas do P12 | Total do Painel aumenta automaticamente |
| P14 | Realtime funciona no mesmo dispositivo | Abrir Painel → registrar na mesma aba (navegar de volta) | Painel atualiza ao retornar |

---

## 5. Testes de Exportação

| # | Teste | Passos | Esperado |
|---|---|---|---|
| E1 | Exportar Excel com dados | Painel com registros → Exportar Excel | Arquivo `.xlsx` baixado com 3 abas: Registros, Top Alimentos, Ranking |
| E2 | Conteúdo do Excel correto | Abrir o arquivo baixado | Dados batem com o que está na tela; data/hora em formato brasileiro |
| E3 | Exportar PDF com dados | Painel com registros → Exportar PDF | Arquivo `.pdf` baixado com cabeçalho, tabelas e lista de registros |
| E4 | Nome do arquivo inclui período | Exportar com filtro "Este mês" ativo | Nome do arquivo contém o mês/período |
| E5 | Export respeita filtro ativo | Filtrar "Hoje" → exportar | Excel/PDF contém apenas os registros do dia |
| E6 | PDF com muitos registros | Mais de 50 registros no período | PDF gera novas páginas automaticamente, sem cortar conteúdo |

---

## 6. Testes de UX e Desempenho

| # | Teste | Passos | Esperado |
|---|---|---|---|
| U1 | Tempo de registro | Medir do toque no nome até "Registro salvo" | Menos de 30 segundos para um usuário treinado |
| U2 | Responsividade no tablet | Abrir app no tablet (7–10 polegadas) | Botões grandes, sem texto cortado, sem scroll horizontal |
| U3 | Responsividade no celular | Abrir app em smartphone | Layout se adapta, usável mesmo sem ser o foco principal |
| U4 | Carregamento inicial | Abrir o app pela primeira vez | Tela aparece em menos de 3 segundos (rede normal) |
| U5 | Botões têm tamanho adequado para toque | Testar no tablet | Nenhum botão menor que ~44px de altura |
| U6 | Feedback visual no botão Confirmar | Clicar em Confirmar | Botão muda para "Salvando..." durante o envio |
| U7 | Nenhuma ação duplicada | Clicar rapidamente duas vezes em Confirmar | Apenas um registro é criado |

---

## 7. Testes de Dados e Integridade

| # | Teste | Passos | Esperado |
|---|---|---|---|
| D1 | Custo calculado corretamente | Registrar 300g de frango a R$ 22/kg | Custo = R$ 6,60 no Painel |
| D2 | Custo gerado pelo banco | Ver registro no Supabase (Table Editor) | Coluna `custo` preenchida pelo banco, não pelo front |
| D3 | Snapshot de preço preservado | Ver `preco_kg_no_momento` no banco | Valor registrado no momento, não o atual |
| D4 | Registro com peso decimal | Registrar 1500.5g | Aceita e exibe corretamente |
| D5 | Consistência total vs soma manual | Somar manualmente os custos no Excel | Igual ao total exibido no Painel |
| D6 | IDs únicos | Registrar dois desperdícios iguais | Dois registros separados, com IDs diferentes |

---

## 8. Testes de Infraestrutura

| # | Teste | Passos | Esperado |
|---|---|---|---|
| I1 | Deploy automático | Fazer um push para `main` | Vercel reconstrói e publica em ~1 minuto |
| I2 | Variáveis de ambiente na Vercel | Abrir app na URL da Vercel (não localhost) | Funciona igual ao local; sem erros de Supabase |
| I3 | HTTPS na Vercel | Verificar URL | Cadeado verde no navegador (certificado SSL válido) |
| I4 | PWA instalável no tablet Android | Acessar no Chrome → instalar | Ícone aparece na tela inicial; abre sem barra de endereços |
| I5 | PWA instalável no iPad | Acessar no Safari → Adicionar à Tela de Início | Idem ao I4 |
| I6 | App funciona após instalar PWA | Abrir pelo ícone na tela inicial | Carrega normalmente, todas as telas funcionam |

---

## 9. Testes de Regressão

> Executar sempre que uma mudança for feita no código.

| # | Teste rápido | O que verifica |
|---|---|---|
| REG1 | Registrar um desperdício e ver no Painel | Fluxo principal inteiro não quebrou |
| REG2 | Adicionar alimento e usá-lo no Registro | Configuração → Registro integração |
| REG3 | Exportar Excel após registros | Export ainda funciona |
| REG4 | Filtro "Este mês" mostra dados corretos | Hook de filtro funcionando |
| REG5 | Funcionário selecionado persiste no F5 | localStorage ainda funciona |

---

## 10. Testes de Aceite (com a cliente)

> Executar junto com a dona da petiscaria antes da entrega final.

| # | Cenário real | O que verificar |
|---|---|---|
| AC1 | Funcionária registra o desperdício do almoço | Fluxo é intuitivo? Menos de 1 minuto? |
| AC2 | Dona vê o total do dia à noite | Número bate com o que ela acompanhou presencialmente? |
| AC3 | Dona filtra o mês anterior e exporta | Excel abre corretamente no celular/computador dela? |
| AC4 | Cadastrar os alimentos reais da petiscaria | Todos os itens do cardápio cabem? Nomes estão corretos? |
| AC5 | Instalar o app no tablet usado no estabelecimento | Ícone aparece? Abre rápido? |
| AC6 | Registrar em horário de pico (funcionárias com pressa) | O fluxo é rápido o suficiente para não atrapalhar o serviço? |
