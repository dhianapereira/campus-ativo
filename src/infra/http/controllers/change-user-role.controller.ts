import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
  UsePipes,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { UuidValidationPipe } from '@/infra/http/pipes/uuid-validation-pipe'
import { z } from 'zod'
import { ChangeUserRoleUseCase } from '@/domain/accounts/application/use-cases/change-user-role'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { CannotModifyOwnAccountError } from '@/core/errors/cannot-modify-own-account-error'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { Roles } from '@/infra/auth/roles.decorator'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

const changeUserRoleBodySchema = z.object({
  role: z.enum(['REPORTER', 'MANAGER', 'DIRECTOR', 'ADMIN']),
})

type ChangeUserRoleBodySchema = z.infer<typeof changeUserRoleBodySchema>

@Controller('/users/:id/role')
@ApiTags('User Management')
@UseGuards(RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ChangeUserRoleController {
  constructor(private readonly changeUserRole: ChangeUserRoleUseCase) {}

  @Patch()
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Alterar role do usuário',
    description:
      'Altera o role de um usuário. ADMIN pode alterar qualquer role, DIRECTOR pode alterar apenas para roles de nível igual ou inferior.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário cujo role será alterado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    description: 'Novo role para o usuário',
    schema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: ['REPORTER', 'MANAGER', 'DIRECTOR', 'ADMIN'],
          example: 'MANAGER',
        },
      },
      required: ['role'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Role alterado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Role updated successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão para esta operação',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  async handle(
    @Param('id') targetUserId: string,
    @Body(new ZodValidationPipe(changeUserRoleBodySchema))
    body: ChangeUserRoleBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { role } = body
    const currentUserRole = (user.role as UserRole) || UserRole.REPORTER

    const result = await this.changeUserRole.execute({
      targetUserId,
      newRole: role as UserRole,
      currentUserId: user.sub,
      currentUserRole,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        case CannotModifyOwnAccountError:
          throw new ForbiddenException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return { message: 'Role updated successfully' }
  }
}
