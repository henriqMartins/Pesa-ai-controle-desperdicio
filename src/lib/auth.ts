// Autenticação por PIN (Fase 1 do plano de segurança).
//
// O usuário só vê um teclado de PIN. Por baixo, o PIN É a senha de uma conta
// do Supabase Auth com email "fantasma" — quem digita nunca vê o email. Isso
// reaproveita rate limiting, expiração e refresh de token nativos e, acima de
// tudo, gera a SESSÃO autenticada em que o RLS da Fase 2 vai se apoiar.
// Ver docs/plano-seguranca.md.
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

/** Papéis do sistema — definem autorização (o que cada conta pode fazer). */
export type Papel = 'gestor' | 'funcionario'

/**
 * Emails "fantasma": ninguém os digita. São constantes embutidas; o que o
 * usuário fornece é só o PIN, usado como senha.
 */
const EMAILS: Record<Papel, string> = {
  gestor: 'gestor@petiscaria.local',
  funcionario: 'funcionario@petiscaria.local',
}

/**
 * Faz login com o PIN como senha. Lança quando o PIN está errado (o chamador
 * trata o erro para exibir feedback). Em caso de sucesso, o client do Supabase
 * persiste a sessão (localStorage) e a renova automaticamente.
 */
export async function entrarComPin(papel: Papel, pin: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: EMAILS[papel],
    password: pin,
  })
  if (error) throw error
}

/**
 * Encerra a sessão (volta para a TelaPin). Usa `scope: 'local'`: limpa a sessão
 * SÓ neste aparelho, sem a chamada de rede de revogação do `signOut` global —
 * essa chamada segura o lock interno do cliente de auth e faz o
 * `signInWithPassword` seguinte (relogar) travar até ela responder. Local é
 * instantâneo e adequado a um dispositivo de balcão compartilhado.
 */
export const sair = () => supabase.auth.signOut({ scope: 'local' })

/**
 * Lê o papel do JWT. Vem de `app_metadata` — que só a service_role altera — e
 * NUNCA de `user_metadata`, que o próprio usuário logado poderia editar via
 * `auth.updateUser` para se promover a gestor. Como o papel gatilha o RLS da
 * Fase 2, ele precisa ser inviolável pelo cliente.
 */
export function papelDaSessao(session: Session | null): Papel | null {
  const papel = session?.user.app_metadata?.papel
  return papel === 'gestor' || papel === 'funcionario' ? papel : null
}
