import { useState } from 'react'
import { useMotivos } from '../hooks/useMotivos'

const GRAD = 'var(--accent-grad)'

export default function Motivos() {
  const { motivos, loading, adicionar, atualizar, excluir } = useMotivos(false)
  const [texto, setTexto] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [textoEdicao, setTextoEdicao] = useState('')

  const ativos = motivos.filter((m) => m.ativo).length

  function iniciarEdicao(id: string, textoAtual: string) {
    setEditandoId(id)
    setTextoEdicao(textoAtual)
    setErro(null)
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setTextoEdicao('')
  }

  async function salvarEdicao(id: string) {
    if (!textoEdicao.trim()) return
    setErro(null)
    try {
      await atualizar(id, { texto: textoEdicao.trim() })
      cancelarEdicao()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao editar')
    }
  }

  async function handleExcluir(id: string) {
    if (!window.confirm('Excluir este motivo? Esta ação não pode ser desfeita.')) return
    setErro(null)
    try {
      await excluir(id)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    setSalvando(true)
    setErro(null)
    try {
      await adicionar({ texto: texto.trim() })
      setTexto('')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao adicionar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <p className="text-sm text-white/45">
        Motivos aparecem como atalhos na tela de registro. Cadastre os que a equipe usa com frequência
        para não precisar digitar toda vez.
      </p>

      {/* Lista */}
      <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--bd-07)' }}>
        <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-white/40" style={{ borderBottom: '1px solid var(--bd-06)' }}>
          {ativos} motivo{ativos === 1 ? '' : 's'} ativo{ativos === 1 ? '' : 's'}
        </div>

        {loading && <div className="px-4 py-8 text-center text-sm text-white/40">Carregando...</div>}
        {!loading && motivos.length === 0 && <div className="px-4 py-8 text-center text-sm text-white/40">Nenhum motivo cadastrado.</div>}

        {!loading && motivos.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--bd-05)' }}>
            {editandoId === m.id ? (
              <>
                <input
                  type="text"
                  value={textoEdicao}
                  autoFocus
                  onChange={(e) => setTextoEdicao(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') salvarEdicao(m.id)
                    if (e.key === 'Escape') cancelarEdicao()
                  }}
                  className="field flex-1"
                />
                <div className="flex flex-none gap-2">
                  <button
                    onClick={() => salvarEdicao(m.id)}
                    disabled={!textoEdicao.trim()}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                    style={{ border: '1px solid rgba(52,211,153,.3)', color: 'var(--live-green)', background: 'rgba(52,211,153,.08)' }}
                  >
                    Salvar
                  </button>
                  <button
                    onClick={cancelarEdicao}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                    style={{ border: '1px solid var(--bd-12)', color: 'var(--tx-50)' }}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className={`font-semibold ${m.ativo ? 'text-white' : 'text-white/40 line-through'}`}>{m.texto}</span>
                <div className="flex flex-none gap-2">
                  <button
                    onClick={() => iniciarEdicao(m.id, m.texto)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                    style={{ border: '1px solid var(--bd-12)', color: 'var(--tx-50)' }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => atualizar(m.id, { ativo: !m.ativo })}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                    style={m.ativo
                      ? { border: '1px solid var(--bd-12)', color: 'var(--tx-50)' }
                      : { border: '1px solid rgba(52,211,153,.3)', color: 'var(--live-green)', background: 'rgba(52,211,153,.08)' }}
                  >
                    {m.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                  <button
                    onClick={() => handleExcluir(m.id)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                    style={{ border: '1px solid rgba(248,113,113,.3)', color: 'var(--red)', background: 'rgba(248,113,113,.08)' }}
                  >
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Formulário */}
      <form onSubmit={handleAdicionar} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--bd-07)' }}>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/60">Novo motivo</h3>
        <div className="flex gap-2">
          <input type="text" placeholder="ex: Sobrou do balcão" value={texto} required onChange={(e) => setTexto(e.target.value)} className="field" />
          <button type="submit" disabled={salvando || !texto.trim()} className="btn-accent flex-none rounded-xl px-5 text-sm font-bold" style={{ background: GRAD }}>
            {salvando ? '...' : 'Adicionar'}
          </button>
        </div>
        {erro && <p className="mt-2 text-sm" style={{ color: 'var(--red)' }}>{erro}</p>}
      </form>
    </div>
  )
}
