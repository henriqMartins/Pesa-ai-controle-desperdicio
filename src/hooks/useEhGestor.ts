// Gating de UX da aba Pratos (§2.2) — decide o que MOSTRAR/ESCONDER.
//
// ⚠️ Isto é UX, NÃO segurança. Esconder a aba no front não protege o banco:
// hoje o RLS de `pratos`/`prato_ingredientes` é permissivo. A restrição REAL
// por papel (Supabase Auth + RLS por papel) fica para a fase de segurança —
// ver docs/plano-seguranca.md.
//
// Derivação: o perfil ativo é o último funcionário selecionado no fluxo de
// registro (useFuncionarioAtual, em localStorage). É gestor quando esse
// funcionário tem papel 'gestor'.
import { useFuncionarioAtual } from './useFuncionarioAtual'
import { useFuncionarios } from './useFuncionarios'

export function useEhGestor(): boolean {
  const { funcionarioId } = useFuncionarioAtual()
  const { funcionarios } = useFuncionarios(false)
  if (!funcionarioId) return false
  return funcionarios.some((f) => f.id === funcionarioId && f.papel === 'gestor')
}
