import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
} from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { DeleteProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/delete-problem'

@Controller('/problems/:id')
export class DeleteProblemController {
  constructor(private deleteProblem: DeleteProblemUseCase) {}

  @Delete()
  @HttpCode(204)
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
