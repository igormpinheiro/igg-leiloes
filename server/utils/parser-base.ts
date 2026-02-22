// server/utils/parser-base.ts

export const MARCAS_CONHECIDAS = [
  'FIAT', 'VOLKSWAGEN', 'VW', 'TOYOTA', 'HONDA', 'HYUNDAI',
  'CHEVROLET', 'CHEV', 'GM', 'FORD', 'RENAULT', 'NISSAN',
  'BMW', 'MERCEDES', 'M.BENZ', 'AUDI', 'BYD', 'JEEP',
  'LAND ROVER', 'I/LR', 'LR', 'MITSUBISHI', 'MMC', 'KIA',
  'PEUGEOT', 'CITROEN', 'YAMAHA', 'SUZUKI', 'KAWASAKI',
  'JAC', 'I/JAC', 'VOLVO', 'I/VOLVO', 'SUBARU', 'MAZDA',
];

/**
 * Extrai um valor numérico de uma string monetária brasileira
 * Ex: "R$ 10.000,00" -> 10000, "R 50600" -> 50600
 */
export function extrairValorNumerico(texto: string): number {
  if (!texto) return 0;

  const valorPattern = /R\s*\$?\s*([\d.,]+)/;
  const valorMatch = texto.match(valorPattern);

  if (valorMatch && valorMatch[1]) {
    const valor = valorMatch[1].replace(/[^\d,.]/g, '');
    if (valor.includes(',')) {
      return parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return parseFloat(valor) || 0;
  }

  const numerosPattern = /([\d.,]+)/;
  const numerosMatch = texto.match(numerosPattern);

  if (numerosMatch && numerosMatch[1]) {
    const valor = numerosMatch[1].replace(/[^\d,.]/g, '');
    if (valor.includes(',')) {
      return parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return parseFloat(valor) || 0;
  }

  return 0;
}

/**
 * Processa a descrição completa do veículo para separar marca e modelo.
 */
export function processarDescricao(descricaoCompleta: string, marcaExterna?: string): { marca: string; modelo: string } {
  let marca = marcaExterna || '';
  let modelo = descricaoCompleta;

  if (marcaExterna) {
    const regex = new RegExp(`^${marcaExterna}[\\s\\/\\-]+`, 'i');
    modelo = modelo.replace(regex, '').trim();
    modelo = modelo.replace(/^Leilão\s+de\s+\w+\s+/i, '').trim();
    return { marca: marcaExterna, modelo };
  }

  if (descricaoCompleta.includes('/')) {
    const partes = descricaoCompleta.split('/');
    marca = (partes[0] || '').trim();
    if (partes.length > 1) {
      modelo = partes.slice(1).join('/').trim();
      return { marca, modelo };
    }
  }

  for (const marcaConhecida of MARCAS_CONHECIDAS) {
    if (descricaoCompleta.toUpperCase().startsWith(marcaConhecida)) {
      marca = marcaConhecida;
      modelo = descricaoCompleta.substring(marcaConhecida.length).trim();
      modelo = modelo.replace(/^[\s\-\/]+/, '');
      return { marca, modelo };
    }

    if (!marca && descricaoCompleta.toUpperCase().includes(marcaConhecida)) {
      marca = marcaConhecida;
    }
  }

  if (!marca && descricaoCompleta.includes(' ')) {
    const partes = descricaoCompleta.split(' ');
    marca = partes[0] || '';
    modelo = partes.slice(1).join(' ');
  }

  marca = marca.replace(/^\*+\s*/, '');
  return { marca, modelo };
}
