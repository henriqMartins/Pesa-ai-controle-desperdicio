// Autorização por papel — decide o que MOSTRAR/ESCONDER na UI (ex.: aba Pratos).
//
// O papel vem agora da SESSÃO de Auth (app_metadata do JWT, via papelDaSessao),
// não mais do funcionário escolhido no dropdown. Assim o gating acompanha a
// conta logada (gestor × funcionário), e não a atribuição do registro.
//
// ⚠️ Continua sendo UX, NÃO segurança: esconder a aba no front não fecha o
// banco. A restrição real por papel é o RLS (Fase 2) — ver docs/plano-seguranca.md.
import { useSessao } from './useSessao'
import { papelDaSessao } from '../lib/auth'

export function useEhGestor(): boolean {
  const { session } = useSessao()
  return papelDaSessao(session) === 'gestor'
}
