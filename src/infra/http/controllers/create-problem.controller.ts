import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { UserPayload } from '@/infra/auth/jwt.strategy'

import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { CreateProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/create-problem'

const createProblemBodySchema = z.object({
  title: z.string(),
  description: z.string(),
})

const bodyValidationPipe = new ZodValidationPipe(createProblemBodySchema)

type CreateProblemBodySchema = z.infer<typeof createProblemBodySchema>

@Controller('/problems')
@UseGuards(JwtAuthGuard)
export class CreateProblemController {
  constructor(private readonly createProblem: CreateProblemUseCase) {}

  @Post()
  async handle(
    @Body(bodyValidationPipe) body: CreateProblemBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { title, description } = body
    const userId = user.sub

    await this.createProblem.execute({
      title,
      description,
      reporterId: userId,
      attachmentsIds: [],
    })
  }
}
