import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { hash } from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { PrismaService } from '../database/prisma/prisma.service'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { EnvService } from '../env/env.service'

@Injectable()
export class SystemUserBootstrapService implements OnApplicationBootstrap {
  constructor(
    private prisma: PrismaService,
    private env: EnvService,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.OPENAPI_GENERATION === 'true') {
      return
    }

    const systemUser = {
      email: this.env.get('SYSTEM_USER_EMAIL'),
      name: this.env.get('SYSTEM_USER_NAME'),
      position: this.env.get('SYSTEM_USER_POSITION'),
    }

    const existingSystemUser =
      (await this.prisma.user.findFirst({
        where: { role: UserRole.SYSTEM },
      })) ??
      (await this.prisma.user.findUnique({
        where: { email: systemUser.email },
      }))

    if (!existingSystemUser) {
      await this.prisma.user.create({
        data: {
          ...systemUser,
          password: await hash(randomUUID(), 8),
          role: UserRole.SYSTEM,
          isActive: false,
        },
      })

      return
    }

    await this.prisma.user.update({
      where: {
        id: existingSystemUser.id,
      },
      data: {
        ...systemUser,
        role: UserRole.SYSTEM,
        isActive: false,
      },
    })
  }
}
