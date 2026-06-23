# Plano de Infraestrutura — Deploy e Produção

> Este documento cobre tudo que precisa ser feito para colocar o sistema em
> produção na petiscaria. Siga as etapas **nesta ordem**.

---

## Pré-requisitos

Antes de começar, confirme que você tem:

- [ ] Conta no **GitHub** (repositório já criado: `henriqMartins/Pesa-ai-controle-desperdicio`)
- [ ] Conta no **Supabase** (supabase.com) — plano gratuito
- [ ] Conta na **Vercel** (vercel.com) — plano Hobby (gratuito)
- [ ] Projeto Supabase com as três tabelas criadas (`supabase/schema.sql` já rodado)
- [ ] Node.js 22+ instalado localmente (para testes locais antes do deploy)

---

## Etapa 1 — Configurar o Supabase

### 1.1 Rodar o schema (se ainda não foi feito)

1. Acesse o painel do seu projeto Supabase
2. Vá em **SQL Editor → New query**
3. Cole o conteúdo de `supabase/schema.sql` e clique **Run**
4. Verifique em **Table Editor** que as tabelas `alimentos`, `funcionarios` e `registros` existem

### 1.2 Habilitar Realtime para a tabela `registros`

O Painel usa Realtime para atualizar ao vivo. Sem isso, ele não atualiza
automaticamente.

No **SQL Editor**, rode:

```sql
alter publication supabase_realtime add table registros;
```

> **Confirmar:** Vá em **Database → Replication** e veja se `registros` aparece
> na lista de tabelas publicadas.

### 1.3 Popular com dados iniciais

Via a tela de Configuração do app (após o deploy) **ou** pelo SQL Editor:

```sql
-- Alimentos de exemplo (adapte para os da petiscaria)
insert into alimentos (nome, categoria, valor_por_kg) values
  ('Arroz', 'Grãos', 8.50),
  ('Frango', 'Proteína', 22.00),
  ('Batata Frita', 'Frituras', 12.00),
  ('Feijão', 'Grãos', 9.00),
  ('Camarão', 'Frutos do mar', 65.00);

-- Funcionários (adapte os nomes reais)
insert into funcionarios (nome, papel) values
  ('Maria', 'gestor'),
  ('João', 'funcionario'),
  ('Ana', 'funcionario');
```

### 1.4 Copiar as credenciais

Em **Project Settings → API**:
- Copie a **Project URL** → vai para `VITE_SUPABASE_URL`
- Copie a **anon public** key → vai para `VITE_SUPABASE_ANON_KEY`

> Nunca use a `service_role` key no front-end.

---

## Etapa 2 — Deploy na Vercel

### 2.1 Conectar o repositório

1. Acesse vercel.com e clique em **Add New → Project**
2. Selecione **Import Git Repository**
3. Autorize o acesso ao GitHub e selecione `Pesa-ai-controle-desperdicio`
4. Deixe as configurações padrão:
   - **Framework Preset:** Vite (detectado automaticamente)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### 2.2 Configurar variáveis de ambiente

Ainda na tela de import (antes de clicar em Deploy), em **Environment Variables**:

| Nome | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://xxxxxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_...` |

> **Importante:** As variáveis que começam com `VITE_` são expostas no bundle
> do front-end — isso é esperado e seguro para a `anon key`. Nunca adicione
> chaves secretas aqui.

### 2.3 Fazer o deploy

Clique em **Deploy**. A Vercel vai:
1. Clonar o repositório
2. Rodar `npm install`
3. Rodar `npm run build`
4. Publicar a pasta `dist`

O processo leva ~1 minuto. Você receberá uma URL como
`https://pesa-ai-controle-desperdicio.vercel.app`.

### 2.4 Configurar deploy automático

Após o primeiro deploy, a Vercel detecta automaticamente pushes no branch
`main` e redesploya. Nenhuma configuração adicional é necessária.

Para testar: faça qualquer mudança no código, comite e faça push para `main`.
A Vercel publicará a nova versão em ~1 minuto.

---

## Etapa 3 — Instalar como PWA no tablet

O app foi configurado como PWA (Progressive Web App), o que permite instalá-lo
no tablet como se fosse um aplicativo nativo.

### No Android (Chrome)
1. Abra o Chrome no tablet
2. Acesse a URL da Vercel
3. Toque no menu (três pontos) → **Adicionar à tela inicial**
4. Confirme o nome "Pesa Aí" e toque em **Adicionar**

### No iPad/iPhone (Safari)
1. Abra o Safari
2. Acesse a URL da Vercel
3. Toque no ícone de compartilhar (quadrado com seta)
4. Selecione **Adicionar à Tela de Início**
5. Confirme e toque em **Adicionar**

Após instalar, o app abre em tela cheia (sem barra de endereços), parecendo um
app nativo. Deixe o tablet sempre na tela de **Registro** para uso rápido.

---

## Etapa 4 — (Opcional) Domínio personalizado

Se a dona quiser um endereço mais fácil de lembrar (ex.: `pesaai.com.br`):

1. Registre o domínio em um registrador brasileiro (ex.: Registro.br ~R$ 40/ano)
2. No painel da Vercel, vá em **Project Settings → Domains**
3. Adicione o domínio e siga as instruções de DNS (adicionar um registro `CNAME`
   apontando para `cname.vercel-dns.com`)
4. A Vercel provisiona o certificado SSL automaticamente (HTTPS)

---

## Etapa 5 — Manutenção contínua

### Atualizar o sistema
```bash
# Faça as mudanças no código localmente
npm run dev          # teste local
npm run typecheck    # verifique tipos
git add <arquivos>
git commit -m "descrição"
git push origin main  # Vercel faz o deploy automaticamente
```

### Backup dos dados
O plano gratuito do Supabase tem backup diário por 7 dias. Para backup manual:

1. No Supabase → **Table Editor** → selecione uma tabela → **Export**
2. Ou use o botão **Exportar Excel** no Painel do app

> Recomendação: exportar uma planilha mensalmente e guardar.

### Monitorar uso (Supabase free tier)
O plano gratuito suporta:
- 500 MB de banco de dados
- 5 GB de transferência/mês
- 50.000 usuários ativos/mês

Para uma petiscaria com 5 funcionários e ~100 registros/dia, o projeto roda
no gratuito **por anos** sem atingir nenhum limite.

### Pausar o projeto Supabase
Projetos Supabase gratuitos pausam automaticamente após **7 dias sem atividade**.
Para evitar isso, acesse o painel do Supabase pelo menos uma vez por semana,
ou configure um `cron job` simples para fazer um `ping` na API.

---

## Resumo de custos

| Item | Custo |
|---|---|
| Supabase (free) | R$ 0 |
| Vercel (hobby) | R$ 0 |
| GitHub | R$ 0 |
| Domínio `.com.br` (opcional) | ~R$ 40/ano |
| **Total** | **R$ 0 – R$ 40/ano** |
