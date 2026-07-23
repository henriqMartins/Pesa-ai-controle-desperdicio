import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Session } from '@supabase/supabase-js'

// Núcleo da Fase 1: o PIN vira senha de uma conta Auth por papel, e o papel é
// lido do app_metadata (nunca do user_metadata, que o usuário editaria). O
// client do Supabase é mockado — o que importa aqui é o contrato de auth.ts.

// vi.hoisted garante que os mocks existam antes do vi.mock (que é içado ao topo).
const { signInWithPassword, signOut } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('./supabase', () => ({
  supabase: { auth: { signInWithPassword, signOut } },
}))

import { entrarComPin, sair, papelDaSessao } from './auth'

function sessaoCom(
  appMeta: Record<string, unknown>,
  userMeta: Record<string, unknown> = {},
): Session {
  return { user: { app_metadata: appMeta, user_metadata: userMeta } } as unknown as Session
}

beforeEach(() => vi.clearAllMocks())

describe('entrarComPin', () => {
  it('loga o gestor com o email fantasma e o PIN como senha', async () => {
    signInWithPassword.mockResolvedValue({ error: null })
    await entrarComPin('gestor', '123456')
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'gestor@petiscaria.local',
      password: '123456',
    })
  })

  it('usa o email do funcionário quando o papel é funcionario', async () => {
    signInWithPassword.mockResolvedValue({ error: null })
    await entrarComPin('funcionario', '000000') // preserva zeros à esquerda
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'funcionario@petiscaria.local',
      password: '000000',
    })
  })

  it('lança quando o PIN está errado', async () => {
    signInWithPassword.mockResolvedValue({ error: new Error('Invalid login credentials') })
    await expect(entrarComPin('funcionario', '999999')).rejects.toThrow()
  })
})

describe('papelDaSessao', () => {
  it('lê o papel do app_metadata', () => {
    expect(papelDaSessao(sessaoCom({ papel: 'gestor' }))).toBe('gestor')
    expect(papelDaSessao(sessaoCom({ papel: 'funcionario' }))).toBe('funcionario')
  })

  it('ignora o user_metadata — não é fonte de autorização', () => {
    // Mesmo que o usuário injete papel:gestor no user_metadata, não vale nada.
    expect(papelDaSessao(sessaoCom({}, { papel: 'gestor' }))).toBeNull()
  })

  it('retorna null sem sessão ou com papel desconhecido', () => {
    expect(papelDaSessao(null)).toBeNull()
    expect(papelDaSessao(sessaoCom({ papel: 'chef' }))).toBeNull()
  })
})

describe('sair', () => {
  it('encerra a sessão', () => {
    signOut.mockResolvedValue({ error: null })
    sair()
    expect(signOut).toHaveBeenCalled()
  })
})
