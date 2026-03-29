# Campus Ativo

API em NestJS do Campus Ativo para gestão de problemas de infraestrutura.

Se você vai contribuir com o projeto, consulte o [guia de contribuição](./.github/docs/CONTRIBUTING.md).

## Stack

- Node.js `22.18.0` via `.nvmrc` (`>=22.14.0 <23` em `package.json`)
- NestJS `11`
- TypeScript
- Prisma `7`
- PostgreSQL `16`
- Vitest
- Swagger / OpenAPI
- Amazon S3 para anexos

## O que a API cobre

- autenticação com JWT (`RS256`)
- cadastro e gestão de usuários
- criação, edição e fluxo de tratamento de problemas
- lixeira, restauração e exclusão definitiva de problemas, categorias e localizações
- upload e resolução de URLs de anexos via S3
- métricas e relatório do dashboard
- importação de problemas por CSV

## Estrutura

```text
src/
  core/                 utilitários e abstrações compartilhadas
  domain/               regras de negócio
  infra/                HTTP, banco, auth, upload e integrações
prisma/                 schema e migrations
test/                   suporte aos testes
```

## Pré-requisitos

- Node.js `22.18.0`
- npm
- Docker e Docker Compose
- acesso a um bucket S3 com credenciais válidas

## Ambiente

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Variáveis obrigatórias para subir a aplicação:

- `DATABASE_URL`
- `JWT_PRIVATE_KEY`
- `JWT_PUBLIC_KEY`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `SYSTEM_USER_EMAIL`
- `SYSTEM_USER_NAME`
- `SYSTEM_USER_POSITION`

Variáveis opcionais:

- `PORT` (padrão `3333`)
- `AWS_S3_PREFIX` (padrão no exemplo: `campus-ativo`)
- `AWS_S3_SIGNED_URL_TTL` (padrão `900`, em segundos)

### Banco local

O `docker-compose.yml` usa as variáveis abaixo do próprio `.env`:

- `POSTGRES_CONTAINER_NAME`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`

O exemplo já monta a `DATABASE_URL` a partir delas.

### Chaves JWT

A aplicação espera `JWT_PRIVATE_KEY` e `JWT_PUBLIC_KEY` em Base64 do conteúdo PEM, não o PEM puro.

Exemplo para gerar localmente:

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
base64 -w 0 private.pem
base64 -w 0 public.pem
```

Cole o resultado de cada comando nas variáveis do `.env`.

### Usuário de sistema

Ao iniciar a aplicação, um usuário com papel `SYSTEM` é criado ou atualizado automaticamente com:

- `SYSTEM_USER_EMAIL`
- `SYSTEM_USER_NAME`
- `SYSTEM_USER_POSITION`

Esse bootstrap roda no start normal da API e não roda durante a geração do OpenAPI.

## Rodando localmente

1. Instale as dependências:

```bash
npm install
```

2. Crie o `.env`:

```bash
cp .env.example .env
```

3. Suba o PostgreSQL:

```bash
docker compose up -d
```

4. Aplique as migrations:

```bash
npx prisma migrate deploy
```

Se você estiver criando novas migrations durante desenvolvimento:

```bash
npx prisma migrate dev
```

5. Inicie a API:

```bash
npm run dev
```

Por padrão, a aplicação sobe em `http://localhost:3333`.

## Documentação da API

Com a aplicação rodando:

- Swagger UI: `http://localhost:3333/api`
- OpenAPI JSON servido pela aplicação: `http://localhost:3333/api-json`

Para regenerar o arquivo [`openapi.json`](./openapi.json):

```bash
npm run openapi
```

Esse comando compila o projeto e executa a aplicação em modo de geração de spec.

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
