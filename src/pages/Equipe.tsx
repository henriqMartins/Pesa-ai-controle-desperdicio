import { useState } from 'react'
import { useFuncionarios } from '../hooks/useFuncionarios'
import type { Funcionario } from '../types'

const GRAD = 'var(--accent-grad)'
const AVATAR_COLORS = ['var(--orange)', '#ef4459', '#b8431f', '#f59e0b', '#fb6a5a', '#c2410c']

type Papel = 'funcionario' | 'gestor'

// ─── Modal novo / editar ────────────────────────────────────────────────────────

function ModalFuncionario({
  funcionario,
  onClose,
  onSalvar,
}: {
  funcionario: Funcionario | null
  onClose: () => void
  onSalvar: (dados: { nome: string; papel: Papel; ativo: boolean }) => Promise<void>
}) {
  const [nome, setNome] = useState(funcionario?.nome ?? '')
  const [papel, setPapel] = useState<Papel>((funcionario?.papel as Papel) ?? 'funcionario')
  const [ativo, setAtivo] = useState(funcionario?.ativo ?? true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    if (!nome.trim()) return
    setSalvando(true)
    setErro(null)
    try {
      await onSalvar({ nome: nome.trim(), papel, ativo })
      onClose()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center anim-fade px-4" style={{ background: 'var(--overlay)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div className="anim-pop w-full max-w-sm rounded-2xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--bd-10)', boxShadow: '0 20px 50px rgba(0,0,0,.5)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--bd-08)' }}>
          <div className="text-lg font-extrabold text-white">{funcionario ? 'Editar funcionário' : 'Novo funcionário'}</div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:text-white" style={{ border: '1px solid var(--bd-15)' }} aria-label="fechar">✕</button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/50">Nome</label>
            <input type="text" className="field" placeholder="nome completo" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/50">Função</label>
            <select className="field" value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
              <option value="funcionario">Funcionário</option>
              <option value="gestor">Gestor</option>
            </select>
          </div>

          <button type="button" onClick={() => setAtivo((v) => !v)} className="flex w-full items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--bd-10)' }}>
            <span className="text-sm font-bold text-white/70">Ativo</span>
            <span className="relative h-6 w-11 rounded-full transition-colors" style={{ background: ativo ? GRAD : 'var(--w-15)' }}>
              <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: ativo ? '22px' : '2px' }} />
            </span>
          </button>

          {erro && <p className="text-sm" style={{ color: 'var(--red)' }}>{erro}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="rounded-xl px-5 py-3 text-sm font-bold text-white/60" style={{ border: '1px solid var(--bd-15)' }}>Cancelar</button>
            <button onClick={salvar} disabled={salvando || !nome.trim()} className="btn-accent flex-1 rounded-xl py-3 text-sm font-extrabold">{salvando ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────────

export default function Equipe() {
  const { funcionarios, loading, adicionar, atualizar } = useFuncionarios(false)
  const [modal, setModal] = useState<{ aberto: boolean; funcionario: Funcionario | null }>({ aberto: false, funcionario: null })

  const ativos = funcionarios.filter((f) => f.ativo).length

  async function salvar(dados: { nome: string; papel: Papel; ativo: boolean }) {
    if (modal.funcionario) await atualizar(modal.funcionario.id, dados)
    else await adicionar(dados)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--bd-07)' }}>
        <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--bd-06)' }}>
          <span className="font-bold text-white">Equipe · {ativos} ativo{ativos === 1 ? '' : 's'}</span>
          <button onClick={() => setModal({ aberto: true, funcionario: null })} className="btn-accent rounded-xl px-3.5 py-2 text-sm font-bold">＋ Novo</button>
        </div>

        {loading && <div className="px-4 py-8 text-center text-sm text-white/40">Carregando...</div>}
        {!loading && funcionarios.length === 0 && <div className="px-4 py-8 text-center text-sm text-white/40">Nenhum funcionário cadastrado.</div>}

        {!loading && funcionarios.map((f, i) => (
          <div key={f.id} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--bd-05)' }}>
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-extrabold text-white" style={{ background: f.ativo ? AVATAR_COLORS[i % AVATAR_COLORS.length] : 'var(--w-12)' }}>
              {f.nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className={`font-semibold ${f.ativo ? 'text-white' : 'text-white/40 line-through'}`}>{f.nome}</span>
              <div className="text-xs font-semibold" style={{ color: f.papel === 'gestor' ? 'var(--orange)' : 'var(--tx-40)' }}>{f.papel === 'gestor' ? 'Gestor' : 'Funcionário'}</div>
            </div>
            <span className="text-[11px] font-bold rounded-full px-2.5 py-1" style={f.ativo
              ? { background: 'rgba(52,211,153,.14)', color: 'var(--live-green)', border: '1px solid rgba(52,211,153,.3)' }
              : { background: 'var(--w-07)', color: 'var(--tx-40)', border: '1px solid var(--w-12)' }}>
              {f.ativo ? 'ativo' : 'inativo'}
            </span>
            <button onClick={() => setModal({ aberto: true, funcionario: f })} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/45 hover:text-white" style={{ border: '1px solid var(--bd-12)' }} aria-label="editar">✎</button>
          </div>
        ))}
      </div>

      {modal.aberto && (
        <ModalFuncionario funcionario={modal.funcionario} onClose={() => setModal({ aberto: false, funcionario: null })} onSalvar={salvar} />
      )}
    </div>
  )
}
