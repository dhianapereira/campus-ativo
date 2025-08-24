import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
  Put,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { EditProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/edit-problem'
import { EditProblemRequest } from '../dtos/interfaces.dto'

const editProblemBodySchema = z.object({
  title: z.string(),
  description: z.string(),
})

const bodyValidationPipe = new ZodValidationPipe(editProblemBodySchema)

type EditProblemBodySchema = z.infer<typeof editProblemBodySchema>

@Controller('/problems/:id')
@ApiTags('Problems')
@ApiBearerAuth('JWT-auth')
export class EditProblemController {
  constructor(private editProblem: EditProblemUseCase) {}

  @Put()
  @HttpCode(204)
  @ApiOperation({ 
    summary: 'Editar problema', 
    description: 'Edita um problema existente. Apenas o criador do problema pode editá-lo.' 
  })
  @ApiParam({
    name: 'id',
    description: 'ID do problema a ser editado',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({ type: EditProblemRequest })
  @ApiResponse({ 
    status: 204, 
    description: 'Problema editado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou usuário não tem permissão' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  @ApiResponse({ status: 404, description: 'Problema não encontrado' })
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
