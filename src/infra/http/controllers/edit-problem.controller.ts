import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
  Put,
} from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { EditProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/edit-problem'

const editProblemBodySchema = z.object({
  title: z.string(),
  description: z.string(),
})

const bodyValidationPipe = new ZodValidationPipe(editProblemBodySchema)

type EditProblemBodySchema = z.infer<typeof editProblemBodySchema>

@Controller('/problems/:id')
export class EditProblemController {
  constructor(private editProblem: EditProblemUseCase) {}

  @Put()
  @HttpCode(204)
  async handle(
    @Body(bodyValidationPipe) body: EditProblemBodySchema,
    @CurrentUser() user: UserPayload,
    @Param('id') problemId: string,
  ) {
    const { title, description } = body
    const userId = user.sub

    const result = await this.editProblem.execute({
      title,
      description,
      reporterId: userId,
      attachmentsIds: [],
      problemId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
