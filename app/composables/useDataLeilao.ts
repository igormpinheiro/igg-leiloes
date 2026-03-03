export function useDataLeilao() {
  function formatarDia(data: Date, timeZone: string = 'America/Sao_Paulo'): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(data);
  }

  function formatarDiaUTC(data: Date): string {
    const ano = data.getUTCFullYear();
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(data.getUTCDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  function ehMeiaNoiteUTC(data: Date): boolean {
    return data.getUTCHours() === 0
      && data.getUTCMinutes() === 0
      && data.getUTCSeconds() === 0
      && data.getUTCMilliseconds() === 0;
  }

  function extrairDiaLeilao(dataLeilao: Date): string {
    const alvo = new Date(dataLeilao);
    if (ehMeiaNoiteUTC(alvo)) {
      return formatarDiaUTC(alvo);
    }
    return formatarDia(alvo);
  }

  function calcularActive(dataLeilao?: Date): boolean {
    if (!dataLeilao) return false;
    const diaLeilao = extrairDiaLeilao(dataLeilao);
    const diaAtual = formatarDia(new Date());
    return diaLeilao >= diaAtual;
  }

  return {
    calcularActive,
  };
}
