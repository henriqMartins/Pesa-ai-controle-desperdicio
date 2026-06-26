import { useMemo, useState } from 'react'
import { useAlimentos } from '../hooks/useAlimentos'
import type { Alimento } from '../types'
import { OPCOES_UNIDADE_BASE, type UnidadeBase } from '../lib/unidades'

const GRAD = 'var(--accent-grad)'
const CARD = { background: 'var(--surface)', border: '1px solid var(--bd-08)' }

function brl(valor: number) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

// ─── Modal novo / editar ────────────────────────────────────────────────────────

function ModalProduto({
  produto,
  onClose,
  onSalvar,
}: {
  produto: Alimento | null
  onClose: () => void
  onSalvar: (dados: { nome: string; categoria?: string; preco_por_unidade: number; unidade: UnidadeBase; ativo: boolean }) => Promise<void>
}) {
  const [nome, setNome] = useState(produto?.nome ?? '')
  const [categoria, setCategoria] = useState(produto?.categoria ?? '')
  const [unidade, setUnidade] = useState<UnidadeBase>(produto?.unidade ?? 'kg')
  const [preco, setPreco] = useState(produto ? String(produto.preco_por_unidade) : '')
  const [ativo, setAtivo] = useState(produto?.ativo ?? true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    if (!nome.trim() || !preco) return
    setSalvando(true)
    setErro(null)
    try {
      await onSalvar({
        nome: nome.trim(),
        categoria: categoria.trim() || undefined,
        preco_por_unidade: parseFloat(preco.replace(',', '.')),
        unidade,
        ativo,
      })
      onClose()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
      setSalvando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center anim-fade px-4"
      style={{ background: 'var(--overlay)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        className="anim-pop w-full max-w-sm rounded-2xl"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--bd-10)', boxShadow: '0 20px 50px rgba(0,0,0,.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--bd-08)' }}>
          <div className="text-lg font-extrabold text-white">{produto ? 'Editar produto' : 'Novo produto'}</div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:text-white" style={{ border: '1px solid var(--bd-15)' }} aria-label="fechar">✕</button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/50">Nome</label>
            <input type="text" className="field" placeholder="ex: Pão brioche" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/50">Unidade</label>
              <select className="field" value={unidade} onChange={(e) => setUnidade(e.target.value as UnidadeBase)}>
                {OPCOES_UNIDADE_BASE.map((op) => (
                  <option key={op.valor} value={op.valor}>{op.label}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/50">Preço R$/{unidade}</label>
              <input type="text" inputMode="decimal" className="field" placeholder="0,00" value={preco} onChange={(e) => setPreco(e.target.value.replace(/[^0-9.,]/g, ''))} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/50">Categoria <span className="font-normal lowercase text-white/30">(opcional)</span></label>
            <input type="text" className="field" placeholder="ex: Lanches" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
          </div>

          {produto && (
            <button
              type="button"
              onClick={() => setAtivo((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--bd-10)' }}
            >
              <span className="text-sm font-bold text-white/70">Produto ativo</span>
              <span
                className="relative h-6 w-11 rounded-full transition-colors"
                style={{ background: ativo ? GRAD : 'var(--w-15)' }}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
                  style={{ left: ativo ? '22px' : '2px' }}
                />
              </span>
            </button>
          )}

          {erro && <p className="text-sm" style={{ color: 'var(--red)' }}>{erro}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="rounded-xl px-5 py-3 text-sm font-bold text-white/60" style={{ border: '1px solid var(--bd-15)' }}>Cancelar</button>
            <button onClick={salvar} disabled={salvando || !nome.trim() || !preco} className="btn-accent flex-1 rounded-xl py-3 text-sm font-extrabold">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────────

export default function Produtos() {
  const { alimentos, loading, adicionar, atualizar } = useAlimentos(false)
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState<{ aberto: boolean; produto: Alimento | null }>({ aberto: false, produto: null })

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return alimentos
    return alimentos.filter((a) => a.nome.toLowerCase().includes(q) || (a.categoria ?? '').toLowerCase().includes(q))
  }, [alimentos, busca])

  async function salvar(dados: { nome: string; categoria?: string; preco_por_unidade: number; unidade: UnidadeBase; ativo: boolean }) {
    if (modal.produto) await atualizar(modal.produto.id, dados)
    else await adicionar(dados)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      {/* busca + novo */}
      <div className="flex gap-2">
        <input type="text" placeholder="🔍 buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} className="field" />
        <button onClick={() => setModal({ aberto: true, produto: null })} className="btn-accent flex-none rounded-xl px-4 text-sm font-bold whitespace-nowrap">＋ Novo</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl" style={{ background: 'var(--surface)' }} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtrados.map((a) => (
            <button
              key={a.id}
              onClick={() => setModal({ aberto: true, produto: a })}
              className="rounded-2xl p-4 text-left transition-transform hover:scale-[1.02]"
              style={{ ...CARD, opacity: a.ativo ? 1 : 0.5 }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`font-bold ${a.ativo ? 'text-white' : 'text-white/50 line-through'}`}>{a.nome}</span>
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--badge-bg)', color: 'var(--orange)', border: '1px solid var(--badge-bd)' }}>{a.unidade}</span>
              </div>
              <div className="mt-2 text-lg font-extrabold tabular-nums" style={{ color: 'var(--orange)' }}>{brl(Number(a.preco_por_unidade))}<span className="text-xs font-semibold text-white/40">/{a.unidade}</span></div>
              {a.categoria && <div className="mt-1 text-xs text-white/40">{a.categoria}</div>}
              {!a.ativo && <div className="mt-1 text-[11px] font-bold text-white/40">inativo</div>}
            </button>
          ))}

          {/* card novo */}
          <button
            onClick={() => setModal({ aberto: true, produto: null })}
            className="flex min-h-[112px] flex-col items-center justify-center rounded-2xl text-sm font-bold"
            style={{ border: '2px dashed rgba(255,138,76,.4)', color: 'var(--orange)', background: 'var(--badge-bg-faint)' }}
          >
            <span className="text-3xl leading-none">＋</span>
            <span className="mt-1">novo produto</span>
          </button>
        </div>
      )}

      {!loading && filtrados.length === 0 && (
        <p className="py-4 text-center text-sm text-white/40">Nenhum produto encontrado.</p>
      )}

      {modal.aberto && (
        <ModalProduto
          produto={modal.produto}
          onClose={() => setModal({ aberto: false, produto: null })}
          onSalvar={salvar}
        />
      )}
    </div>
  )
}
