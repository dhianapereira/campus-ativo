import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common'

import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { CreateLocationUseCase } from '@/domain/maintenance-problems/application/use-cases/create-location'
import { RequireMinRole } from '@/infra/auth/role-hierarchy.decorator'
import { RoleHierarchyGuard } from '@/infra/auth/role-hierarchy.guard'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

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
  @UseGuards(RoleHierarchyGuard)
  @RequireMinRole(UserRole.MANAGER)
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
