import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/**
 * Estado reativo da sessão de Auth. É a fonte de verdade para "está logado?"
 * e, via `papelDaSessao`, para o papel do usuário. Sincroniza com login,
 * logout e refresh de token através do `onAuthStateChange`.
 *
 * `carregando` cobre o intervalo até o `getSession` inicial responder — sem
 * ele, o app piscaria a TelaPin por um instante mesmo com sessão salva.
 */
export function useSessao() {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, carregando }
}
