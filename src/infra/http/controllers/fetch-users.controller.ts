import {
  BadRequestException,
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common'
import { FetchUsersUseCase } from '@/domain/accounts/application/use-cases/fetch-users'
import { UserListPresenter } from '../presenters/user-list-presenter'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { Roles } from '@/infra/auth/roles.decorator'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

@Controller('/users')
@UseGuards(RolesGuard)
export class FetchUsersController {
  constructor(private readonly fetchUsers: FetchUsersUseCase) {}

  @Get()
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN)
  async handle() {
    const result = await this.fetchUsers.execute()

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    return { 
      users: result.value.users.map(UserListPresenter.toHTTP) 
    }
  }
}