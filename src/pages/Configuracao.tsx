import { useState } from 'react'
import { useAlimentos } from '../hooks/useAlimentos'
import { useFuncionarios } from '../hooks/useFuncionarios'
import type { Alimento, Funcionario } from '../types'
import { OPCOES_UNIDADE_BASE, type UnidadeBase } from '../lib/unidades'

type Aba = 'alimentos' | 'funcionarios'

const GRAD = 'linear-gradient(135deg, #ff8a4c, #f0464e)'

const inputStyle: React.CSSProperties = {
  background: '#1c160f',
  border: '1.5px solid rgba(255,220,180,.15)',
  color: '#fff',
  borderRadius: '12px',
  padding: '10px 14px',
  fontSize: '14px',
  fontWeight: 600,
  outline: 'none',
  width: '100%',
}

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

// ─── Alimentos ────────────────────────────────────────────────────────────────

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
      setNome(''); setCategoria(''); setPrecoPorUnidade(''); setUnidade('kg')
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

  if (loading) return <div className="py-8 text-center text-white/40 text-sm">Carregando...</div>

  return (
    <div className="space-y-4">
      {/* Lista */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: '#1c160f', border: '1px solid rgba(255,220,180,.07)' }}
      >
        {alimentos.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-white/40">Nenhum alimento cadastrado.</div>
        )}
        {alimentos.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 px-4 py-3.5"
            style={{ borderBottom: '1px solid rgba(255,220,180,.05)' }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${a.ativo ? 'text-white' : 'text-white/35 line-through'}`}>
                  {a.nome}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                  style={{ background: 'rgba(255,138,76,.15)', color: '#ff8a4c', border: '1px solid rgba(255,138,76,.25)' }}
                >
                  {a.unidade}
                </span>
                {a.categoria && (
                  <span className="text-xs text-white/40">{a.categoria}</span>
                )}
              </div>
              {editando?.id === a.id ? (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-white/40">R$/{a.unidade}:</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={editPreco}
                    onChange={(e) => setEditPreco(e.target.value)}
                    className="w-24 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none"
                    style={{ background: '#221a10', border: '1.5px solid rgba(255,220,180,.2)' }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSalvarEdicao(a)}
                    className="btn-accent rounded-lg px-3 py-1.5 text-xs font-bold"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditando(null)}
                    className="text-xs text-white/40 hover:text-white/70"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <p className="text-sm text-white/50">
                  R$ {Number(a.preco_por_unidade).toFixed(2).replace('.', ',')}/{a.unidade}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {editando?.id !== a.id && (
                <button
                  onClick={() => { setEditando(a); setEditPreco(String(a.preco_por_unidade)) }}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/60 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,220,180,.12)' }}
                >
                  Editar preço
                </button>
              )}
              <button
                onClick={() => handleToggleAtivo(a)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                style={a.ativo
                  ? { border: '1px solid rgba(255,220,180,.12)', color: 'rgba(255,255,255,.5)' }
                  : { border: '1px solid rgba(52,211,153,.3)', color: '#34d399', background: 'rgba(52,211,153,.08)' }
                }
              >
                {a.ativo ? 'Desativar' : 'Reativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulário */}
      <form
        onSubmit={handleAdicionar}
        className="rounded-2xl p-4 space-y-3"
        style={{ background: '#1c160f', border: '1px solid rgba(255,220,180,.07)' }}
      >
        <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">Novo alimento</h3>
        <div className="flex flex-wrap gap-2">
          <input
            type="text" placeholder="Nome *" value={nome} required
            onChange={(e) => setNome(e.target.value)}
            style={{ ...inputStyle, flex: '1 1 140px' }}
          />
          <input
            type="text" placeholder="Categoria" value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            style={{ ...inputStyle, flex: '1 1 110px' }}
          />
          <select
            value={unidade}
            onChange={(e) => setUnidade(e.target.value as UnidadeBase)}
            style={{ ...selectStyle, flex: 'none', width: 'auto' }}
          >
            {OPCOES_UNIDADE_BASE.map((op) => (
              <option key={op.valor} value={op.valor}>{op.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5 flex-none">
            <span className="text-xs text-white/40 whitespace-nowrap">R$/{unidade}</span>
            <input
              type="number" inputMode="decimal" placeholder="Preço *" min={0} step="0.01"
              value={precoPorUnidade} required onChange={(e) => setPrecoPorUnidade(e.target.value)}
              style={{ ...inputStyle, width: 104 }}
            />
          </div>
          <button
            type="submit" disabled={salvando}
            className="btn-accent rounded-xl px-5 py-2.5 text-sm font-bold flex-none"
          >
            {salvando ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
        {erro && <p className="text-sm" style={{ color: '#f0464e' }}>{erro}</p>}
      </form>
    </div>
  )
}

// ─── Funcionários ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#ff8a4c', '#ef4459', '#b8431f', '#f59e0b', '#fb6a5a', '#c2410c']

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
      setNome(''); setPapel('funcionario')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao adicionar')
    } finally {
      setSalvando(false)
    }
  }

  async function handleToggleAtivo(f: Funcionario) {
    await atualizar(f.id, { ativo: !f.ativo })
  }

  if (loading) return <div className="py-8 text-center text-white/40 text-sm">Carregando...</div>

  return (
    <div className="space-y-4">
      {/* Lista */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: '#1c160f', border: '1px solid rgba(255,220,180,.07)' }}
      >
        {funcionarios.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-white/40">Nenhum funcionário cadastrado.</div>
        )}
        {funcionarios.map((f, i) => (
          <div
            key={f.id}
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ borderBottom: '1px solid rgba(255,220,180,.05)' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-none text-sm font-extrabold text-white"
              style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
            >
              {f.nome.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <span className={`font-semibold ${f.ativo ? 'text-white' : 'text-white/35 line-through'}`}>
                {f.nome}
              </span>
              <span
                className="ml-2 text-xs font-semibold"
                style={{ color: f.papel === 'gestor' ? '#ff8a4c' : 'rgba(255,255,255,.4)' }}
              >
                {f.papel === 'gestor' ? 'Gestor' : 'Funcionário'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-[11px] font-bold rounded-full px-2.5 py-1"
                style={f.ativo
                  ? { background: 'rgba(52,211,153,.14)', color: '#34d399', border: '1px solid rgba(52,211,153,.3)' }
                  : { background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.4)', border: '1px solid rgba(255,255,255,.12)' }
                }
              >
                {f.ativo ? 'ativo' : 'inativo'}
              </span>

              <button
                onClick={() => handleToggleAtivo(f)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                style={{ border: '1px solid rgba(255,220,180,.12)', color: 'rgba(255,255,255,.5)' }}
              >
                {f.ativo ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulário */}
      <form
        onSubmit={handleAdicionar}
        className="rounded-2xl p-4 space-y-3"
        style={{ background: '#1c160f', border: '1px solid rgba(255,220,180,.07)' }}
      >
        <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">Novo funcionário</h3>
        <div className="flex flex-wrap gap-2">
          <input
            type="text" placeholder="Nome *" value={nome} required
            onChange={(e) => setNome(e.target.value)}
            style={{ ...inputStyle, flex: '1 1 160px' }}
          />
          <select
            value={papel} onChange={(e) => setPapel(e.target.value as 'funcionario' | 'gestor')}
            style={{ ...selectStyle, flex: 'none', width: 'auto' }}
          >
            <option value="funcionario">Funcionário</option>
            <option value="gestor">Gestor</option>
          </select>
          <button
            type="submit" disabled={salvando}
            className="btn-accent rounded-xl px-5 py-2.5 text-sm font-bold flex-none"
          >
            {salvando ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
        {erro && <p className="text-sm" style={{ color: '#f0464e' }}>{erro}</p>}
      </form>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Configuracao() {
  const [aba, setAba] = useState<Aba>('alimentos')

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      {/* Tabs */}
      <div
        className="flex gap-1 rounded-2xl p-1"
        style={{ background: 'rgba(255,220,180,.05)', border: '1px solid rgba(255,220,180,.07)' }}
      >
        {(['alimentos', 'funcionarios'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold transition-all"
            style={aba === a
              ? { background: GRAD, color: '#fff', boxShadow: '0 4px 14px rgba(240,70,78,.25)' }
              : { color: 'rgba(255,255,255,.5)' }
            }
          >
            {a === 'alimentos' ? 'Alimentos' : 'Funcionários'}
          </button>
        ))}
      </div>

      {aba === 'alimentos' ? <AbaAlimentos /> : <AbaFuncionarios />}
    </div>
  )
}
