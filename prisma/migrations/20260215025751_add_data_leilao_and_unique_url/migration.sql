-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Veiculo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "ano" TEXT NOT NULL,
    "quilometragem" INTEGER NOT NULL,
    "sinistro" BOOLEAN NOT NULL,
    "lanceInicial" REAL NOT NULL,
    "lanceAtual" REAL NOT NULL,
    "valorMercado" REAL NOT NULL,
    "dataCaptura" DATETIME NOT NULL,
    "dataLeilao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "urlOrigem" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "leiloeiro" TEXT NOT NULL
);
INSERT INTO "new_Veiculo" ("active", "ano", "createdAt", "dataCaptura", "descricao", "id", "lanceAtual", "lanceInicial", "leiloeiro", "marca", "quilometragem", "sinistro", "updatedAt", "urlOrigem", "valorMercado") SELECT "active", "ano", "createdAt", "dataCaptura", "descricao", "id", "lanceAtual", "lanceInicial", "leiloeiro", "marca", "quilometragem", "sinistro", "updatedAt", "urlOrigem", "valorMercado" FROM "Veiculo";
DROP TABLE "Veiculo";
ALTER TABLE "new_Veiculo" RENAME TO "Veiculo";
CREATE UNIQUE INDEX "Veiculo_urlOrigem_key" ON "Veiculo"("urlOrigem");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
