import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

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