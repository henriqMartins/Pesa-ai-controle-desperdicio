import { useMemo, useState } from 'react'
import { useAlimentos } from '../hooks/useAlimentos'
import { useFuncionarios } from '../hooks/useFuncionarios'
import { useFuncionarioAtual } from '../hooks/useFuncionarioAtual'
import { useRegistros } from '../hooks/useRegistros'
import { useMotivos } from '../hooks/useMotivos'
import { useIsMobile } from '../hooks/useIsMobile'
import TecladoNumerico from './TecladoNumerico'
import { exibirNumero } from '../lib/numero'
import {
  UNIDADES_ENTRADA,
  converterParaBase,
  type UnidadeEntrada,
} from '../lib/unidades'
import type { Alimento } from '../types'

const GRAD = 'var(--accent-grad)'
const CHIP_ACTIVE: React.CSSProperties = {
  background: 'var(--chip-active-bg)',
  border: '1.5px solid var(--orange)',
  color: 'var(--chip-active-tx)',
}
const CHIP_IDLE: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1.5px solid var(--bd-13)',
  color: 'var(--tx-72)',
}

function brl(valor: number) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

interface Props {
  onClose: () => void
  /** Chamado após salvar com sucesso (ex.: feedback no shell). */
  onRegistrado?: () => void
}

export default function RegistrarModal({ onClose, onRegistrado }: Props) {
  const isMobile = useIsMobile()
  const { alimentos } = useAlimentos()
  const { funcionarios } = useFuncionarios()
  const { funcionarioId, selecionar } = useFuncionarioAtual()
  const { inserir } = useRegistros(1)
  const { motivos, adicionar: adicionarMotivo } = useMotivos()

  const [alimentoSelecionado, setAlimentoSelecionado] = useState<Alimento | null>(null)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<UnidadeEntrada>('g')
  const [quantidadeTexto, setQuantidadeTexto] = useState('')
  const [motivoSel, setMotivoSel] = useState('')
  const [motivoCustom, setMotivoCustom] = useState('')
  const [busca, setBusca] = useState('')
  const [passo, setPasso] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [trocandoFunc, setTrocandoFunc] = useState(false)

  const quantidadeEntrada = parseFloat(quantidadeTexto || '0')
  const funcionarioAtual = funcionarios.find((f) => f.id === funcionarioId) ?? null

  const custoEstimado =
    alimentoSelecionado && quantidadeEntrada > 0
      ? converterParaBase(quantidadeEntrada, unidadeSelecionada, alimentoSelecionado.unidade) *
        alimentoSelecionado.preco_por_unidade
      : null

  const motivo = motivoCustom.trim() || motivoSel
  const opcoesUnidade = alimentoSelecionado ? UNIDADES_ENTRADA[alimentoSelecionado.unidade] : []

  const alimentosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return alimentos
    return alimentos.filter((a) => a.nome.toLowerCase().includes(q))
  }, [alimentos, busca])

  const podeConfirmar =
    !!funcionarioId && !!alimentoSelecionado && quantidadeEntrada > 0 && !enviando

  function selecionarAlimento(a: Alimento) {
    setAlimentoSelecionado(a)
    setUnidadeSelecionada(UNIDADES_ENTRADA[a.unidade][0].valor)
    setQuantidadeTexto('')
  }

  async function salvarMotivoCustom() {
    const texto = motivoCustom.trim()
    if (!texto) return
    try {
      await adicionarMotivo({ texto })
      setMotivoSel(texto)
      setMotivoCustom('')
    } catch {
      /* silencioso — segue como motivo avulso */
    }
  }

  async function confirmar() {
    if (!podeConfirmar || !alimentoSelecionado) return
    setEnviando(true)
    setErro(null)
    try {
      const quantidadeBase = converterParaBase(
        quantidadeEntrada,
        unidadeSelecionada,
        alimentoSelecionado.unidade,
      )
      await inserir({
        alimento_id: alimentoSelecionado.id,
        funcionario_id: funcionarioId!,
        quantidade: quantidadeBase,
        unidade_registro: unidadeSelecionada,
        preco_unitario_no_momento: alimentoSelecionado.preco_por_unidade,
        motivo: motivo || undefined,
      })
      onRegistrado?.()
      onClose()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar registro')
      setEnviando(false)
    }
  }

  // ─── Blocos reutilizáveis ─────────────────────────────────────────────────

  const tituloSecao = (txt: string) => (
    <div className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-white/40">{txt}</div>
  )

  const blocoFuncionario = (
    <section>
      {funcionarioAtual && !trocandoFunc ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/55">
            Registrando como{' '}
            <span className="font-bold text-white">{funcionarioAtual.nome}</span>
          </span>
          <button
            onClick={() => setTrocandoFunc(true)}
            className="text-xs font-semibold text-white/40 hover:text-white/70"
          >
            trocar
          </button>
        </div>
      ) : (
        <>
          {tituloSecao('Quem está registrando?')}
          <div className="flex flex-wrap gap-2">
            {funcionarios.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  selecionar(f.id)
                  setTrocandoFunc(false)
                }}
                className="rounded-full px-4 py-2 text-sm font-semibold"
                style={funcionarioId === f.id
                  ? { background: GRAD, color: '#fff', boxShadow: '0 4px 14px rgba(240,70,78,.28)' }
                  : CHIP_IDLE}
              >
                {f.nome}
              </button>
            ))}
            {funcionarios.length === 0 && (
              <p className="text-sm text-white/40">Cadastre funcionários em Equipe.</p>
            )}
          </div>
        </>
      )}
    </section>
  )

  const blocoProdutos = (
    <section>
      {tituloSecao('Qual alimento?')}
      <input
        type="text"
        placeholder="🔍 buscar alimento..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="field mb-3"
      />
      <div className="flex flex-wrap gap-2">
        {alimentosFiltrados.map((a) => (
          <button
            key={a.id}
            onClick={() => selecionarAlimento(a)}
            className="rounded-2xl px-4 py-2.5 text-sm font-semibold"
            style={alimentoSelecionado?.id === a.id ? CHIP_ACTIVE : CHIP_IDLE}
          >
            {a.nome}
            <span className="ml-1.5 text-[11px] opacity-50">{a.unidade}</span>
          </button>
        ))}
        {alimentosFiltrados.length === 0 && (
          <p className="text-sm text-white/40">Nenhum alimento encontrado.</p>
        )}
      </div>
    </section>
  )

  const displayQuantidade = (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3"
      style={{ background: 'var(--surface)', border: '1.5px solid var(--bd-15)' }}
    >
      <span
        className="text-3xl font-extrabold tabular-nums"
        style={{ color: quantidadeTexto ? 'var(--tx)' : 'var(--tx-20)' }}
      >
        {quantidadeTexto ? exibirNumero(quantidadeTexto) : '0'}
      </span>
      <span className="text-lg font-bold" style={{ color: 'var(--orange)' }}>
        {unidadeSelecionada}
      </span>
    </div>
  )

  const seletorUnidade = opcoesUnidade.length > 1 && (
    <div className="flex gap-2">
      {opcoesUnidade.map((op) => (
        <button
          key={op.valor}
          onClick={() => setUnidadeSelecionada(op.valor)}
          className="flex-1 rounded-lg py-2 text-sm font-bold"
          style={unidadeSelecionada === op.valor ? CHIP_ACTIVE : CHIP_IDLE}
        >
          {op.label}
        </button>
      ))}
    </div>
  )

  const cardValor = (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--bd-08)' }}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/38">
        Valor calculado
      </div>
      <div
        className="mt-1 text-2xl font-extrabold"
        style={{ color: custoEstimado !== null ? 'var(--orange)' : 'var(--tx-22)' }}
      >
        {custoEstimado !== null ? brl(custoEstimado) : 'R$ —'}
      </div>
      {custoEstimado !== null && alimentoSelecionado && (
        <div className="mt-0.5 text-xs text-white/38">
          {brl(alimentoSelecionado.preco_por_unidade)}/{alimentoSelecionado.unidade} ×{' '}
          {exibirNumero(quantidadeTexto)} {unidadeSelecionada}
        </div>
      )}
    </div>
  )

  const blocoMotivo = (
    <section>
      {tituloSecao('Motivo (opcional)')}
      <div className="mb-3 flex flex-wrap gap-2">
        {motivos.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMotivoSel(motivoSel === m.texto ? '' : m.texto)
              setMotivoCustom('')
            }}
            className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold"
            style={motivoSel === m.texto ? CHIP_ACTIVE : CHIP_IDLE}
          >
            {m.texto}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="✎ escrever outro motivo..."
          value={motivoCustom}
          onChange={(e) => {
            setMotivoCustom(e.target.value)
            if (e.target.value) setMotivoSel('')
          }}
          className="field"
        />
        {motivoCustom.trim() && (
          <button
            onClick={salvarMotivoCustom}
            className="shrink-0 rounded-xl px-3 text-xs font-bold text-white/70"
            style={{ border: '1px solid var(--bd-20)' }}
            title="Salvar para reutilizar"
          >
            + salvar
          </button>
        )}
      </div>
    </section>
  )

  // ─── Layout ────────────────────────────────────────────────────────────────

  const cabecalho = (
    <div
      className="flex items-center justify-between border-b px-5 py-4"
      style={{ borderColor: 'var(--bd-08)' }}
    >
      <div className="text-lg font-extrabold text-white">Registrar desperdício</div>
      <button
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:text-white"
        style={{ border: '1px solid var(--bd-15)' }}
        aria-label="fechar"
      >
        ✕
      </button>
    </div>
  )

  // ── DESKTOP / TABLET: entrada rápida em um card ──
  const conteudoDesktop = (
    <div className="space-y-5 px-5 py-5">
      {blocoFuncionario}
      {blocoProdutos}

      {alimentoSelecionado && (
        <section>
          {tituloSecao('Quantidade desperdiçada')}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              {displayQuantidade}
              {seletorUnidade}
            </div>
            {cardValor}
          </div>
          <div className="mt-3">
            <TecladoNumerico value={quantidadeTexto} onChange={setQuantidadeTexto} />
          </div>
        </section>
      )}

      {alimentoSelecionado && blocoMotivo}

      {erro && <p className="text-sm" style={{ color: 'var(--red)' }}>{erro}</p>}

      <button
        onClick={confirmar}
        disabled={!podeConfirmar}
        className="btn-accent w-full rounded-xl py-4 text-base font-extrabold"
      >
        {enviando ? 'Salvando...' : 'Registrar → atualiza ao vivo'}
      </button>
    </div>
  )

  // ── MOBILE: bottom-sheet em 3 passos ──
  const pontos = (
    <div className="mb-1 flex justify-center gap-2 pt-1">
      {[1, 2, 3].map((p) => (
        <span
          key={p}
          className="h-2 w-2 rounded-full"
          style={{ background: passo === p ? 'var(--orange)' : 'var(--tx-20)' }}
        />
      ))}
    </div>
  )

  const podeAvancar1 = !!funcionarioId && !!alimentoSelecionado
  const podeAvancar2 = quantidadeEntrada > 0

  const conteudoMobile = (
    <div className="px-5 pb-5">
      {pontos}
      {passo === 1 && (
        <div className="space-y-5 pt-2">
          {blocoFuncionario}
          {blocoProdutos}
          <button
            onClick={() => setPasso(2)}
            disabled={!podeAvancar1}
            className="btn-accent w-full rounded-xl py-3.5 text-base font-extrabold"
          >
            Avançar
          </button>
        </div>
      )}

      {passo === 2 && (
        <div className="space-y-4 pt-2">
          {tituloSecao('Quantidade desperdiçada')}
          {displayQuantidade}
          {seletorUnidade}
          <TecladoNumerico value={quantidadeTexto} onChange={setQuantidadeTexto} />
          {cardValor}
          {blocoMotivo}
          <div className="flex gap-2">
            <button
              onClick={() => setPasso(1)}
              className="rounded-xl px-5 py-3.5 text-sm font-bold text-white/55"
              style={{ border: '1px solid var(--bd-15)' }}
            >
              Voltar
            </button>
            <button
              onClick={() => setPasso(3)}
              disabled={!podeAvancar2}
              className="btn-accent flex-1 rounded-xl py-3.5 text-base font-extrabold"
            >
              Avançar
            </button>
          </div>
        </div>
      )}

      {passo === 3 && (
        <div className="space-y-4 pt-2">
          {tituloSecao('Confirmar registro')}
          <div
            className="rounded-xl px-4 py-4 text-sm leading-relaxed"
            style={{ background: 'var(--surface)', border: '1px solid var(--bd-10)' }}
          >
            <div>
              <span className="font-bold text-white">{alimentoSelecionado?.nome}</span>
              <span className="text-white/55">
                {' '}
                · {exibirNumero(quantidadeTexto)} {unidadeSelecionada}
              </span>
            </div>
            <div className="mt-1 text-white/55">Motivo: {motivo || '—'}</div>
            <div className="mt-1 text-white/55">
              Por: {funcionarioAtual?.nome ?? '—'}
            </div>
            <div className="mt-2 text-2xl font-extrabold" style={{ color: 'var(--orange)' }}>
              {custoEstimado !== null ? brl(custoEstimado) : 'R$ —'}
            </div>
          </div>
          {erro && <p className="text-sm" style={{ color: 'var(--red)' }}>{erro}</p>}
          <button
            onClick={confirmar}
            disabled={!podeConfirmar}
            className="btn-accent w-full rounded-xl py-4 text-base font-extrabold"
          >
            {enviando ? 'Salvando...' : '✓ Confirmar'}
          </button>
          <button
            onClick={() => setPasso(2)}
            className="w-full text-center text-sm font-semibold text-white/45 hover:text-white/70"
          >
            Voltar
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex anim-fade"
      style={{
        background: 'var(--overlay)',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        className={isMobile ? 'anim-sheet w-full' : 'anim-pop w-full'}
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--bd-10)',
          maxWidth: isMobile ? '100%' : 480,
          maxHeight: isMobile ? '92vh' : '90vh',
          overflowY: 'auto',
          borderRadius: isMobile ? '24px 24px 0 0' : 20,
          boxShadow: '0 -8px 40px rgba(0,0,0,.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile && (
          <div className="flex justify-center pt-3">
            <div className="h-1.5 w-12 rounded-full bg-white/20" />
          </div>
        )}
        {!isMobile && cabecalho}
        {isMobile ? conteudoMobile : conteudoDesktop}
      </div>
    </div>
  )
}
