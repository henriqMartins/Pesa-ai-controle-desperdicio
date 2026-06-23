import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import type { RegistroCompleto } from '../types'
import type { ItemAlimento, ItemFuncionario } from '../hooks/useRegistrosFiltro'

interface DadosExport {
  registros: RegistroCompleto[]
  topAlimentos: ItemAlimento[]
  ranking: ItemFuncionario[]
  total: number
  label: string
}

function nomeArquivo(label: string, ext: string) {
  return `desperdicio-${label.replace(/[\s/–]/g, '-')}.${ext}`
}

function brl(valor: number) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

// ─── Excel ───────────────────────────────────────────────────────────────────

export function exportarExcel(dados: DadosExport) {
  const wb = XLSX.utils.book_new()

  const ws1 = XLSX.utils.json_to_sheet(
    dados.registros.map((r) => ({
      Data: new Date(r.criado_em).toLocaleDateString('pt-BR'),
      Hora: new Date(r.criado_em).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      Alimento: r.alimentos.nome,
      'Peso (g)': Number(r.peso_g),
      'Custo (R$)': Number(r.custo),
      Funcionário: r.funcionarios.nome,
      Motivo: r.motivo ?? '',
    })),
  )
  XLSX.utils.book_append_sheet(wb, ws1, 'Registros')

  const ws2 = XLSX.utils.json_to_sheet(
    dados.topAlimentos.map((a, i) => ({
      '#': i + 1,
      Alimento: a.nome,
      'Total (R$)': a.total,
      'Peso total (g)': a.pesoTotal,
      Registros: a.quantidade,
    })),
  )
  XLSX.utils.book_append_sheet(wb, ws2, 'Top Alimentos')

  const ws3 = XLSX.utils.json_to_sheet(
    dados.ranking.map((f, i) => ({
      '#': i + 1,
      Funcionário: f.nome,
      'Total (R$)': f.total,
      'Nº registros': f.quantidade,
    })),
  )
  XLSX.utils.book_append_sheet(wb, ws3, 'Ranking')

  XLSX.writeFile(wb, nomeArquivo(dados.label, 'xlsx'))
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

export function exportarPDF(dados: DadosExport) {
  const doc = new jsPDF()
  let y = 20
  const L = 14

  function titulo(texto: string) {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(texto, L, y)
    y += 7
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
  }

  function addLinha(colunas: Array<[string, number]>) {
    for (const [texto, x] of colunas) doc.text(texto, x, y)
    y += 5
    if (y > 275) {
      doc.addPage()
      y = 20
    }
  }

  // Cabeçalho
  doc.setFontSize(17)
  doc.setFont('helvetica', 'bold')
  doc.text('Relatório de Desperdício', L, y)
  y += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Período: ${dados.label}`, L, y)
  y += 5
  doc.text(`Total desperdiçado: ${brl(dados.total)}`, L, y)
  y += 5
  doc.text(`Total de registros: ${dados.registros.length}`, L, y)
  y += 10

  // Top alimentos
  titulo('Top Alimentos Desperdiçados')
  addLinha([['#', L], ['Alimento', L + 8], ['Total', 120], ['Peso total', 158]])
  for (const [i, a] of dados.topAlimentos.slice(0, 10).entries()) {
    addLinha([
      [`${i + 1}.`, L],
      [a.nome.slice(0, 28), L + 8],
      [brl(a.total), 120],
      [`${a.pesoTotal.toFixed(0)} g`, 158],
    ])
  }
  y += 5

  // Ranking
  titulo('Ranking de Funcionários')
  addLinha([['#', L], ['Funcionário', L + 8], ['Total', 120], ['Registros', 158]])
  for (const [i, f] of dados.ranking.entries()) {
    addLinha([
      [`${i + 1}.`, L],
      [f.nome.slice(0, 28), L + 8],
      [brl(f.total), 120],
      [String(f.quantidade), 158],
    ])
  }
  y += 5

  // Registros
  titulo('Registros')
  addLinha([['Data/Hora', L], ['Alimento', 48], ['Peso', 108], ['Custo', 128], ['Funcionário', 152]])
  for (const r of dados.registros) {
    const dt = new Date(r.criado_em).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    addLinha([
      [dt, L],
      [r.alimentos.nome.slice(0, 16), 48],
      [`${Number(r.peso_g).toFixed(0)}g`, 108],
      [`R$${Number(r.custo).toFixed(2)}`, 128],
      [r.funcionarios.nome.slice(0, 18), 152],
    ])
  }

  doc.save(nomeArquivo(dados.label, 'pdf'))
}
