# CI — Integração Contínua

Portão de qualidade automático que roda a cada `push` na `main` e em cada Pull
Request. Definido em [.github/workflows/ci.yml](../.github/workflows/ci.yml).

## O que ele faz

Numa máquina limpa (Ubuntu), na ordem:

1. `npm ci` — instala as dependências travadas pelo `package-lock.json`.
2. `npm run lint` — ESLint.
3. `npm run typecheck` — `tsc -b --noEmit`.
4. `npm test` — Vitest (roda uma vez, sem watch).
5. `npm run build` — `tsc -b && vite build`.

Se **qualquer** passo falhar, o job fica vermelho — no PR isso aparece como
check reprovado antes do merge.

## Por que importa

Impede subir para a loja um código que não compila, quebra um teste ou tem erro
de lint. É a rede que te deixa iterar com o cliente usando o app sem medo de
publicar algo quebrado num ajuste rápido.

## Não precisa de secrets

- **Testes:** usam variáveis de ambiente fake definidas em
  [vite.config.ts](../vite.config.ts) (`test.env`), então não tocam no Supabase.
- **Build:** o Vite só empacota; o código que exige `VITE_SUPABASE_*`
  ([src/lib/supabase.ts](../src/lib/supabase.ts)) só roda no navegador, não no
  build. Por isso nenhuma credencial é necessária no CI.

## Como acompanhar

- Aba **Actions** do repositório no GitHub → workflow **CI**.
- Num PR, o check aparece no rodapé; clique em "Details" para ver qual passo
  falhou e o log.

## Rodando localmente (mesma sequência)

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Evoluções futuras (opcional)

- Badge de status no README.
- Cache de build / paralelizar passos se o tempo incomodar.
- Deploy automático só quando o CI passa (a Vercel já faz build no deploy;
  dá para exigir o check verde antes do merge via branch protection).
