import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { defineConfig } from '@prisma/config'

dotenvExpand.expand(dotenv.config())

const fallbackDatabaseUrl =
  'postgresql://render:render@127.0.0.1:5432/render'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? fallbackDatabaseUrl,
  },
})
