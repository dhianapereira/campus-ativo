import { BadRequestException, Body, Controller, Post } from '@nestjs/common'

import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { CreateCategoryUseCase } from '@/domain/maintenance-problems/application/use-cases/create-category'

const createCategoryBodySchema = z.object({
  name: z.string(),
  description: z.string(),
})

const bodyValidationPipe = new ZodValidationPipe(createCategoryBodySchema)

type CreateCategoryBodySchema = z.infer<typeof createCategoryBodySchema>

@Controller('/categories')
export class CreateCategoryController {
  constructor(private readonly createCategory: CreateCategoryUseCase) {}

  @Post()
  async handle(@Body(bodyValidationPipe) body: CreateCategoryBodySchema) {
    const { name, description } = body

    const result = await this.createCategory.execute({
      name,
      description,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
