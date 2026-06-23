import { useState } from 'react'
import { useAlimentos } from '../hooks/useAlimentos'
import { useFuncionarios } from '../hooks/useFuncionarios'
import { useFuncionarioAtual } from '../hooks/useFuncionarioAtual'
import { useRegistros } from '../hooks/useRegistros'
import type { Alimento } from '../types'

export default function Registro() {
  const { alimentos, loading: loadingAlimentos } = useAlimentos()
  const { funcionarios, loading: loadingFuncionarios } = useFuncionarios()
  const { funcionarioId, selecionar } = useFuncionarioAtual()
  const { inserir } = useRegistros(1)

  const [alimentoSelecionado, setAlimentoSelecionado] = useState<Alimento | null>(null)
  const [pesoTexto, setPesoTexto] = useState('')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const pesoG = parseFloat(pesoTexto)
  const custoEstimado =
    alimentoSelecionado && pesoG > 0
      ? (pesoG / 1000) * alimentoSelecionado.valor_por_kg
      : null

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
        motivo: motivo.trim() || undefined,
      })
      setAlimentoSelecionado(null)
      setPesoTexto('')
      setMotivo('')
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar registro')
    } finally {
      setEnviando(false)
    }
  }

  if (loadingAlimentos || loadingFuncionarios) {
    return <div className="p-6 text-center text-gray-500">Carregando...</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">

      {/* Seção 1 — Quem está registrando */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Quem está registrando?
        </h2>
        <div className="flex flex-wrap gap-2">
          {funcionarios.map((f) => (
            <button
              key={f.id}
              onClick={() => selecionar(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                funcionarioId === f.id
                  ? 'bg-teal-600 text-white shadow'
                  : 'bg-white text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.nome}
            </button>
          ))}
          {funcionarios.length === 0 && (
            <p className="text-sm text-gray-400">
              Nenhum funcionário cadastrado. Vá em Configuração.
            </p>
          )}
        </div>
      </section>

      {/* Seção 2 — Qual alimento */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Qual alimento?
        </h2>
        <div className="flex flex-wrap gap-2">
          {alimentos.map((a) => (
            <button
              key={a.id}
              onClick={() => setAlimentoSelecionado(a)}
              className={`rounded-lg px-4 py-3 text-sm font-medium transition ${
                alimentoSelecionado?.id === a.id
                  ? 'bg-teal-600 text-white shadow'
                  : 'bg-white text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>{a.nome}</span>
              {a.categoria && (
                <span className="ml-1 text-xs opacity-70">· {a.categoria}</span>
              )}
            </button>
          ))}
          {alimentos.length === 0 && (
            <p className="text-sm text-gray-400">
              Nenhum alimento cadastrado. Vá em Configuração.
            </p>
          )}
        </div>
      </section>

      {/* Seção 3 — Peso */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Peso desperdiçado (g)
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="number"
            inputMode="decimal"
            min={1}
            placeholder="ex: 500"
            value={pesoTexto}
            onChange={(e) => setPesoTexto(e.target.value)}
            className="w-36 rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-teal-500 focus:outline-none"
          />
          {custoEstimado !== null && (
            <span className="text-base font-medium text-teal-700">
              ≈ R$ {custoEstimado.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>
      </section>

      {/* Seção 4 — Motivo (opcional) */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Motivo <span className="font-normal normal-case text-gray-400">(opcional)</span>
        </h2>
        <input
          type="text"
          placeholder="ex: sobra do almoço, validade vencida..."
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-teal-500 focus:outline-none"
        />
      </section>

      {/* Botão confirmar */}
      <button
        onClick={confirmar}
        disabled={!podeConfirmar}
        className="w-full rounded-xl bg-teal-600 py-4 text-base font-semibold text-white shadow transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {enviando ? 'Salvando...' : 'Confirmar registro'}
      </button>

      {/* Feedback */}
      {sucesso && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-center text-green-700 ring-1 ring-green-200">
          Registro salvo com sucesso!
        </div>
      )}
      {erro && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-center text-red-700 ring-1 ring-red-200">
          {erro}
        </div>
      )}
    </div>
  )
}
