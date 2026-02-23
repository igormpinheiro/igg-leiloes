type CalcularLanceLimiteInput = {
  valorMercado: number | null | undefined;
  lanceAtual: number | null | undefined;
  lanceInicial: number | null | undefined;
  incremento: number;
  percentual?: number;
};

function normalizarIncremento(incremento: number): number {
  if (!Number.isFinite(incremento) || incremento <= 0) {
    return 1;
  }

  return incremento;
}

function arredondarParaBaixoNoIncremento(valor: number, incremento: number): number {
  const incrementoNormalizado = normalizarIncremento(incremento);
  const arredondado = Math.floor(valor / incrementoNormalizado) * incrementoNormalizado;
  if (arredondado > 0) {
    return arredondado;
  }

  return incrementoNormalizado;
}

export function calcularLanceLimite({
  valorMercado,
  lanceAtual,
  lanceInicial,
  incremento,
  percentual = 0.6,
}: CalcularLanceLimiteInput): number | null {
  const incrementoNormalizado = normalizarIncremento(incremento);

  const mercado = Number(valorMercado ?? 0);
  const atual = Number(lanceAtual ?? 0);
  const inicial = Number(lanceInicial ?? 0);
  const lanceBase = atual > 0 ? atual : inicial;

  const alvo = mercado > 0 ? mercado * percentual : lanceBase;

  if (!Number.isFinite(alvo) || alvo <= 0) {
    return null;
  }

  return arredondarParaBaixoNoIncremento(alvo, incrementoNormalizado);
}
