-- CreateTable
CREATE TABLE "Veiculo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "ano" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "quilometragem" INTEGER NOT NULL,
    "sinistro" BOOLEAN NOT NULL,
    "lanceInicial" REAL NOT NULL,
    "lanceAtual" REAL NOT NULL,
    "valorMercado" REAL NOT NULL,
    "dataCaptura" DATETIME NOT NULL,
    "urlOrigem" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
