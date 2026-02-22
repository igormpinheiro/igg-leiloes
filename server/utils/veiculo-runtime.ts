const TIMEZONE_NEGOCIO = 'America/Sao_Paulo';

function formatarDia(data: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data);
}

export function calcularActive(dataLeilao: Date, agora: Date = new Date()): boolean {
  const diaLeilao = formatarDia(new Date(dataLeilao), TIMEZONE_NEGOCIO);
  const diaAtual = formatarDia(agora, TIMEZONE_NEGOCIO);
  return diaLeilao >= diaAtual;
}

export function normalizarDominio(url: string): string {
  const parsed = new URL(url);
  return parsed.hostname.replace(/^www\./i, '').toLowerCase();
}

export function extrairAnoLeilao(dataLeilao: Date | undefined): string {
  const alvo = dataLeilao ? new Date(dataLeilao) : new Date();
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE_NEGOCIO,
    year: 'numeric',
  }).format(alvo);
}
