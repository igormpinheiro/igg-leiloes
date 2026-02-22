import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dadosLeiloeiros = [
    {
      descricao: 'Parque dos Leilões',
      dominio: 'parquedosleiloes.com.br',
      comissao: 5,
      taxaAdm: 1700,
      taxaDespachante: 0,
      taxaVistoria: 0,
    },
    {
      descricao: 'Leilo',
      dominio: 'leilo.com.br',
      comissao: 5,
      taxaAdm: 1900,
      taxaDespachante: 120,
      taxaVistoria: 250,
    },
  ];

  for (const leiloeiro of dadosLeiloeiros) {
    await prisma.leiloeiro.upsert({
      where: { dominio: leiloeiro.dominio },
      update: {
        descricao: leiloeiro.descricao,
        comissao: leiloeiro.comissao,
        taxaAdm: leiloeiro.taxaAdm,
        taxaDespachante: leiloeiro.taxaDespachante,
        taxaVistoria: leiloeiro.taxaVistoria,
      },
      create: leiloeiro,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
