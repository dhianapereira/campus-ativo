import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '@/auth/current-user-decorator'
import { JwtAuthGuard } from '@/auth/jwt-auth.guard'
import { UserPayload } from '@/auth/jwt.strategy'

import { ZodValidationPipe } from '@/pipes/zod-validation-pipe'
import { PrismaService } from '@/prisma/prisma.service'
import { z } from 'zod'

const createProblemBodySchema = z.object({
  title: z.string(),
  description: z.string(),
})

const bodyValidationPipe = new ZodValidationPipe(createProblemBodySchema)

type CreateProblemBodySchema = z.infer<typeof createProblemBodySchema>

@Controller('/problems')
@UseGuards(JwtAuthGuard)
export class CreateProblemController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async handle(
    @Body(bodyValidationPipe) body: CreateProblemBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { title, description } = body
    const userId = user.sub

    await this.prisma.problem.create({
      data: {
        userId,
        title,
        description,
      },
    })
  }
}
