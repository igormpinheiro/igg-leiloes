# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.


Olá, estou criando aplicação usando Vue + Nuxt + Tailwind. Essa app será para acompanhar carros de leilões. A aplicação fará um scrapper dos sites de leiloes, para popular meu banco de dados e depois exibir em uma uma única página, com duas colunas, um para os filtros e outro para uma tabela.

- Quero quer estruture inicialmente a aplicação. Tenha em mente que será um MVP, então precisa ser algo simples mas com possibilidade para crescer.
- Não utilizarei Autenticação inicialmente.
- Vamos construir por módulos:
  - página inicial
  - Banco de dados (Sqlite + prisma)
  - Scrapper
- Não sugira mais do que um módulo por vez, para facilitar a implementação.
- Abaixo está a minha entidade principal. Está em C#, gostaria que convertesse para TS. Começarei com ela e expandirei se sentir necessidade.


public class Veiculo
{
public Guid Id { get; set; }
public string Descricao { get; set; } = string.Empty;
public string Marca { get; set; } = string.Empty;
public string Ano { get; set; } = string.Empty;
public decimal Score { get; set; }
public long Quilometragem { get; set; } = string.Empty;
public bool Sinistro { get; set; } = string.Empty;
public decimal LanceInicial { get; set; }
public decimal LanceAtual { get; set; } = string.Empty;
public decimal ValorMercado { get; set; } = string.Empty;
public DateTime DataCaptura { get; set; }
public string UrlOrigem { get; set; } = string.Empty;
}



 

- a tabela conterá Descricao, Ano, Quilometragem, LanceAtual, ValorMercado, score. Podendo ser ordenado por Ano, Quilometragem, LanceAtual e score. Ordenação inicial = score. Podendo ordenar por mais de uma opção.
- Os filtros serão por ano, descrição, valor e score.
