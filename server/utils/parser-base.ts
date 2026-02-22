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
 * Remove padrões de ano (ex: "2013/2013", "2019/2020", "2022") do texto.
 */
function removerAno(texto: string): string {
  return texto
    .replace(/\b(19|20)\d{2}\/(19|20)\d{2}\b/g, '')
    .replace(/\b(19|20)\d{2}\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Processa a descrição completa do veículo para separar marca e modelo.
 * Remove prefixo "I/" (importado), identifica a marca por lista conhecida
 * e remove padrões de ano do modelo.
 */
export function processarMarcaModelo(descricaoCompleta: string, marcaExterna?: string): { marca: string; modelo: string } {
  let marca = marcaExterna || '';
  let texto = descricaoCompleta.trim();

  // Remove prefixo "I/" (indicador de importado)
  texto = texto.replace(/^I\//, '').trim();

  if (marcaExterna) {
    const regex = new RegExp(`^${marcaExterna}[\\s\\/\\-]+`, 'i');
    const modelo = texto.replace(regex, '').replace(/^Leilão\s+de\s+\w+\s+/i, '').trim();
    return { marca: marcaExterna, modelo: removerAno(modelo) };
  }

  const textoUpper = texto.toUpperCase();

  // Tenta encontrar marca conhecida no início da descrição
  // Ordena por tamanho decrescente para priorizar matches mais específicos (ex: "LAND ROVER" antes de "LR")
  const marcasOrdenadas = [...MARCAS_CONHECIDAS].sort((a, b) => b.length - a.length);

  for (const marcaConhecida of marcasOrdenadas) {
    if (textoUpper.startsWith(marcaConhecida)) {
      marca = marcaConhecida;
      const modelo = texto.substring(marcaConhecida.length).replace(/^[\s\-\/]+/, '').trim();
      return { marca, modelo: removerAno(modelo) };
    }
  }

  // Fallback: primeira palavra como marca
  if (texto.includes(' ')) {
    const partes = texto.split(' ');
    marca = (partes[0] || '').replace(/^\*+\s*/, '');
    const modelo = partes.slice(1).join(' ');
    return { marca, modelo: removerAno(modelo) };
  }

  return { marca: texto.replace(/^\*+\s*/, ''), modelo: removerAno(texto) };
}
