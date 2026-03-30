import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { GetUserProfileUseCase } from '@/domain/accounts/application/use-cases/get-user-profile'
import { UserProfilePresenter } from '../presenters/user-profile-presenter'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { UserProfileResponse } from '../dtos/interfaces.dto'
import {
  GENERIC_INVALID_REQUEST_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
} from './controller-error-messages'

@Controller('/profile')
@ApiTags('User Profile')
@ApiBearerAuth('JWT-auth')
export class GetUserProfileController {
  constructor(private readonly getUserProfile: GetUserProfileUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Obter perfil do usuário',
    description: 'Retorna as informações do perfil do usuário autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário retornado com sucesso',
    type: UserProfileResponse,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  async handle(@CurrentUser() user: UserPayload) {
    const result = await this.getUserProfile.execute({
      userId: user.sub,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(USER_NOT_FOUND_MESSAGE)
        default:
          throw new BadRequestException(GENERIC_INVALID_REQUEST_MESSAGE)
      }
    }

    return { profile: UserProfilePresenter.toHTTP(result.value.user) }
  }
}
