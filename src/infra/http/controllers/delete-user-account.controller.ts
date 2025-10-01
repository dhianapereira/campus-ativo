import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { DeleteUserAccountUseCase } from '@/domain/accounts/application/use-cases/delete-user-account'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'

@Controller('/users/:id')
@ApiTags('User Profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DeleteUserAccountController {
  constructor(private readonly deleteUserAccount: DeleteUserAccountUseCase) {}

  @Delete()
  @ApiOperation({
    summary: 'Deletar conta do usuário',
    description: 'Deleta a conta do próprio usuário. Apenas o próprio usuário pode deletar sua conta.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário cuja conta será deletada',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Conta deletada com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Account deleted successfully' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou expirado'
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão para deletar esta conta'
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado'
  })
  async handle(
    @Param('id') userId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.deleteUserAccount.execute({
      userId,
      executorId: user.sub,
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

    return { message: 'Account deleted successfully' }
  }
}
