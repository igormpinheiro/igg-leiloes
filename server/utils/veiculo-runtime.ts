const TIMEZONE_NEGOCIO = 'America/Sao_Paulo';

function formatarDia(data: Date, timeZone: string): string {
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

  // Datas em formato YYYY-MM-DD costumam chegar/salvar como 00:00:00Z.
  // Nesse caso, usamos o dia UTC para evitar "voltar" um dia no fuso de SP.
  if (ehMeiaNoiteUTC(alvo)) {
    return formatarDiaUTC(alvo);
  }

  return formatarDia(alvo, TIMEZONE_NEGOCIO);
}

export function normalizarDataLeilao(dataLeilao?: string | Date | null): Date {
  if (!dataLeilao) {
    return new Date();
  }

  if (dataLeilao instanceof Date) {
    return new Date(dataLeilao);
  }

  const texto = dataLeilao.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return new Date(`${texto}T12:00:00-03:00`);
  }

  return new Date(texto);
}

export function calcularActive(dataLeilao: Date, agora: Date = new Date()): boolean {
  const diaLeilao = extrairDiaLeilao(dataLeilao);
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
