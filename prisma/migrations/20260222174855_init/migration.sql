-- CreateTable
CREATE TABLE "Leiloeiro" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descricao" TEXT NOT NULL,
    "dominio" TEXT NOT NULL,
    "comissao" REAL NOT NULL,
    "taxaAdm" REAL NOT NULL,
    "taxaDespachante" REAL NOT NULL,
    "taxaVistoria" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Veiculo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "marca" TEXT NOT NULL,
    "ano" TEXT NOT NULL,
    "quilometragem" INTEGER NOT NULL,
    "sinistro" TEXT NOT NULL DEFAULT 'Nenhum',
    "ipvaPago" BOOLEAN NOT NULL DEFAULT true,
    "numeroLote" INTEGER,
    "lanceInicial" REAL NOT NULL,
    "lanceAtual" REAL NOT NULL,
    "valorMercado" REAL NOT NULL,
    "dataCaptura" DATETIME NOT NULL,
    "dataLeilao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "urlOrigem" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "leiloeiroId" INTEGER NOT NULL,
    "patioUf" TEXT,
    CONSTRAINT "Veiculo_leiloeiroId_fkey" FOREIGN KEY ("leiloeiroId") REFERENCES "Leiloeiro" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Leiloeiro_dominio_key" ON "Leiloeiro"("dominio");

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_urlOrigem_key" ON "Veiculo"("urlOrigem");

-- CreateIndex
CREATE INDEX "Veiculo_dataLeilao_idx" ON "Veiculo"("dataLeilao");

-- CreateIndex
CREATE INDEX "Veiculo_sinistro_idx" ON "Veiculo"("sinistro");

-- CreateIndex
CREATE INDEX "Veiculo_leiloeiroId_idx" ON "Veiculo"("leiloeiroId");
