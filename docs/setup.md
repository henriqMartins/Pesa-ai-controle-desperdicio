# Setup do ambiente — passo a passo

> Derivado de [base.md](base.md) (seções 6 e 8). Veja também a
> [arquitetura](arquitetura.md) e o [modelo de dados](modelo-dados.md).

## Pré-requisitos

1. **Node.js LTS** (versão 22 ou superior). Baixe em nodejs.org.
   Confirme: `node -v` e `npm -v`.
2. **Git** instalado. Confirme: `git --version`.
3. Conta no **GitHub**, no **Supabase** (supabase.com) e na **Vercel**
   (vercel.com) — todas com plano gratuito.

## Instalar dependências do projeto

O projeto já foi inicializado com Vite + React 19 + TypeScript. Para preparar o
ambiente, basta:

```bash
npm install
```

As dependências principais já estão no `package.json`:

```bash
# (referência — já instaladas)
npm install @supabase/supabase-js xlsx jspdf react-router-dom
npm install -D tailwindcss@^3 postcss autoprefixer vite-plugin-pwa
```

> **Aviso sobre o `xlsx` (SheetJS):** a versão publicada no npm tem um alerta de
> segurança (prototype pollution / ReDoS) sem correção no registro. Para este
> projeto — geração de planilhas no navegador, ambiente confiável — o risco é
> baixo. Na etapa de relatórios, avalie instalar a versão oficial pelo CDN da
> SheetJS, conforme a documentação deles.

## Configurar o Supabase (nuvem, sem Docker)

1. Crie um projeto novo no painel do Supabase.
2. Vá em **SQL Editor** e rode o SQL de [`supabase/schema.sql`](../supabase/schema.sql).
3. Em **Project Settings → API**, copie a **Project URL** e a **anon key**.

## Variáveis de ambiente

Copie o `.env.example` para `.env.local` na raiz e preencha:

```
VITE_SUPABASE_URL=...sua project url...
VITE_SUPABASE_ANON_KEY=...sua anon key...
```

O `.env.local` já está no `.gitignore` — **não** versione esse arquivo. O
cliente em `src/lib/supabase.ts` lê essas variáveis e falha com mensagem clara
se estiverem ausentes.

## Rodar localmente

```bash
npm run dev
```

## Deploy e manutenção

- **Deploy:** conectar o repositório do GitHub à Vercel. A cada `push`, ela
  publica sozinha. Configure as variáveis de ambiente no painel da Vercel.
- **Dispositivo na petiscaria:** abrir o site no tablet e "instalar" como app
  (graças ao PWA). Deixar fixo na tela de registro.
- **Backup:** o plano gratuito do Supabase tem backup limitado. O próprio botão
  de "exportar relatório" já serve como backup prático dos dados. Exportar de
  tempos em tempos.
- **Quem cuida:** definir desde já quem mantém o sistema caso o desenvolvedor
  não esteja disponível.

## Custos

| Item | Custo |
|---|---|
| Supabase (free) | R$ 0 |
| Vercel (hobby) | R$ 0 |
| GitHub | R$ 0 |
| Domínio próprio (opcional) | ~R$ 40/ano |

Nesse volume de dados, o projeto roda no gratuito por anos. O custo real é o
tempo de desenvolvimento.
