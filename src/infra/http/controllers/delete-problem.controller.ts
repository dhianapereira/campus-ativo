import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { DeleteProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/delete-problem'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

@Controller('/problems/:id')
@ApiTags('Problems')
@ApiBearerAuth('JWT-auth')
export class DeleteProblemController {
  constructor(private deleteProblem: DeleteProblemUseCase) {}

  @Delete()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Deletar problema',
    description:
      'Deleta um problema do sistema. Apenas o criador do problema pode deletá-lo.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do problema a ser deletado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Problema deletado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Usuário não tem permissão ou problema não encontrado',
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou expirado' })
  @ApiResponse({ status: 404, description: 'Problema não encontrado' })
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
      if (result.value instanceof ResourceNotFoundError) {
        throw new BadRequestException('Problem not found')
      }

      throw new BadRequestException(
        'O problema precisa estar na lixeira para ser excluido permanentemente',
      )
    }
  }
}
