// server/utils/parser-base.ts

export const MARCAS_CONHECIDAS = [
  'FIAT', 'VOLKSWAGEN', 'VW', 'TOYOTA', 'HONDA', 'HYUNDAI',
  'CHEVROLET', 'CHEV', 'GM', 'FORD', 'RENAULT', 'NISSAN',
  'BMW', 'MERCEDES', 'M.BENZ', 'AUDI', 'BYD', 'JEEP',
  'LAND ROVER', 'I/LR', 'LR', 'MITSUBISHI', 'MMC', 'KIA',
  'PEUGEOT', 'CITROEN', 'YAMAHA', 'SUZUKI', 'KAWASAKI',
  'JAC', 'I/JAC', 'VOLVO', 'I/VOLVO', 'SUBARU', 'MAZDA',
]

/**
 * Extrai um valor numérico de uma string monetária brasileira
 * Ex: "R$ 10.000,00" -> 10000, "R 50600" -> 50600
 */
export function extrairValorNumerico(texto: string): number {
  if (!texto) return 0

  // Tentar extrair com R$ ou R primeiro
  const valorPattern = /R\s*\$?\s*([\d.,]+)/
  const valorMatch = texto.match(valorPattern)

  if (valorMatch && valorMatch[1]) {
    const valor = valorMatch[1].replace(/[^\d,.]/g, '')
    if (valor.includes(',')) {
      return parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0
    }
    return parseFloat(valor) || 0
  }

  // Fallback: extrair qualquer número
  const numerosPattern = /([\d.,]+)/
  const numerosMatch = texto.match(numerosPattern)

  if (numerosMatch && numerosMatch[1]) {
    const valor = numerosMatch[1].replace(/[^\d,.]/g, '')
    if (valor.includes(',')) {
      return parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0
    }
    return parseFloat(valor) || 0
  }

  return 0
}

/**
 * Processa a descrição completa do veículo para separar marca e descrição
 * @param descricaoCompleta Descrição completa do veículo
 * @param marcaExterna Marca já extraída de fonte externa (JSON-LD), tem prioridade
 */
export function processarDescricao(descricaoCompleta: string, marcaExterna?: string): { marca: string, descricao: string } {
  let marca = marcaExterna || ''
  let descricao = descricaoCompleta

  // Se já temos a marca de fonte externa, usar ela e remover da descrição
  if (marcaExterna) {
    const regex = new RegExp(`^${marcaExterna}[\\s\\/\\-]+`, 'i')
    descricao = descricao.replace(regex, '').trim()
    descricao = descricao.replace(/^Leilão\s+de\s+\w+\s+/i, '').trim()
    return { marca: marcaExterna, descricao }
  }

  // Caso 1: Formato MARCA/MODELO
  if (descricaoCompleta.includes('/')) {
    const partes = descricaoCompleta.split('/')
    marca = (partes[0] || '').trim()
    if (partes.length > 1) {
      descricao = partes.slice(1).join('/').trim()
      return { marca, descricao }
    }
  }

  // Caso 2: Verificar se começa com uma marca conhecida
  for (const marcaConhecida of MARCAS_CONHECIDAS) {
    if (descricaoCompleta.toUpperCase().startsWith(marcaConhecida)) {
      marca = marcaConhecida
      descricao = descricaoCompleta.substring(marcaConhecida.length).trim()
      descricao = descricao.replace(/^[\s\-\/]+/, '')
      return { marca, descricao }
    } else if (!marca && descricaoCompleta.toUpperCase().includes(marcaConhecida)) {
      marca = marcaConhecida
    }
  }

  // Caso 3: Se não encontrou, usar o primeiro token
  if (!marca && descricaoCompleta.includes(' ')) {
    const partes = descricaoCompleta.split(' ')
    marca = partes[0] || ''
    descricao = partes.slice(1).join(' ')
  }

  marca = marca.replace(/^\*+\s*/, '')
  return { marca, descricao }
}
