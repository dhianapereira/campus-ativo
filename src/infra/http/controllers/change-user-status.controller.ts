import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
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
import { z } from 'zod'
import { ChangeUserStatusUseCase } from '@/domain/accounts/application/use-cases/change-user-status'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { CannotModifyOwnAccountError } from '@/core/errors/cannot-modify-own-account-error'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { Roles } from '@/infra/auth/roles.decorator'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import {
  GENERIC_INVALID_REQUEST_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
  USER_STATUS_FORBIDDEN_MESSAGE,
  USER_STATUS_SELF_FORBIDDEN_MESSAGE,
} from './controller-error-messages'

const changeUserStatusBodySchema = z.object({
  isActive: z.boolean(),
})

type ChangeUserStatusBodySchema = z.infer<typeof changeUserStatusBodySchema>

@Controller('/users/:id/status')
@ApiTags('User Management')
@UseGuards(RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ChangeUserStatusController {
  constructor(private readonly changeUserStatus: ChangeUserStatusUseCase) {}

  @Patch()
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Alterar status do usuário',
    description:
      'Ativa ou desativa um usuário no sistema. Requer permissão de DIRECTOR ou superior.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário cujo status será alterado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    description: 'Novo status do usuário',
    schema: {
      type: 'object',
      properties: {
        isActive: {
          type: 'boolean',
          example: true,
          description: 'true para ativar, false para desativar',
        },
      },
      required: ['isActive'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Status alterado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User status updated successfully',
        },
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
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(changeUserStatusBodySchema))
    body: ChangeUserStatusBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { isActive } = body
    const executorRole = (user.role as UserRole) || UserRole.REPORTER

    const result = await this.changeUserStatus.execute({
      userId,
      isActive,
      executorId: user.sub,
      executorRole,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(USER_NOT_FOUND_MESSAGE)
        case NotAllowedError:
          throw new ForbiddenException(USER_STATUS_FORBIDDEN_MESSAGE)
        case CannotModifyOwnAccountError:
          throw new ForbiddenException(USER_STATUS_SELF_FORBIDDEN_MESSAGE)
        default:
          throw new BadRequestException(GENERIC_INVALID_REQUEST_MESSAGE)
      }
    }

    return { message: 'User status updated successfully' }
  }
}
