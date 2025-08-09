import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common'

import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { CreateCategoryUseCase } from '@/domain/maintenance-problems/application/use-cases/create-category'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { Roles } from '@/infra/auth/roles.decorator'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

const createCategoryBodySchema = z.object({
  name: z.string(),
  description: z.string(),
})

const bodyValidationPipe = new ZodValidationPipe(createCategoryBodySchema)

type CreateCategoryBodySchema = z.infer<typeof createCategoryBodySchema>

@Controller('/categories')
@UseGuards(RolesGuard)
export class CreateCategoryController {
  constructor(private readonly createCategory: CreateCategoryUseCase) {}

  @Post()
  @Roles(UserRole.MANAGER)
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
