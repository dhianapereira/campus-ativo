import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { DeleteProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/delete-problem'
import { ResourceOwner } from '@/infra/auth/resource-owner.decorator'
import { ResourceOwnerGuard } from '@/infra/auth/resource-owner.guard'
import { Roles } from '@/infra/auth/roles.decorator'
import { RolesGuard } from '@/infra/auth/roles.guard'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

@Controller('/problems/:id')
export class DeleteProblemController {
  constructor(private deleteProblem: DeleteProblemUseCase) {}

  @Delete()
  @HttpCode(204)
  @UseGuards(RolesGuard, ResourceOwnerGuard)
  @Roles(UserRole.REPORTER, UserRole.MANAGER, UserRole.DIRECTOR, UserRole.ADMIN)
  @ResourceOwner('problem')
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('id') problemId: string,
  ) {
    const userId = user.sub

    const result = await this.deleteProblem.execute({
      problemId,
      reporterId: userId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
