# Plano: Parser Copart

## Contexto

A Copart (copart.com.br) é um novo leiloeiro a ser integrado no sistema de scraping. Diferente dos parsers existentes (que fazem HTML scraping), a Copart é uma SPA (AngularJS) que não retorna dados no HTML estático. Porém, expõe uma **API JSON pública**:

```
GET https://www.copart.com.br/public/data/lotdetails/solr/{lotNumber}
```

Isso simplifica enormemente o parser — sem necessidade de Puppeteer ou HTML parsing.

## Mapeamento de campos API → Veiculo

| Campo API | Campo Veiculo | Exemplo | Notas |
|---|---|---|---|
| `mkn` | `marca` | "CHEVROLET" | Já vem uppercase |
| `lm` + `version` | `modelo` | "ONIX PLUS" / "Onix Plus AT 1.0..." | `version` é mais detalhado |
| `cmmnts` | `descricao` | "IPVA PAGO: 2026..." | Comentários livres |
| `lcy` / `my` | `ano` | 2020 / "2019" | `my`/`lcy` → "2019/2020" |
| `la` | `quilometragem` | 60853.0 | Float, converter para int |
| `damageDesc` / `dtd` | `sinistro` | "Pequena Monta", "Grande Monta", "Não Aplicável" | Mapear para TipoSinistro |
| `currBid` | `lanceAtual` | 30900.0 | Lance atual |
| `bnp` | `lanceInicial` | 0.0 | Sempre 0 na API; usar `currBid` como fallback |
| (estimado) | `valorMercado` | 56181.82 | Estimado por histórico local ou heurística por sinistro |
| `ad` | `dataLeilao` | 1772640000000 | Timestamp em ms |
| `ln` | `numeroLote` | 1049431 | Número do lote |
| `yn` / `pyn` | `patioUf` | "Goiânia - GO" | Extrair UF da string |
| `cmmnts` | `ipvaPago` | "IPVA PAGO: 2026" | Checar no texto |
| `stt` | (filtro) | "Irrecuperavel" | Descartar se irrecuperável |
| `vt` | (filtro) | "Recortado" | Descartar se recortado (sucata) |

### Campos adicionais disponíveis na API (não usados atualmente)

| Campo API | Descrição | Exemplo |
|---|---|---|
| `ft` | Tipo de combustível | "FLEXIVEL ALCOOL/GASOLINA" |
| `fv` | VIN parcial | "9BGEA69H0L" |
| `scn` | Seguradoras/consórcio | "PORTO SEGURO CIA DE SEGUROS GERAIS" |
| `lt` | Tipo do lote | "COLISÃO", "CONSÓRCIO" |
| `drvr` | Condição de direção | "Motor dá partida e engrena", "Desconhecido" |
| `inc` | Incremento de lance | 200.0, 500.0 |
| `aan` | Quantidade de acessos | 137, 77, 5 |
| `hk` | Habilitação/chave | "Y" / "N" |
| `armored` | Blindado | false |
| `lotSoldFlag` | Se foi vendido | false |

## Regras de descarte

- `damageDesc` contém "Grande Monta" → descartar (como outros parsers)
- `damageDesc` contém "Sucata" → descartar
- `stt` = "Irrecuperavel" → descartar (equivale a sucata)
- `vt` = "Recortado" → descartar (sucata)

> **Importante**: comparar sempre com normalização (lowercase + remoção de acentos), para cobrir variações como "Irrecuperável"/"Irrecuperavel" e "Média"/"Media".

## Estratégia de estimativa de `valorMercado` (Copart)

Como a Copart não informa o valor de mercado de forma confiável, o parser deve estimar em cascata:

### 1) Prioridade: histórico local (base SQLite)

Buscar em `Veiculo` por similaridade de marca/modelo/ano:

- **Marca**: match exato após normalização (`uppercase`, sem acento, sem pontuação extra).
- **Modelo**: match por tokens relevantes, tolerando variações de escrita.
  - Ex.: `ONIX 1.0 TURBO AUTOMATICO PREMIER2`, `ONIX PLUS 10MT LT2`, `ONIX JOYE (4P)`, `ONIX LT 1.4 MECANICO (4P)` devem convergir para família ONIX.
- **Ano**: usar aproximação pelo ano-base (qualquer um do formato `AAAA/AAAA`).
  - Ex.: busca por 2015 aceita `2014/2015`, `2015/2015`, `2015/2016`.

Se encontrar veículo equivalente, reutilizar `valorMercado` do registro mais próximo (priorizar menor distância de ano e melhor similaridade de modelo).

### 1.1) Ajuste percentual por diferença de ano

Se houver match de modelo/marca mas não houver ano equivalente direto:

- Pegar o registro mais próximo em ano.
- Aplicar ajuste percentual fixo por ano de diferença.
- O percentual deve ficar em configuração (ex.: `CONFIG_NEGOCIO.estimativas.ajusteValorMercadoPorAno`).
- Regra:
  - ano alvo menor que ano referência → **subtrair** `%` por ano.
  - ano alvo maior que ano referência → **somar** `%` por ano.

Exemplo:
- alvo: ONIX 2013
- referência encontrada: ONIX 2014/2015 com `valorMercado = X`
- diferença: 1 ano
- estimado: `X * (1 - percentualPorAno)`

### 2) Fallback: heurística por lance e sinistro

Se não houver histórico local utilizável, estimar via `lanceInicial` (ou `currBid` como fallback quando `bnp = 0`):

- `TipoSinistro.Nenhum` → lance representa **55%** do valor de mercado
- `TipoSinistro.PequenaMonta` → **50%**
- `TipoSinistro.MediaMonta` → **40%**

Fórmula:

- `valorMercado = lanceBase / percentualFaixa`
- `lanceBase = lanceInicial > 0 ? lanceInicial : currBid`

Se não houver `lanceBase > 0`, usar `0`.

## Exemplos de respostas da API

### Lote 1049431 — Chevrolet Onix Plus (Normal, sem sinistro)
```json
{
  "ln": 1049431, "mkn": "CHEVROLET", "lm": "ONIX PLUS", "lcy": 2020, "my": "2019",
  "version": "Onix Plus AT 1.0 12V Ecotec Turbo", "la": 60853.0, "currBid": 30900.0,
  "damageDesc": "Não Aplicável", "dtd": "Não Aplicável", "stt": "Normal", "vt": "Normal",
  "yn": "Goiânia - GO", "cmmnts": "", "ad": 1772640000000
}
```

### Lote 1080678 — Toyota Corolla (Recuperável, Pequena Monta)
```json
{
  "ln": 1080678, "mkn": "TOYOTA", "lm": "COROLLA", "lcy": 2022, "my": "2021",
  "version": "Corolla XEi 2.0 16V Dual VVT-iE", "la": 123415.0, "currBid": 56150.0,
  "damageDesc": "Pequena Monta", "dtd": "Pequena Monta", "stt": "Recuperavel", "vt": "Normal",
  "yn": "Goiânia - GO", "cmmnts": "IPVA PAGO: 2026. . COLISÃO POR BAIXO - CAMBIO DANIFICADO.\n",
  "ad": 1772625600000
}
```

### Lote 1063660 — Toyota Etios (Irrecuperável, Grande Monta) → DESCARTADO
```json
{
  "ln": 1063660, "mkn": "TOYOTA", "lm": "ETIOS SEDA", "lcy": 2016, "my": "2015",
  "version": "Etios Seda XLS 1.5 16V", "la": 47588.0, "currBid": 50.0,
  "damageDesc": "Grande Monta", "dtd": "Grande Monta", "stt": "Irrecuperavel", "vt": "Recortado",
  "yn": "Goiânia - GO", "cmmnts": "", "ad": 1772625600000
}
```

## Arquivos a criar/modificar

### 1. CRIAR: `server/utils/copart-parser.ts`

Parser baseado em API JSON (não HTML). Estrutura:

```typescript
export class CopartParser {
  static async parseCopart(html: string, url: string): Promise<Veiculo | null> {
    // 1. Extrair lotNumber da URL: /lot/{number}
    // 2. Chamar API: GET /public/data/lotdetails/solr/{lotNumber}
    // 3. Mapear campos para Veiculo
    // 4. Aplicar filtros (sucata, grande monta, irrecuperável, recortado)
  }
}
```

> **Nota**: O parser recebe `html` por convenção da interface `LeiloeiroConfig`, mas irá ignorá-lo e fazer a chamada à API diretamente. O `url` será usado para extrair o número do lote.

**Mapeamento de sinistro:**
- "Não Aplicável" → `TipoSinistro.Nenhum`
- "Pequena Monta" → `TipoSinistro.PequenaMonta`
- "Média Monta" / "Media Monta" → `TipoSinistro.MediaMonta`
- "Grande Monta" → `TipoSinistro.GrandeMonta` (descartado)
- "Sucata" → `TipoSinistro.Sucata` (descartado)
- "Indício de Sinistro" / "Indicio de Sinistro" → `TipoSinistro.IndicioSinistro`
- "Recuperado de Sinistro" → `TipoSinistro.RecuperadoSinistro`
- Qualquer outro → `TipoSinistro.Nenhum`

**Extração de UF:**
- `yn` = "Goiânia - GO" → regex `/ - ([A-Z]{2})$/` → "GO"

**Extração de IPVA:**
- Checar `cmmnts` por "IPVA PAGO" → true, senão false

**Modelo:**
- Usar `version` como modelo (mais detalhado) ou `lm` como fallback

### 2. MODIFICAR: `server/utils/leiloeiro-registry.ts`

Adicionar import e novo entry no array `LEILOEIROS`:

```typescript
import { CopartParser } from './copart-parser';

// No array LEILOEIROS:
{
  descricao: 'Copart',
  dominio: 'copart.com.br',
  comissaoPadrao: 5,
  taxaAdmPadrao: 1700,
  taxaDespachantePadrao: 0,
  taxaVistoriaPadrao: 0,
  parser: CopartParser.parseCopart,
}
```

### 3. MODIFICAR: `app/services/scrapperService.ts`

Adicionar `'copart.com.br'` ao array `supportedDomains` em `isUrlSupported()`.

### 4. `server/utils/extract-veiculo.ts` — SEM ALTERAÇÕES

O pipeline atual faz `fetch(url)` para obter HTML e passa ao parser. Como o parser da Copart ignora o HTML e faz sua própria chamada à API, o pipeline existente já funciona sem alterações.

### 5. CRIAR: `server/utils/valor-mercado-estimador.ts`

Responsável por encapsular a lógica de estimativa em cascata:

1. Normalização de marca/modelo/ano
2. Busca de similares no banco
3. Ajuste percentual por diferença de ano
4. Fallback por lance + sinistro

Assinatura sugerida:

```typescript
export async function estimarValorMercadoCopart(input: {
  marca: string;
  modelo: string;
  ano: string;
  sinistro: TipoSinistro;
  lanceInicial: number;
  lanceAtual: number;
}): Promise<number>
```

### 6. Configuração de negócio (percentuais)

Adicionar em configuração central:

- `estimativas.ajusteValorMercadoPorAno` (ex.: `0.05`)
- `estimativas.percentualLanceSobreMercado`:
  - `nenhum: 0.55`
  - `pequenaMonta: 0.50`
  - `mediaMonta: 0.40`

### 7. Tratamento de erro da API Copart

Para facilitar retry/orquestração:

- Erros técnicos (timeout, 429, 5xx, JSON inválido, rede) devem ser **explícitos** (lançar erro).
- Casos de negócio (lote descartado por regra: sucata/grande monta/irrecuperável/recortado) retornam `null`.

## Verificação

1. Rodar `npm run dev`
2. Na página de scrapper, colar `https://www.copart.com.br/lot/1049431`
3. Verificar que o veículo é extraído corretamente com todos os campos, incluindo `valorMercado` estimado
4. Testar com lote de Grande Monta (`1063660`) — deve ser descartado (retorno null)
5. Testar com lote de Pequena Monta (`1080678`) — deve ser salvo com sinistro correto e IPVA pago
6. Forçar erro da API Copart (simular 429/5xx) — deve retornar erro explícito para permitir retry
7. Validar estimativa por histórico:
   - mesmo modelo com variação textual deve reaproveitar `valorMercado` existente
   - ano aproximado deve funcionar (`2014/2015` ~ `2015/2016`)
