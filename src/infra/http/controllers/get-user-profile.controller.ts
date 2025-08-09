import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
} from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { GetUserProfileUseCase } from '@/domain/accounts/application/use-cases/get-user-profile'
import { UserProfilePresenter } from '../presenters/user-profile-presenter'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

@Controller('/profile')
export class GetUserProfileController {
  constructor(private readonly getUserProfile: GetUserProfileUseCase) {}

  @Get()
  async handle(@CurrentUser() user: UserPayload) {
    const result = await this.getUserProfile.execute({
      userId: user.sub,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return { profile: UserProfilePresenter.toHTTP(result.value.user) }
  }
}