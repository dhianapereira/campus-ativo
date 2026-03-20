import * as dotenv from 'dotenv'
import * as dotenvExpand from 'dotenv-expand'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

dotenvExpand.expand(dotenv.config())

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

async function main() {
  // Criar usuário padrão do sistema
  const systemUserEmail = 'sistema@ifal-arapiraca.edu.br'
  const existingSystemUser = await prisma.user.findUnique({
    where: { email: systemUserEmail },
  })

  if (!existingSystemUser) {
    const hashedPassword = await hash('system_user_temp_password', 8)

    const systemUser = await prisma.user.create({
      data: {
        name: 'Sistema IFAL Arapiraca',
        position: 'Usuário do Sistema',
        email: systemUserEmail,
        password: hashedPassword,
        role: 'REPORTER',
        isActive: true,
      },
    })

    console.log('✓ Usuário do sistema criado:', systemUser.id)
  } else {
    console.log('✓ Usuário do sistema já existe')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
