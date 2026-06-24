import { useState } from 'react'
import { useAlimentos } from '../hooks/useAlimentos'
import { useFuncionarios } from '../hooks/useFuncionarios'
import { useFuncionarioAtual } from '../hooks/useFuncionarioAtual'
import { useRegistros } from '../hooks/useRegistros'
import type { Alimento } from '../types'

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
  const [pesoTexto, setPesoTexto] = useState('')
  const [motivoChip, setMotivoChip] = useState('')
  const [motivoTexto, setMotivoTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const pesoG = parseFloat(pesoTexto)
  const custoEstimado =
    alimentoSelecionado && pesoG > 0
      ? (pesoG / 1000) * alimentoSelecionado.valor_por_kg
      : null

  const motivo = motivoChip || motivoTexto.trim()
  const podeConfirmar =
    !!funcionarioId && !!alimentoSelecionado && pesoG > 0 && !enviando

  async function confirmar() {
    if (!podeConfirmar || !alimentoSelecionado) return
    setEnviando(true)
    setErro(null)
    try {
      await inserir({
        alimento_id: alimentoSelecionado.id,
        funcionario_id: funcionarioId!,
        peso_g: pesoG,
        preco_kg_no_momento: alimentoSelecionado.valor_por_kg,
        motivo: motivo || undefined,
      })
      setAlimentoSelecionado(null)
      setPesoTexto('')
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
              onClick={() => { setAlimentoSelecionado(a); setPesoTexto('') }}
              className="rounded-2xl px-4 py-2.5 text-sm font-semibold transition-opacity"
              style={alimentoSelecionado?.id === a.id ? CHIP_ACTIVE : CHIP_IDLE}
            >
              {a.nome}
              {a.categoria && (
                <span className="ml-1.5 text-[11px] opacity-60">· {a.categoria}</span>
              )}
            </button>
          ))}
          {alimentos.length === 0 && (
            <p className="text-sm text-white/40">
              Nenhum alimento cadastrado. Vá em Configuração.
            </p>
          )}
        </div>
      </section>

      {/* ── Peso ── */}
      <section>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/40">
          Peso desperdiçado (g)
        </div>
        <div className="flex items-center gap-4">
          <input
            type="number"
            inputMode="decimal"
            min={1}
            placeholder="ex: 500"
            value={pesoTexto}
            onChange={(e) => setPesoTexto(e.target.value)}
            className="w-36 rounded-xl px-4 py-3 text-lg font-bold text-white placeholder:text-white/20 focus:outline-none"
            style={{
              background: '#1c160f',
              border: '1.5px solid rgba(255,220,180,.15)',
            }}
          />
          {custoEstimado !== null && (
            <span className="text-base font-bold" style={{ color: '#ff8a4c' }}>
              ≈ {brl(custoEstimado)}
            </span>
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
              R$ {alimentoSelecionado.valor_por_kg.toFixed(2).replace('.', ',')}/kg × {pesoTexto} g
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

      {/* ── Feedback ── */}
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
