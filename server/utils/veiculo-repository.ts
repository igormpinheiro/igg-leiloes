import type { Veiculo } from '~/types/veiculo';
import prisma from './prisma';

/**
 * Faz upsert de um veículo no banco (cria ou atualiza campos vazios)
 */
export async function upsertVeiculo(
  veiculo: Veiculo,
  dataLeilaoDate: Date,
): Promise<{ result: any; action: 'created' | 'updated' }> {
  const existing = await prisma.veiculo.findUnique({
    where: { urlOrigem: veiculo.urlOrigem },
  });

  const isMissingText = (value: string | null | undefined) => !value || value.trim() === '';
  const isMissingNumber = (value: number | null | undefined) => value === null || value === undefined || value === 0;

  if (existing) {
    const updateData: Record<string, any> = {
      lanceAtual: veiculo.lanceAtual,
      leiloeiroId: veiculo.leiloeiroId,
    };

    if (isMissingText(existing.modelo)) updateData.modelo = veiculo.modelo;
    if (isMissingText(existing.descricao)) updateData.descricao = veiculo.descricao;
    if (isMissingText(existing.marca)) updateData.marca = veiculo.marca;
    if (isMissingText(existing.ano)) updateData.ano = veiculo.ano;
    if (isMissingNumber(existing.quilometragem)) updateData.quilometragem = veiculo.quilometragem;
    if (existing.sinistro === 'Nenhum' && veiculo.sinistro !== 'Nenhum') updateData.sinistro = veiculo.sinistro;
    if (isMissingNumber(existing.lanceInicial)) updateData.lanceInicial = veiculo.lanceInicial;
    if (isMissingNumber(existing.valorMercado)) updateData.valorMercado = veiculo.valorMercado;
    if (!existing.dataLeilao) updateData.dataLeilao = dataLeilaoDate;
    if (!existing.dataCaptura) updateData.dataCaptura = new Date(veiculo.dataCaptura);
    if (existing.numeroLote === null && veiculo.numeroLote !== null && veiculo.numeroLote !== undefined) {
      updateData.numeroLote = veiculo.numeroLote;
    }

    if (!existing.ipvaPago && veiculo.ipvaPago) updateData.ipvaPago = true;
    if (isMissingText(existing.patioUf) && veiculo.patioUf) updateData.patioUf = veiculo.patioUf;

    const result = await prisma.veiculo.update({
      where: { urlOrigem: veiculo.urlOrigem },
      data: updateData,
    });

    return { result, action: 'updated' };
  }

  const result = await prisma.veiculo.create({
    data: {
      modelo: veiculo.modelo,
      descricao: veiculo.descricao,
      marca: veiculo.marca,
      ano: veiculo.ano,
      quilometragem: veiculo.quilometragem,
      sinistro: veiculo.sinistro,
      ipvaPago: veiculo.ipvaPago,
      numeroLote: veiculo.numeroLote,
      lanceInicial: veiculo.lanceInicial,
      lanceAtual: veiculo.lanceAtual,
      valorMercado: veiculo.valorMercado,
      dataCaptura: new Date(veiculo.dataCaptura),
      dataLeilao: dataLeilaoDate,
      urlOrigem: veiculo.urlOrigem,
      leiloeiroId: veiculo.leiloeiroId,
      patioUf: veiculo.patioUf,
    },
  });

  return { result, action: 'created' };
}

/**
 * Deleta um veículo por URL (para lotes cancelados/sucata)
 */
export async function deletarVeiculoPorUrl(url: string): Promise<boolean> {
  const existing = await prisma.veiculo.findUnique({
    where: { urlOrigem: url },
  });

  if (existing) {
    await prisma.veiculo.delete({
      where: { urlOrigem: url },
    });
    return true;
  }

  return false;
}
