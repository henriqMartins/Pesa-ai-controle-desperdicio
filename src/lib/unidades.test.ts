import { describe, it, expect } from 'vitest'
import { converterParaBase, exibirQuantidade } from './unidades'

// Estas funções são o coração da "correção dos dados": converter o que a pessoa
// digita (ex.: 500 g) para a unidade base do alimento (kg) e reexibir fielmente.
// Um erro aqui faz o custo e os relatórios inteiros ficarem errados — por isso
// são as primeiras a ter teste automatizado.

describe('converterParaBase', () => {
  it('converte gramas para quilos', () => {
    expect(converterParaBase(500, 'g', 'kg')).toBeCloseTo(0.5, 10)
  })

  it('mantém o valor quando a unidade digitada já é a base', () => {
    expect(converterParaBase(2, 'kg', 'kg')).toBe(2)
    expect(converterParaBase(1.5, 'L', 'L')).toBe(1.5)
    expect(converterParaBase(3, 'un', 'un')).toBe(3)
  })

  it('converte mililitros para litros', () => {
    expect(converterParaBase(250, 'mL', 'L')).toBeCloseTo(0.25, 10)
  })

  it('lança erro quando a unidade não é válida para a base do alimento', () => {
    // 'kg' não faz sentido para um alimento cuja base é 'un'
    expect(() => converterParaBase(1, 'kg', 'un')).toThrow(/inválida/)
  })
})

describe('exibirQuantidade', () => {
  it('reexibe na unidade em que foi digitado (0,5 kg salvo, digitado em g → "500 g")', () => {
    expect(exibirQuantidade(0.5, 'g', 'kg')).toBe('500 g')
  })

  it('exibe inteiros sem casas decimais', () => {
    expect(exibirQuantidade(2, 'kg', 'kg')).toBe('2 kg')
    expect(exibirQuantidade(3, 'un', 'un')).toBe('3 un')
  })

  it('exibe litros a partir de mililitros', () => {
    expect(exibirQuantidade(0.25, 'mL', 'L')).toBe('250 mL')
  })

  it('mantém casas decimais quando o valor não é inteiro', () => {
    expect(exibirQuantidade(1.5, 'L', 'L')).toBe('1.5 L')
  })

  it('usa fator 1 como fallback para unidade desconhecida (não quebra)', () => {
    expect(exibirQuantidade(2, 'xyz', 'kg')).toBe('2 xyz')
  })
})
