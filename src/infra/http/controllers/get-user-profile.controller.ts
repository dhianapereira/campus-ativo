import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { GetUserProfileUseCase } from '@/domain/accounts/application/use-cases/get-user-profile'
import { UserPresenter } from '../presenters/user-presenter'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

@Controller('/users/:id/profile')
export class GetUserProfileController {
  constructor(
    private getUserProfile: GetUserProfileUseCase,
    private usersRepository: UsersRepository,
  ) {}

  @Get()
  async handle(@Param('id') userId: string, @CurrentUser() user: UserPayload) {
    // First check if the target user exists
    const result = await this.getUserProfile.execute({ userId })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const currentUser = await this.usersRepository.findById(user.sub)

    if (!currentUser) {
      throw new ForbiddenException('User not found')
    }

    // Usuário só pode ver seu próprio perfil, exceto Managers e superiores
    const isManager =
      currentUser.role === UserRole.MANAGER ||
      currentUser.role === UserRole.DIRECTOR ||
      currentUser.role === UserRole.ADMIN

    if (!isManager && currentUser.id.toString() !== userId) {
      throw new ForbiddenException('You can only view your own profile')
    }

    return { user: UserPresenter.toHTTP(result.value.user) }
  }
}
