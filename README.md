# Campus Ativo

API em NestJS do Campus Ativo, sistema de gestão de problemas de infraestrutura.

Se você vai contribuir com o projeto, consulte o [CONTRIBUTING.md](./.github/docs/CONTRIBUTING.md).

## Stack

- Node.js `22.18.0` via `.nvmrc` (`>=22.14.0 <23` em `package.json`)
- NestJS `11`
- TypeScript
- Prisma `7`
- PostgreSQL `16`
- Vitest
- Swagger / OpenAPI

## O que a API cobre

- autenticação com JWT
- cadastro e gestão de usuários
- criação, edição, descarte, restauração e exclusão definitiva de problemas
- gestão de categorias e localizações
- upload de anexos via ImgBB
- métricas e relatório do dashboard

## Estrutura resumida

```text
src/
  core/                 utilitários e abstrações compartilhadas
  domain/               regras de negócio
  infra/                HTTP, banco, auth, upload e integrações
prisma/                 schema e migrations
test/                   suporte aos testes
```

## Variáveis de ambiente

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Campos mais importantes para rodar localmente:

- `DATABASE_URL`
- `JWT_PRIVATE_KEY`
- `JWT_PUBLIC_KEY`
- `IMGBB_API_KEY`
- `SYSTEM_USER_EMAIL`
- `SYSTEM_USER_NAME`
- `SYSTEM_USER_POSITION`

## Rodando localmente

1. Instale as dependências:

```bash
npm install
```

2. Suba o PostgreSQL:

```bash
docker compose up -d
```

3. Crie o `.env`:

```bash
cp .env.example .env
```

4. Aplique as migrations:

```bash
npx prisma migrate dev
```

Se quiser apenas aplicar o histórico existente:

```bash
npx prisma migrate deploy
```

5. Inicie a API:

```bash
npm run dev
```

Por padrão, a aplicação sobe em `http://localhost:3333`.

## Documentação da API

Com a aplicação rodando:

- Swagger UI: `http://localhost:3333/api`
- OpenAPI JSON: `http://localhost:3333/api-json`

Para regenerar o [`openapi.json`](./openapi.json):

```bash
npm run openapi
```

## Scripts

```bash
npm run dev
npm run lint
npm run format
npm run format:check
npm run test
npm run test:watch
npm run openapi
```
