import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Put,
  UseGuards,
  UsePipes,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { UuidValidationPipe } from '@/infra/http/pipes/uuid-validation-pipe'
import { z } from 'zod'
import { ChangeUserRoleUseCase } from '@/domain/accounts/application/use-cases/change-user-role'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { Roles } from '@/infra/auth/roles.decorator'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

const changeUserRoleBodySchema = z.object({
  role: z.enum(['REPORTER', 'MANAGER', 'DIRECTOR', 'ADMIN']),
})

type ChangeUserRoleBodySchema = z.infer<typeof changeUserRoleBodySchema>

@Controller('/users/:id/role')
@UseGuards(RolesGuard)
export class ChangeUserRoleController {
  constructor(private readonly changeUserRole: ChangeUserRoleUseCase) {}

  @Put()
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN)
  async handle(
    @Param('id') targetUserId: string,
    @Body(new ZodValidationPipe(changeUserRoleBodySchema)) body: ChangeUserRoleBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { role } = body
    const currentUserRole = (user.role as UserRole) || UserRole.REPORTER

    const result = await this.changeUserRole.execute({
      targetUserId,
      newRole: role as UserRole,
      currentUserRole,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return { message: 'Role updated successfully' }
  }
}