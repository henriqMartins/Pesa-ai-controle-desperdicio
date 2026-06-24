import { useState } from 'react'
import { useAlimentos } from '../hooks/useAlimentos'
import { useFuncionarios } from '../hooks/useFuncionarios'
import { useFuncionarioAtual } from '../hooks/useFuncionarioAtual'
import { useRegistros } from '../hooks/useRegistros'
import type { Alimento } from '../types'
import {
  UNIDADES_ENTRADA,
  converterParaBase,
  type UnidadeEntrada,
} from '../lib/unidades'

const GRAD = 'linear-gradient(135deg, #ff8a4c, #f0464e)'
const CHIP_ACTIVE: React.CSSProperties = {
  background: 'rgba(255,138,76,.22)',
  border: '1.5px solid #ff8a4c',
  color: '#ffd9c2',
}
const CHIP_IDLE: React.CSSProperties = {
  background: '#1c160f',
  border: '1.5px solid rgba(255,220,180,.13)',
  color: 'rgba(255,255,255,.72)',
}

const MOTIVOS = [
  'Erro de montagem',
  'Queimou / estragou',
  'Caiu no chão',
  'Sobra',
  'Validade vencida',
  'Outro',
]

function brl(valor: number) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

export default function Registro() {
  const { alimentos, loading: loadingAlimentos } = useAlimentos()
  const { funcionarios, loading: loadingFuncionarios } = useFuncionarios()
  const { funcionarioId, selecionar } = useFuncionarioAtual()
  const { inserir } = useRegistros(1)

  const [alimentoSelecionado, setAlimentoSelecionado] = useState<Alimento | null>(null)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<UnidadeEntrada>('g')
  const [quantidadeTexto, setQuantidadeTexto] = useState('')
  const [motivoChip, setMotivoChip] = useState('')
  const [motivoTexto, setMotivoTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const quantidadeEntrada = parseFloat(quantidadeTexto)

  const custoEstimado =
    alimentoSelecionado && quantidadeEntrada > 0
      ? converterParaBase(quantidadeEntrada, unidadeSelecionada, alimentoSelecionado.unidade) *
        alimentoSelecionado.preco_por_unidade
      : null

  const motivo = motivoChip || motivoTexto.trim()
  const podeConfirmar =
    !!funcionarioId && !!alimentoSelecionado && quantidadeEntrada > 0 && !enviando

  function selecionarAlimento(a: Alimento) {
    setAlimentoSelecionado(a)
    setUnidadeSelecionada(UNIDADES_ENTRADA[a.unidade][0].valor)
    setQuantidadeTexto('')
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
      setAlimentoSelecionado(null)
      setQuantidadeTexto('')
      setMotivoChip('')
      setMotivoTexto('')
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar registro')
    } finally {
      setEnviando(false)
    }
  }

  if (loadingAlimentos || loadingFuncionarios) {
    return (
      <div className="flex items-center justify-center p-16">
        <span className="text-sm text-white/40">Carregando...</span>
      </div>
    )
  }

  const opcoesUnidade = alimentoSelecionado
    ? UNIDADES_ENTRADA[alimentoSelecionado.unidade]
    : []

  return (
    <div className="mx-auto max-w-xl space-y-7 px-4 py-8">

      {/* ── Quem está registrando ── */}
      <section>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/40">
          Quem está registrando?
        </div>
        <div className="flex flex-wrap gap-2">
          {funcionarios.map((f) => (
            <button
              key={f.id}
              onClick={() => selecionar(f.id)}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-opacity"
              style={funcionarioId === f.id
                ? { background: GRAD, color: '#fff', boxShadow: '0 4px 14px rgba(240,70,78,.28)' }
                : CHIP_IDLE
              }
            >
              {f.nome}
            </button>
          ))}
          {funcionarios.length === 0 && (
            <p className="text-sm text-white/40">
              Nenhum funcionário cadastrado. Vá em Configuração.
            </p>
          )}
        </div>
      </section>

      {/* ── Qual alimento ── */}
      <section>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/40">
          Qual alimento?
        </div>
        <div className="flex flex-wrap gap-2">
          {alimentos.map((a) => (
            <button
              key={a.id}
              onClick={() => selecionarAlimento(a)}
              className="rounded-2xl px-4 py-2.5 text-sm font-semibold transition-opacity"
              style={alimentoSelecionado?.id === a.id ? CHIP_ACTIVE : CHIP_IDLE}
            >
              {a.nome}
              {a.categoria && (
                <span className="ml-1.5 text-[11px] opacity-60">· {a.categoria}</span>
              )}
              <span className="ml-1.5 text-[11px] opacity-50">{a.unidade}</span>
            </button>
          ))}
          {alimentos.length === 0 && (
            <p className="text-sm text-white/40">
              Nenhum alimento cadastrado. Vá em Configuração.
            </p>
          )}
        </div>
      </section>

      {/* ── Quantidade ── */}
      <section>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/40">
          Quantidade desperdiçada
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="number"
            inputMode="decimal"
            min={0.001}
            step="any"
            placeholder="ex: 500"
            value={quantidadeTexto}
            onChange={(e) => setQuantidadeTexto(e.target.value)}
            className="w-36 rounded-xl px-4 py-3 text-lg font-bold text-white placeholder:text-white/20 focus:outline-none"
            style={{
              background: '#1c160f',
              border: '1.5px solid rgba(255,220,180,.15)',
            }}
          />
          {opcoesUnidade.length > 0 && (
            <select
              value={unidadeSelecionada}
              onChange={(e) => setUnidadeSelecionada(e.target.value as UnidadeEntrada)}
              className="rounded-xl px-3 py-3 text-base font-semibold text-white focus:outline-none"
              style={{
                background: '#1c160f',
                border: '1.5px solid rgba(255,220,180,.15)',
              }}
            >
              {opcoesUnidade.map((op) => (
                <option key={op.valor} value={op.valor}>
                  {op.label}
                </option>
              ))}
            </select>
          )}
          {!alimentoSelecionado && (
            <span className="text-xs text-white/30">Selecione um alimento.</span>
          )}
        </div>
      </section>

      {/* ── Valor calculado (destaque) ── */}
      {alimentoSelecionado && (
        <div
          className="rounded-xl px-4 py-4"
          style={{
            background: '#1c160f',
            border: '1px solid rgba(255,220,180,.08)',
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/38 mb-1">
            Valor calculado
          </div>
          <div
            className="text-2xl font-extrabold"
            style={{ color: custoEstimado !== null ? '#ff8a4c' : 'rgba(255,255,255,.22)' }}
          >
            {custoEstimado !== null ? brl(custoEstimado) : 'R$ —'}
          </div>
          {custoEstimado !== null && (
            <div className="mt-1 text-xs text-white/38">
              R$ {alimentoSelecionado.preco_por_unidade.toFixed(2).replace('.', ',')}/{alimentoSelecionado.unidade} × {quantidadeTexto} {unidadeSelecionada}
            </div>
          )}
        </div>
      )}

      {/* ── Motivo ── */}
      <section>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/40">
          Motivo <span className="font-normal normal-case text-white/28">(opcional)</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {MOTIVOS.map((m) => (
            <button
              key={m}
              onClick={() => {
                setMotivoChip(motivoChip === m ? '' : m)
                if (m !== 'Outro') setMotivoTexto('')
              }}
              className="rounded-full px-4 py-2 text-[13px] font-semibold transition-opacity"
              style={motivoChip === m ? CHIP_ACTIVE : CHIP_IDLE}
            >
              {m}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="ou escreva o motivo..."
          value={motivoTexto}
          onChange={(e) => { setMotivoTexto(e.target.value); if (e.target.value) setMotivoChip('') }}
          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none"
          style={{
            background: '#1c160f',
            border: '1.5px solid rgba(255,220,180,.13)',
          }}
        />
      </section>

      {/* ── Confirmar ── */}
      <button
        onClick={confirmar}
        disabled={!podeConfirmar}
        className="btn-accent w-full rounded-xl py-4 text-base font-extrabold"
      >
        {enviando ? 'Salvando...' : 'Confirmar registro'}
      </button>

      {sucesso && (
        <div
          className="rounded-xl px-4 py-4 text-center text-sm font-semibold"
          style={{
            background: 'rgba(52,211,153,.12)',
            border: '1px solid rgba(52,211,153,.3)',
            color: '#34d399',
          }}
        >
          ✓ Registro salvo com sucesso!
        </div>
      )}
      {erro && (
        <div
          className="rounded-xl px-4 py-3 text-center text-sm"
          style={{
            background: 'rgba(240,70,78,.10)',
            border: '1px solid rgba(240,70,78,.28)',
            color: '#f0464e',
          }}
        >
          {erro}
        </div>
      )}
    </div>
  )
}
