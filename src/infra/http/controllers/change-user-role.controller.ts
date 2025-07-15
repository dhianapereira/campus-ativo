import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { ChangeUserRoleUseCase } from '@/domain/accounts/application/use-cases/change-user-role'
import { UnauthorizedRoleChangeError } from '@/domain/accounts/application/use-cases/errors/unauthorized-role-change-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

const changeUserRoleBodySchema = z.object({
  role: z.enum(['REPORTER', 'MANAGER', 'DIRECTOR', 'ADMIN']),
})

const bodyValidationPipe = new ZodValidationPipe(changeUserRoleBodySchema)

type ChangeUserRoleBodySchema = z.infer<typeof changeUserRoleBodySchema>

@Controller()
export class ChangeUserRoleController {
  constructor(private readonly changeUserRole: ChangeUserRoleUseCase) {}

  @Patch('/users/:id/role')
  @HttpCode(204)
  async handle(
    @Body(bodyValidationPipe) body: ChangeUserRoleBodySchema,
    @Param('id') targetUserId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const { role } = body

    const result = await this.changeUserRole.execute({
      currentUserId: user.sub,
      targetUserId,
      newRole: role as UserRole,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case UnauthorizedRoleChangeError:
          throw new ForbiddenException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
