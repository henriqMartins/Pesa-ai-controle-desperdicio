/** Formata um valor canônico ("12.5") para exibição pt-BR ("12,5"). */
export function exibirNumero(valor: string): string {
  return valor.replace('.', ',')
}
