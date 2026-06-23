import { useState } from 'react'

const CHAVE = 'funcionario_atual_id'

export function useFuncionarioAtual() {
  const [funcionarioId, setFuncionarioIdState] = useState<string | null>(
    () => localStorage.getItem(CHAVE)
  )

  function selecionar(id: string) {
    localStorage.setItem(CHAVE, id)
    setFuncionarioIdState(id)
  }

  return { funcionarioId, selecionar }
}
