import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { FetchUsersUseCase } from '@/domain/accounts/application/use-cases/fetch-users'
import { RequireMinRole } from '@/infra/auth/role-hierarchy.decorator'
import { RoleHierarchyGuard } from '@/infra/auth/role-hierarchy.guard'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { UserPresenter } from '../presenters/user-presenter'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@Controller('/users')
export class FetchUsersController {
  constructor(private fetchUsers: FetchUsersUseCase) {}

  @Get()
  @UseGuards(RoleHierarchyGuard)
  @RequireMinRole(UserRole.DIRECTOR)
  async handle(@Query('page', queryValidationPipe) page: PageQueryParamSchema) {
    const result = await this.fetchUsers.execute({ page })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const users = result.value.users

    return { users: users.map(UserPresenter.toHTTP) }
  }
}
