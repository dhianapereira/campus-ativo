import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { CreateProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/create-problem'

const createProblemBodySchema = z
  .object({
    title: z.string(),
    description: z.string(),
    location_id: z.string().transform((val) => val.trim()),
    category_id: z.string().transform((val) => val.trim()),
  })
  .transform((data) => ({
    ...data,
    locationId: data.location_id,
    categoryId: data.category_id,
  }))

const bodyValidationPipe = new ZodValidationPipe(createProblemBodySchema)

type CreateProblemBodySchema = z.infer<typeof createProblemBodySchema>

@Controller('/problems')
export class CreateProblemController {
  constructor(private readonly createProblem: CreateProblemUseCase) {}

  @Post()
  async handle(
    @Body(bodyValidationPipe) body: CreateProblemBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { title, description, locationId, categoryId } = body
    const userId = user.sub

    const result = await this.createProblem.execute({
      title,
      description,
      locationId,
      categoryId,
      reporterId: userId,
      attachmentsIds: [],
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
