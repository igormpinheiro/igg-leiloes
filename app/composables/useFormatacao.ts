// composables/useFormatacao.ts

export function useFormatacao() {
  function formatarValor(valor: number): string {
    return valor.toLocaleString('pt-BR')
  }

  function formatarData(data: Date | string): string {
    const d = typeof data === 'string' ? new Date(data) : data
    return d.toLocaleDateString('pt-BR')
  }

  return { formatarValor, formatarData }
}
