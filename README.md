# IFAL Arapiraca Backend

API em NestJS para gerenciamento de problemas de infraestrutura do IFAL Arapiraca.
O sistema cobre autenticação, cadastro e gestão de usuários, problemas de manutenção,
categorias, localizações, anexos, métricas de dashboard e importação de registros a partir do Google Sheets.
Caso queira contribuir com novos componentes, melhorias e/ou correções no projeto, siga os passos do arquivo [CONTRIBUTING.md](./.github/docs/CONTRIBUTING.md).

## Stack

- Node.js `>=22.14.0 <23`
- NestJS `11`
- TypeScript
- Prisma `7`
- PostgreSQL `16`
- Vitest
- Swagger/OpenAPI

## O que a API faz

- autenticação com JWT
- cadastro e gestão de usuários com papéis `REPORTER`, `MANAGER`, `DIRECTOR` e `ADMIN`
- abertura, edição, descarte, restauração e remoção definitiva de problemas
- gestão de categorias e localizações com lixeira
- upload de anexos via ImgBB
- dashboard com métricas e relatório por período
- sincronização de problemas a partir de uma planilha do Google Sheets

## Estrutura do projeto

O projeto segue uma separação por domínio e infraestrutura:

```text
src/
  core/                          utilitários e abstrações compartilhadas
  domain/
    accounts/                    regras de negócio de usuários e autenticação
    maintenance-problems/        regras de negócio de problemas, categorias e locais
  infra/
    auth/                        JWT, guards e decorators
    database/                    Prisma, mappers e repositórios
    google-sheets/               integração de leitura com Google Sheets
    http/                        controllers, DTOs, presenters e pipes
    upload/                      integração de upload com ImgBB
prisma/
  schema.prisma                  schema do banco
  migrations/                    histórico de migrations
  seed.ts                        seed inicial
test/
  repositories/, factories/      doubles e suporte para testes unitários
```

Fluxo geral da aplicação:

1. `infra/http/controllers` recebe a requisição HTTP.
2. O controller chama um `use-case` em `domain/.../application/use-cases`.
3. O caso de uso depende de contratos de repositório/serviço.
4. `infra/database` e os módulos de integração implementam esses contratos.

## Modelo de domínio

Principais entidades persistidas:

- `User`
- `Problem`
- `Category`
- `Location`
- `Attachment`
- `ProblemHistory`
- `GoogleSheetImport`

Algumas regras relevantes já implementadas:

- cadastro de usuário aceita apenas emails com domínio `@ifal.edu.br` ou `@aluno.ifal.edu.br`
- senha deve ter no mínimo 6 caracteres, com ao menos 1 letra maiúscula e 1 número
- hierarquia de permissões por papel é controlada por guardas
- problemas, categorias e localizações possuem fluxo de lixeira antes de exclusão definitiva

## Variáveis de ambiente

Copie o arquivo [`.env.example`](./.env.example) para `.env`:

```bash
cp .env.example .env
```

Observações:

- `JWT_PRIVATE_KEY` e `JWT_PUBLIC_KEY` são obrigatórias para a API subir.
- `IMGBB_API_KEY` é obrigatória porque o módulo de upload usa ImgBB.
- `GOOGLE_SHEETS_CLIENT_EMAIL` e `GOOGLE_SHEETS_PRIVATE_KEY` são opcionais no boot, mas necessárias para o endpoint de sincronização com planilhas.

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Subir o PostgreSQL

```bash
docker compose up -d
```

Para verificar:

```bash
docker ps
```

Para parar:

```bash
docker compose stop
```

### 3. Criar e revisar o `.env`

```bash
cp .env.example .env
```

Preencha ao menos:

- `DATABASE_URL`
- `JWT_PRIVATE_KEY`
- `JWT_PUBLIC_KEY`
- `IMGBB_API_KEY`

### 4. Aplicar as migrations

Em ambiente local, a forma mais simples é:

```bash
npx prisma migrate dev
```

Se quiser apenas aplicar o histórico existente sem criar nova migration:

```bash
npx prisma migrate deploy
```

### 5. Popular dados iniciais

```bash
npm run prisma:seed
```

O seed cria um usuário interno do sistema com email `sistema@ifal-arapiraca.edu.br`, usado por fluxos internos de importação.

### 6. Iniciar a aplicação

```bash
npm run start:dev
```

Por padrão, a API sobe em `http://localhost:3333`.

## Documentação da API

Com a aplicação rodando:

- Swagger UI: `http://localhost:3333/api`
- OpenAPI JSON: `http://localhost:3333/api-json`

Para regenerar o arquivo [`openapi.json`](./openapi.json):

```bash
npm run openapi
```

## Scripts úteis

```bash
npm run start:dev      # desenvolvimento com watch
npm run build          # build de produção
npm run start:prod     # executa o build gerado
npm run lint           # lint com ESLint
npm run format         # formata src/, test/ e prisma/
npm run test           # testes com Vitest
npm run test:watch     # testes em watch mode
npm run test:cov       # cobertura de testes
npm run prisma:seed    # seed inicial
npm run openapi        # gera openapi.json
```

## Principais rotas

Os detalhes completos estão no Swagger, mas os grupos principais são:

- `/accounts` e `/sessions` para cadastro e login
- `/profile` e `/users` para perfil e administração de usuários
- `/problems` para ciclo de vida dos problemas
- `/categories` e `/locations` para cadastros auxiliares
- `/attachments` para upload de anexos
- `/dashboard/metrics` e `/dashboard/report` para indicadores
- `/integrations/google-sheet/sync` para importação via planilha

## Integrações externas

### ImgBB

O endpoint de upload envia imagens para o ImgBB usando `IMGBB_API_KEY`.

### Google Sheets

O sincronizador lê linhas de uma planilha Google Sheets e cria problemas automaticamente. O fluxo:

- ignora linhas já importadas
- exige categoria e localização previamente cadastradas
- cria anexo automaticamente quando a coluna de imagem contém uma URL válida

O formato esperado da planilha é:

```text
[Timestamp, Título, Descrição, Categoria, Localização, Imagem(opcional)]
```

## Testes

Os testes atuais são majoritariamente unitários e ficam próximos aos casos de uso em `src/domain/.../application/use-cases/*.spec.ts`, com apoio de repositórios em memória em `test/`.

Para executar:

```bash
npm run test
```

## Banco de dados

O projeto usa Prisma com PostgreSQL e o schema está em `prisma/schema.prisma`. As migrations versionadas estão em `prisma/migrations`.

## Observações de operação

- não existe script `npm run db:migrate`; use os comandos do Prisma diretamente
- a aplicação valida o ambiente no boot e falha se variáveis obrigatórias estiverem ausentes
- o `Dockerfile` atual inicia a aplicação com `npm run start:dev`
