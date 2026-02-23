-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Veiculo" (
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
    "isCandidato" BOOLEAN NOT NULL DEFAULT false,
    "candidatoOrdem" INTEGER,
    "lanceLimite" REAL,
    "candidatoStatus" TEXT,
    "candidatoUltimoErro" TEXT,
    "candidatoAtualizadoEm" DATETIME,
    CONSTRAINT "Veiculo_leiloeiroId_fkey" FOREIGN KEY ("leiloeiroId") REFERENCES "Leiloeiro" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Veiculo" ("ano", "createdAt", "dataCaptura", "dataLeilao", "descricao", "id", "ipvaPago", "lanceAtual", "lanceInicial", "leiloeiroId", "marca", "modelo", "numeroLote", "patioUf", "quilometragem", "sinistro", "updatedAt", "urlOrigem", "valorMercado") SELECT "ano", "createdAt", "dataCaptura", "dataLeilao", "descricao", "id", "ipvaPago", "lanceAtual", "lanceInicial", "leiloeiroId", "marca", "modelo", "numeroLote", "patioUf", "quilometragem", "sinistro", "updatedAt", "urlOrigem", "valorMercado" FROM "Veiculo";
DROP TABLE "Veiculo";
ALTER TABLE "new_Veiculo" RENAME TO "Veiculo";
CREATE UNIQUE INDEX "Veiculo_urlOrigem_key" ON "Veiculo"("urlOrigem");
CREATE INDEX "Veiculo_dataLeilao_idx" ON "Veiculo"("dataLeilao");
CREATE INDEX "Veiculo_sinistro_idx" ON "Veiculo"("sinistro");
CREATE INDEX "Veiculo_leiloeiroId_idx" ON "Veiculo"("leiloeiroId");
CREATE INDEX "Veiculo_isCandidato_idx" ON "Veiculo"("isCandidato");
CREATE INDEX "Veiculo_isCandidato_candidatoOrdem_idx" ON "Veiculo"("isCandidato", "candidatoOrdem");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
