import { BadRequestException, Body, Controller, Post } from '@nestjs/common'

import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { CreateLocationUseCase } from '@/domain/maintenance-problems/application/use-cases/create-location'

const createLocationBodySchema = z.object({
  name: z.string(),
  description: z.string(),
  code: z.string(),
})

const bodyValidationPipe = new ZodValidationPipe(createLocationBodySchema)

type CreateLocationBodySchema = z.infer<typeof createLocationBodySchema>

@Controller('/locations')
export class CreateLocationController {
  constructor(private readonly createLocation: CreateLocationUseCase) {}

  @Post()
  async handle(@Body(bodyValidationPipe) body: CreateLocationBodySchema) {
    const { name, description, code } = body

    const result = await this.createLocation.execute({
      name,
      description,
      code,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
