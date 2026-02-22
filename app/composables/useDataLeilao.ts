export function useDataLeilao() {
  function formatarDia(data: Date, timeZone: string = 'America/Sao_Paulo'): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(data);
  }

  function calcularActive(dataLeilao?: Date): boolean {
    if (!dataLeilao) return false;
    const diaLeilao = formatarDia(new Date(dataLeilao));
    const diaAtual = formatarDia(new Date());
    return diaLeilao >= diaAtual;
  }

  return {
    calcularActive,
  };
}
