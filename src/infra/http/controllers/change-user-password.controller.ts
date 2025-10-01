import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Patch,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { ChangeUserPasswordUseCase } from '@/domain/accounts/application/use-cases/change-user-password'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { WrongCredentialsError } from '@/domain/accounts/application/use-cases/errors/wrong-credentials-error'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'

const changeUserPasswordBodySchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

type ChangeUserPasswordBodySchema = z.infer<typeof changeUserPasswordBodySchema>

@Controller('/users/:id/password')
@ApiTags('User Profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChangeUserPasswordController {
  constructor(private readonly changeUserPassword: ChangeUserPasswordUseCase) {}

  @Patch()
  @ApiOperation({
    summary: 'Alterar senha do usuário',
    description: 'Altera a senha do próprio usuário. Apenas o próprio usuário pode alterar sua senha.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário cuja senha será alterada',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({
    description: 'Senha antiga e nova senha',
    schema: {
      type: 'object',
      properties: {
        oldPassword: {
          type: 'string',
          example: 'oldPassword123',
          description: 'Senha atual do usuário',
          minLength: 6
        },
        newPassword: {
          type: 'string',
          example: 'newPassword123',
          description: 'Nova senha do usuário',
          minLength: 6
        }
      },
      required: ['oldPassword', 'newPassword']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password changed successfully' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos'
  })
  @ApiResponse({
    status: 401,
    description: 'Senha antiga incorreta ou token JWT inválido'
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão para alterar esta senha'
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado'
  })
  async handle(
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(changeUserPasswordBodySchema)) body: ChangeUserPasswordBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { oldPassword, newPassword } = body

    const result = await this.changeUserPassword.execute({
      userId,
      executorId: user.sub,
      oldPassword,
      newPassword,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        case WrongCredentialsError:
          throw new UnauthorizedException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return { message: 'Password changed successfully' }
  }
}
