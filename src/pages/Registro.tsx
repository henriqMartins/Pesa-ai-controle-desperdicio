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

export default function Registro() {
  const { alimentos, loading: loadingAlimentos } = useAlimentos()
  const { funcionarios, loading: loadingFuncionarios } = useFuncionarios()
  const { funcionarioId, selecionar } = useFuncionarioAtual()
  const { inserir } = useRegistros(1)

  const [alimentoSelecionado, setAlimentoSelecionado] = useState<Alimento | null>(null)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<UnidadeEntrada>('g')
  const [quantidadeTexto, setQuantidadeTexto] = useState('')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const quantidadeEntrada = parseFloat(quantidadeTexto)

  const custoEstimado =
    alimentoSelecionado && quantidadeEntrada > 0
      ? converterParaBase(quantidadeEntrada, unidadeSelecionada, alimentoSelecionado.unidade) *
        alimentoSelecionado.preco_por_unidade
      : null

  const podeConfirmar =
    !!funcionarioId && !!alimentoSelecionado && quantidadeEntrada > 0 && !enviando

  function selecionarAlimento(a: Alimento) {
    setAlimentoSelecionado(a)
    // Reseta para a primeira unidade disponível para esse alimento
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
        motivo: motivo.trim() || undefined,
      })
      setAlimentoSelecionado(null)
      setQuantidadeTexto('')
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

  const opcoesUnidade = alimentoSelecionado
    ? UNIDADES_ENTRADA[alimentoSelecionado.unidade]
    : []

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
              onClick={() => selecionarAlimento(a)}
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
              <span className={`ml-2 text-xs ${alimentoSelecionado?.id === a.id ? 'opacity-70' : 'text-gray-400'}`}>
                {a.unidade}
              </span>
            </button>
          ))}
          {alimentos.length === 0 && (
            <p className="text-sm text-gray-400">
              Nenhum alimento cadastrado. Vá em Configuração.
            </p>
          )}
        </div>
      </section>

      {/* Seção 3 — Quantidade */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Quantidade desperdiçada
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="number"
            inputMode="decimal"
            min={0.001}
            step="any"
            placeholder="ex: 500"
            value={quantidadeTexto}
            onChange={(e) => setQuantidadeTexto(e.target.value)}
            className="w-36 rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-teal-500 focus:outline-none"
          />
          {opcoesUnidade.length > 0 && (
            <select
              value={unidadeSelecionada}
              onChange={(e) => setUnidadeSelecionada(e.target.value as UnidadeEntrada)}
              className="rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-teal-500 focus:outline-none"
            >
              {opcoesUnidade.map((op) => (
                <option key={op.valor} value={op.valor}>
                  {op.label}
                </option>
              ))}
            </select>
          )}
          {custoEstimado !== null && (
            <span className="text-base font-medium text-teal-700">
              ≈ R$ {custoEstimado.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>
        {!alimentoSelecionado && (
          <p className="mt-1.5 text-xs text-gray-400">Selecione um alimento para escolher a unidade.</p>
        )}
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
