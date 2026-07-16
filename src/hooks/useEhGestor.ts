// Gating de UX da aba Pratos (§2.2) — decide o que MOSTRAR/ESCONDER.
//
// ⚠️ NÃO é segurança. A regra de verdade (identificação real da gestora + RLS
// no Supabase) é do AGENTE DE LÓGICA/SEGURANÇA — ver docs/plano-tela-pratos-logica.md
// e docs/plano-seguranca.md.
//
// STUB VISUAL: retorna `true` para o preview conseguir abrir a aba. A derivação
// real (comentada abaixo) cruza o perfil selecionado com o papel 'gestor'.
export function useEhGestor(): boolean {
  return true

  // Derivação real (a ligar quando existir identificação de perfil):
  // const { funcionarioId } = useFuncionarioAtual()
  // const { funcionarios } = useFuncionarios(false)
  // return funcionarios.some((f) => f.id === funcionarioId && f.papel === 'gestor')
}
