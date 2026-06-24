import { useState } from 'react'
import { useAlimentos } from '../hooks/useAlimentos'
import { useFuncionarios } from '../hooks/useFuncionarios'
import type { Alimento, Funcionario } from '../types'
import { OPCOES_UNIDADE_BASE, type UnidadeBase } from '../lib/unidades'

type Aba = 'alimentos' | 'funcionarios'

// ─── Alimentos ───────────────────────────────────────────────────────────────

function AbaAlimentos() {
  const { alimentos, loading, adicionar, atualizar } = useAlimentos(false)

  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('')
  const [precoPorUnidade, setPrecoPorUnidade] = useState('')
  const [unidade, setUnidade] = useState<UnidadeBase>('kg')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [editando, setEditando] = useState<Alimento | null>(null)
  const [editPreco, setEditPreco] = useState('')

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !precoPorUnidade) return
    setSalvando(true)
    setErro(null)
    try {
      await adicionar({
        nome: nome.trim(),
        categoria: categoria.trim() || undefined,
        preco_por_unidade: parseFloat(precoPorUnidade),
        unidade,
      })
      setNome('')
      setCategoria('')
      setPrecoPorUnidade('')
      setUnidade('kg')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao adicionar')
    } finally {
      setSalvando(false)
    }
  }

  async function handleToggleAtivo(a: Alimento) {
    await atualizar(a.id, { ativo: !a.ativo })
  }

  async function handleSalvarEdicao(a: Alimento) {
    if (!editPreco) return
    await atualizar(a.id, { preco_por_unidade: parseFloat(editPreco) })
    setEditando(null)
  }

  if (loading) return <div className="py-6 text-center text-gray-400">Carregando...</div>

  return (
    <div className="space-y-6">
      {/* Lista */}
      <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        {alimentos.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-gray-400">Nenhum alimento cadastrado.</li>
        )}
        {alimentos.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-2 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${a.ativo ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                  {a.nome}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {a.unidade}
                </span>
                {a.categoria && (
                  <span className="text-xs text-gray-400">{a.categoria}</span>
                )}
              </div>
              {editando?.id === a.id ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-gray-500">R$/{a.unidade}:</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={editPreco}
                    onChange={(e) => setEditPreco(e.target.value)}
                    className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSalvarEdicao(a)}
                    className="rounded bg-teal-600 px-2 py-1 text-xs text-white hover:bg-teal-700"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditando(null)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  R$ {Number(a.preco_por_unidade).toFixed(2).replace('.', ',')}/{a.unidade}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {editando?.id !== a.id && (
                <button
                  onClick={() => { setEditando(a); setEditPreco(String(a.preco_por_unidade)) }}
                  className="rounded px-2 py-1 text-xs text-teal-600 ring-1 ring-teal-200 hover:bg-teal-50"
                >
                  Editar preço
                </button>
              )}
              <button
                onClick={() => handleToggleAtivo(a)}
                className={`rounded px-2 py-1 text-xs ring-1 ${
                  a.ativo
                    ? 'text-gray-500 ring-gray-200 hover:bg-gray-50'
                    : 'text-teal-600 ring-teal-200 hover:bg-teal-50'
                }`}
              >
                {a.ativo ? 'Desativar' : 'Reativar'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Formulário de adição */}
      <form onSubmit={handleAdicionar} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Novo alimento</h3>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Nome *"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="flex-1 min-w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="flex-1 min-w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
          <select
            value={unidade}
            onChange={(e) => setUnidade(e.target.value as UnidadeBase)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            {OPCOES_UNIDADE_BASE.map((op) => (
              <option key={op.valor} value={op.valor}>{op.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500 whitespace-nowrap">R$/{unidade}</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Preço *"
              min={0}
              step="0.01"
              value={precoPorUnidade}
              onChange={(e) => setPrecoPorUnidade(e.target.value)}
              required
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
        {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
      </form>
    </div>
  )
}

// ─── Funcionários ─────────────────────────────────────────────────────────────

function AbaFuncionarios() {
  const { funcionarios, loading, adicionar, atualizar } = useFuncionarios(false)

  const [nome, setNome] = useState('')
  const [papel, setPapel] = useState<'funcionario' | 'gestor'>('funcionario')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setSalvando(true)
    setErro(null)
    try {
      await adicionar({ nome: nome.trim(), papel })
      setNome('')
      setPapel('funcionario')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao adicionar')
    } finally {
      setSalvando(false)
    }
  }

  async function handleToggleAtivo(f: Funcionario) {
    await atualizar(f.id, { ativo: !f.ativo })
  }

  if (loading) return <div className="py-6 text-center text-gray-400">Carregando...</div>

  return (
    <div className="space-y-6">
      {/* Lista */}
      <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        {funcionarios.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-gray-400">Nenhum funcionário cadastrado.</li>
        )}
        {funcionarios.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-2 px-4 py-3">
            <div>
              <span className={`font-medium ${f.ativo ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                {f.nome}
              </span>
              <span className={`ml-2 text-xs ${f.papel === 'gestor' ? 'text-teal-600' : 'text-gray-400'}`}>
                {f.papel === 'gestor' ? 'Gestor' : 'Funcionário'}
              </span>
            </div>
            <button
              onClick={() => handleToggleAtivo(f)}
              className={`rounded px-2 py-1 text-xs ring-1 ${
                f.ativo
                  ? 'text-gray-500 ring-gray-200 hover:bg-gray-50'
                  : 'text-teal-600 ring-teal-200 hover:bg-teal-50'
              }`}
            >
              {f.ativo ? 'Desativar' : 'Reativar'}
            </button>
          </li>
        ))}
      </ul>

      {/* Formulário de adição */}
      <form onSubmit={handleAdicionar} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Novo funcionário</h3>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Nome *"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="flex-1 min-w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
          <select
            value={papel}
            onChange={(e) => setPapel(e.target.value as 'funcionario' | 'gestor')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="funcionario">Funcionário</option>
            <option value="gestor">Gestor</option>
          </select>
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
        {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
      </form>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Configuracao() {
  const [aba, setAba] = useState<Aba>('alimentos')

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {(['alimentos', 'funcionarios'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              aba === a ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {a === 'alimentos' ? 'Alimentos' : 'Funcionários'}
          </button>
        ))}
      </div>

      {aba === 'alimentos' ? <AbaAlimentos /> : <AbaFuncionarios />}
    </div>
  )
}
