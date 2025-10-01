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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { EditUserProfileUseCase } from '@/domain/accounts/application/use-cases/edit-user-profile'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'

const editUserProfileBodySchema = z.object({
  name: z.string().min(1),
  position: z.string().min(1),
})

type EditUserProfileBodySchema = z.infer<typeof editUserProfileBodySchema>

@Controller('/users/:id/profile')
@ApiTags('User Profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EditUserProfileController {
  constructor(private readonly editUserProfile: EditUserProfileUseCase) {}

  @Patch()
  @ApiOperation({
    summary: 'Editar perfil do usuário',
    description: 'Edita o perfil do próprio usuário. Apenas o próprio usuário pode editar seu perfil.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário cujo perfil será editado',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({
    description: 'Dados do perfil a serem atualizados',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'João Silva',
          description: 'Nome completo do usuário'
        },
        position: {
          type: 'string',
          example: 'Técnico em Informática',
          description: 'Cargo do usuário'
        }
      },
      required: ['name', 'position']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Profile updated successfully' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos'
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou expirado'
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão para editar este perfil'
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado'
  })
  async handle(
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(editUserProfileBodySchema)) body: EditUserProfileBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { name, position } = body

    const result = await this.editUserProfile.execute({
      userId,
      executorId: user.sub,
      name,
      position,
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

    return { message: 'Profile updated successfully' }
  }
}
