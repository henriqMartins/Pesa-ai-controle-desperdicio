import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLockout, MAX_TENTATIVAS, BLOQUEIO_MS } from './useLockout'

// Lockout: bloqueia após MAX_TENTATIVAS erros, libera após BLOQUEIO_MS, e
// persiste em localStorage (reload não zera). Usa timers falsos para controlar
// o relógio.

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(0)
})
afterEach(() => vi.useRealTimers())

describe('useLockout', () => {
  it('bloqueia ao atingir o teto de tentativas', () => {
    const { result } = renderHook(() => useLockout())
    expect(result.current.bloqueado).toBe(false)

    for (let i = 0; i < MAX_TENTATIVAS; i++) {
      act(() => result.current.registrarErro())
    }
    expect(result.current.bloqueado).toBe(true)
    expect(result.current.segundosRestantes).toBeGreaterThan(0)
  })

  it('libera depois que o tempo de bloqueio passa', () => {
    const { result } = renderHook(() => useLockout())
    for (let i = 0; i < MAX_TENTATIVAS; i++) {
      act(() => result.current.registrarErro())
    }
    expect(result.current.bloqueado).toBe(true)

    act(() => {
      vi.setSystemTime(BLOQUEIO_MS + 1000)
      vi.advanceTimersByTime(BLOQUEIO_MS + 1000)
    })
    expect(result.current.bloqueado).toBe(false)
  })

  it('persiste o bloqueio entre montagens (reload não zera)', () => {
    const primeiro = renderHook(() => useLockout())
    for (let i = 0; i < MAX_TENTATIVAS; i++) {
      act(() => primeiro.result.current.registrarErro())
    }
    primeiro.unmount()

    // Nova montagem lê o estado do localStorage.
    const segundo = renderHook(() => useLockout())
    expect(segundo.result.current.bloqueado).toBe(true)
  })

  it('resetar zera o contador', () => {
    const { result } = renderHook(() => useLockout())
    for (let i = 0; i < MAX_TENTATIVAS - 1; i++) {
      act(() => result.current.registrarErro())
    }
    act(() => result.current.resetar())
    // Após o reset, um único erro não deve bloquear.
    act(() => result.current.registrarErro())
    expect(result.current.bloqueado).toBe(false)
  })
})
